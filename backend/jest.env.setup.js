/**
 * Runs before any test file or module is loaded.
 * Satisfies env.validate() in src/config/env.ts and keeps tests deterministic.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-jest-suite';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_SALT = '10';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/jest-placeholder';
process.env.MAIL_USER = 'test@example.com';
process.env.MAIL_PASS = 'test-mail-pass';
process.env.INTERSWITCH_CLIENT_ID = 'jest-client-id';
process.env.INTERSWITCH_CLIENT_SECRET = 'jest-client-secret';
process.env.INTERSWITCH_MARKETPLACE_CLIENT_ID = 'jest-marketplace-client-id';
process.env.INTERSWITCH_MARKETPLACE_CLIENT_SECRET = 'jest-marketplace-client-secret';
process.env.OPENAI_API_KEY = 'sk-test-openai';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.INTERSWITCH_MERCHANT_CODE = 'MERCH001';
process.env.INTERSWITCH_PAYABLE_CODE = 'PAY001';
