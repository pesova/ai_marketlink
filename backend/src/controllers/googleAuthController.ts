import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { User } from '../models/User';
import { IRole, Role, RoleEnum } from '../models/Role';
import AuthService from '../services/AuthService';
import GoogleOAuthStore from '../services/GoogleOAuthStore';
import { GoogleProfile } from '../interfaces/IGoogle';

function oauthCallbackUrl(query: string): string {
  return `${env.FRONTEND_URL}/auth/callback?${query}`;
}

function oauthErrorRedirect(error: string): string {
  return oauthCallbackUrl(`error=${encodeURIComponent(error)}`);
}

async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const { email, name, sub } = profile;
  const displayName = name?.trim() || email.split('@')[0];

  let user = await User.findOne({ email });

  if (user) {
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();
    }
    return user;
  }

  const roleDoc = await Role.findOne({ name: RoleEnum.USER });
  if (!roleDoc) {
    throw new Error('User role not found');
  }

  const passwordHash = await AuthService.hashPassword(
    crypto.randomBytes(32).toString('hex'),
  );

  try {
    return await User.create({
      name: displayName,
      email,
      password: passwordHash,
      roleId: roleDoc._id,
      phoneNumber: `google:${sub}`,
      isEmailVerified: true,
    });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      user = await User.findOne({ email });
      if (!user) throw err;

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
      }
      return user;
    }
    throw err;
  }
}

export const googleRedirect = async (req: Request, res: Response) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  await GoogleOAuthStore.storeStateNonce(nonce);

  const state = jwt.sign({ nonce }, env.JWT_SECRET, { expiresIn: '10m' });

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}` +
    '&response_type=code' +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${encodeURIComponent(state)}`;
  return res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const error = req.query.error as string | undefined;
  if (error) {
    return res.redirect(oauthErrorRedirect(error));
  }

  if (!code || !state) {
    return res.redirect(oauthErrorRedirect('missing_params'));
  }

  let nonce: string;
  try {
    const decoded = jwt.verify(state, env.JWT_SECRET) as { nonce: string };
    nonce = decoded.nonce;
  } catch {
    return res.redirect(oauthErrorRedirect('invalid_state'));
  }

  const stateValid = await GoogleOAuthStore.consumeStateNonce(nonce);
  if (!stateValid) {
    return res.redirect(oauthErrorRedirect('invalid_state'));
  }

  try {
    const tokenResp = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const { access_token } = tokenResp.data;
    const userInfoResp = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const { email, name, sub } = userInfoResp.data as GoogleProfile;
    if (!email || !sub) {
      return res.redirect(oauthErrorRedirect('no_email'));
    }

    const user = await findOrCreateGoogleUser({ email, name, sub });
    const exchangeCode = await GoogleOAuthStore.createExchangeCode(
      user._id.toString(),
    );
    return res.redirect(oauthCallbackUrl(`code=${encodeURIComponent(exchangeCode)}`));
  } catch (err) {
    return res.redirect(oauthErrorRedirect('oauth_failed'));
  }
};

export const googleExchange = async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required',
    });
  }

  const userId = await GoogleOAuthStore.consumeExchangeCode(code);
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired authorization code',
    });
  }

  const user = await User.findById(userId).populate('roleId');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const access_token = AuthService.generateAccessToken(user);
  const role = user.roleId as unknown as IRole;
  return res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: role.name,
      },
      access_token,
      expires_in: env.JWT_EXPIRES_IN,
    },
  });
};
