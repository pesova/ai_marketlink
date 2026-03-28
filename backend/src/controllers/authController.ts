import { Request, Response } from "express";
import AuthService from "../services/AuthService";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
  forgotPasswordSchema,
} from "../validations/authValidator";
import env from "../config/env";
import { handleValidation } from "../middleware/validate";
import { Vendor } from "../models";

export const register = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(registerSchema, req.body);
    if (!data) return;

    const { user, verificationToken } = await AuthService.register(data);

    AuthService.sendVerificationToken(user, verificationToken);
    res.status(201).json({
      success: true,
      message: "Verification token sent to your email",
      devToken: env.NODE_ENV === "development" ? verificationToken : undefined,
    });
  } catch (error: any) {
    throw error
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(verifyEmailSchema, req.body);
    if (!data) return;

    const result = await AuthService.verifyEmail(data.email, data.token);

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    throw error
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(resendVerificationSchema, req.body);
    if (!data) return;

    const result = await AuthService.resendVerificationToken(data.email);

    res.json({ success: true, message: result.message, devToken: env.NODE_ENV === "development" ? result.verificationToken : undefined, });
  } catch (error: any) {
    throw error
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(loginSchema, req.body);
    if (!data) return;

    const authorization = await AuthService.login(data.email, data.password);

    res.json({
      success: true,
      message: "Login successful",
      data: authorization,
    });
  } catch (error: any) {
    throw error
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Fetch vendor linked to user
    const vendor = await Vendor.findOne({ user: user.id }).lean();

    res.json({
      success: true,
      message: "User profile",
      data: {
        user,
        vendorId: vendor?._id || null,
      },
    });
  } catch (error: any) {
    throw error;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(forgotPasswordSchema, req.body);

    const result = await AuthService.forgotPassword(data.email);
    res.json({
      success: true,
      message: result.message,
      devToken: env.NODE_ENV === "development" ? result.token : undefined, // Only for development
    });
  } catch (error: any) {
    throw error
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(verifyResetTokenSchema, req.body);

    const result = await AuthService.verifyResetToken(data.email, data.token);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    throw error
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(resetPasswordSchema, req.body);

    const { confirmPassword, ...resetData } = data;
    const result = await AuthService.resetPassword(
      resetData.email,
      resetData.token,
      resetData.newPassword,
    );

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    throw error
  }
};

export const logout = (req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out successfully" });
};