import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import { ValidationError } from '../middleware/validate';

const isDev = env.NODE_ENV === 'development';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err.message);

  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let errors: any[] = [];

  if (err instanceof ValidationError) {
    return res.status(422).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(isDev && {
        stack: err.stack,
        path: `${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
      })
    });
  }

  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    errors = [{ field, message: `${field} already exists` }];
  }

  else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  else if (err.message === 'Invalid webhook signature') {
    return res.sendStatus(401);
  }

  else if (err.message === 'Missing signature header') {
    return res.sendStatus(400);
  }

  else if (err.name === 'MulterError') {
    status = 422;
    message = err.message;
  }

  const response: Record<string, any> = { success: false, message };

  if (errors.length > 0) response.errors = errors;

  if (isDev) {
    response.stack = err.stack;
    response.path = `${req.method} ${req.originalUrl}`;
    response.timestamp = new Date().toISOString();
  }

  return res.status(status).json(response);
};