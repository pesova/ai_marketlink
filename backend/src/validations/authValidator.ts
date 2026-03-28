import { z } from 'zod';

// User registration validation schema
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 11 characters long')
    .max(15, 'Phone number cannot exceed 11 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});

// User login validation schema
export const loginSchema = z.object({
  email: z
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.email('Please provide a valid email address'),
  token: z.string().length(6, 'Verification code must be 6 digits'),
});

export const resendVerificationSchema = z.object({
  email: z.email('Please provide a valid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Please provide a valid email address'),
});

export const verifyResetTokenSchema = z.object({
  email: z.email('Please provide a valid email address'),
  token: z.string().length(6, 'Reset code must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.email('Please provide a valid email address'),
  token: z.string().length(6, 'Reset code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});