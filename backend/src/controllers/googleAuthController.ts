import { Request, Response } from 'express';
import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { User } from '../models/User';
import { Role, RoleEnum } from '../models/Role';
import AuthService from "../services/AuthService";

export const googleRedirect = (req: Request, res: Response) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).send('Google OAuth configuration missing');
  }

  const nonce = crypto.randomBytes(16).toString('hex');  
  const state = jwt.sign(
    { nonce },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const error = req.query.error as string | undefined;
  if (error) {
    return res.redirect(`${env.FRONTEND_URL}/auth?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${env.FRONTEND_URL}/auth?error=missing_params`);
  }  
  try {
    jwt.verify(state, env.JWT_SECRET); // throws if tampered or expired
  } catch {
    return res.redirect(`${env.FRONTEND_URL}/auth?error=invalid_state`);
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

    const { email, name } = userInfoResp.data;
    if (!email) {
      return res.redirect(`${env.FRONTEND_URL}/auth?error=no_email`);
    }

    let user = await User.findOne({ email });
    const roleDoc = await Role.findOne({ name: RoleEnum.USER });
    if (!roleDoc) throw new Error('User role not found');

    if (!user) {
      const passwordHash = await bcrypt.hash(
        crypto.randomBytes(32).toString('hex'), // random password, not 'google'
        env.JWT_SALT
      );
      user = new User({
        name,
        email,
        password: passwordHash,
        roleId: roleDoc._id,
        phoneNumber: email,
        isEmailVerified: true,
      });
      await user.save();
    }

    const token = AuthService.generateAccessToken(user);
    // Redirect to frontend — token in query param (frontend reads & stores it)
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${env.FRONTEND_URL}/auth?error=oauth_failed`);
  }
};