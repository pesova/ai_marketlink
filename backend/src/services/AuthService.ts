import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { ClientSession } from "mongoose";
import { User, IUser } from "../models/User";
import { IRole, Role, RoleEnum } from "../models/Role";
import NotificationService from "./NotificationService";
import env from "../config/env";
import { NotificationCategoryEnum } from "../interfaces/INotification";
import { EmailTemplateEnum } from "./SmtpProvider";
import { PasswordReset } from "../models/PasswordReset";

class AuthService {
  private readonly jwtSecret = env.JWT_SECRET;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, env.JWT_SALT);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateAccessToken(user: IUser): string {
    return jwt.sign(
      { id: user._id, email: user.email, roleId: user.roleId },
      this.jwtSecret,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );
  }

  generateVerificationToken(): string {
    // 6-digit numeric token
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(
    userData: { name: string; email: string; password: string; phoneNumber: string },
    session?: ClientSession,
  ) {
    let existingQuery = User.findOne({ email: userData.email });
    if (session) {
      existingQuery = existingQuery.session(session);
    }
    const existingUser = await existingQuery;
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    let roleQuery = Role.findOne({ name: RoleEnum.USER });
    if (session) {
      roleQuery = roleQuery.session(session);
    }
    const role = await roleQuery;
    if (!role) {
      throw new Error("User role not found. Please run seeders first.");
    }

    const hashedPassword = await this.hashPassword(userData.password);
    const verificationToken = this.generateVerificationToken();

    const doc = {
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: hashedPassword,
      roleId: role._id,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    };

    if (session) {
      const [user] = await User.create([doc], { session });
      return { user, verificationToken };
    }

    const user = await User.create(doc);
    return { user, verificationToken };
  }

  async verifyEmail(
    email: string,
    token: string,
  ): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    if (user.emailVerificationToken !== token) {
      throw new Error("Invalid verification code");
    }

    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });

    // Save confirmation notification to DB
    await NotificationService.setTo({ userId: user._id })
      .setSubject("Email verified successfully")
      .setMessage("Your email has been verified. You can now log in.")
      .setCategory(NotificationCategoryEnum.AUTH)
      .sendToDB();

    return { message: "Email verified successfully. You can now log in." };
  }

  sendVerificationToken(user: IUser, verificationToken: string) {
    try {
      NotificationService.setTo({ email: user.email })
        .setSubject("Your AI MarketLink verification code")
        .setCategory(NotificationCategoryEnum.AUTH)
        .setDetails({ verificationToken })
        .useTemplate(EmailTemplateEnum.EMAIL_VERIFICATION_TOKEN, {
          name: user.name,
          token: verificationToken,
        })
        .sendViaEmail();
    } catch (error) {
      console.error("Verification email failed:", error);
    }
  }

  async resendVerificationToken(email: string): Promise<{ message: string, verificationToken?: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    const verificationToken = this.generateVerificationToken();

    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
    });

    await NotificationService.setTo({ userId: user._id, email: user.email })
      .setSubject("Your new AI MarketLink verification code")
      .setMessage(`Your new verification code is: ${verificationToken}`)
      .setCategory(NotificationCategoryEnum.AUTH)
      .setDetails({ verificationToken })
      .useTemplate(EmailTemplateEnum.EMAIL_VERIFICATION_TOKEN, {
        name: user.name,
        token: verificationToken,
      })
      .sendViaEmail();

    return { message: "A new verification code has been sent to your email.", verificationToken };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; role: string };
    access_token: string;
    expires_in: string;
  }> {
    const user = await User.findOne({ email })
      .select("+password")
      .populate("roleId");
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await this.comparePasswords(
      password,
      user.password,
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const access_token = this.generateAccessToken(user);
    const role = user.roleId as unknown as IRole;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: role.name,
      },
      access_token,
      expires_in: env.JWT_EXPIRES_IN,
    };
  }

  verifyToken(token: string): { id: string; email: string } | null {
    try {
      return jwt.verify(token, this.jwtSecret) as { id: string; email: string };
    } catch {
      return null;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string, token?: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      return { message: "If this email exists, a reset code has been sent." };
    }

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email });

    const resetToken = this.generateVerificationToken();

    await PasswordReset.create({
      email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    NotificationService.setTo({ email: user.email })
      .setSubject("Your AI MarketLink password reset code")
      .setCategory(NotificationCategoryEnum.AUTH)
      .setDetails({ resetToken })
      .useTemplate(EmailTemplateEnum.PASSWORD_RESET, {
        name: user.name,
        token: resetToken,
      })
      .sendViaEmail()
      .catch((err) => console.error("Password reset email failed:", err));

    return { message: "reset code has been sent.", token: resetToken };
  }

  async verifyResetToken(
    email: string,
    token: string,
  ): Promise<{ message: string }> {
    const resetRecord = await PasswordReset.findOne({
      email,
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset code");
    }

    return { message: "Reset code is valid." };
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const resetRecord = await PasswordReset.findOne({
      email,
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset code");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    await User.findByIdAndUpdate(user._id, {
      password: await this.hashPassword(newPassword),
    });

    // Delete the used reset record
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    await NotificationService.setTo({ userId: user._id })
      .setSubject("Password reset successfully")
      .setMessage(
        "Your password has been reset. If you did not do this, contact support immediately.",
      )
      .setCategory(NotificationCategoryEnum.AUTH)
      .sendToDB();

    return { message: "Password reset successfully. You can now log in." };
  }
}

export default new AuthService();
