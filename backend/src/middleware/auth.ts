import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Vendor } from '../models/Vendor';
import { IRole } from '../models/Role';
import env from '../config/env';

interface AuthenticatedRequest extends Request {
  user?: IUser;
  vendor?: any;
}

// JWT Authentication Middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };

    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roleId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({
        success: false,
        message: 'Token expired.'
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Admin only
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const role = req.user.roleId as unknown as IRole;
  if (role.name !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }

  next();
};

// Vendor only — checks if user has a vendor profile
export const isVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor profile required.'
    });
  }

  req.vendor = vendor;
  next();
};

// Optional authentication — does not fail if no token
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roleId');

    if (user) req.user = user;

    next();
  } catch {
    next();
  }
};