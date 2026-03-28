import env from './env';

export const mailConfig = {
  host: env.MAIL_HOST,
  port: Number(env.MAIL_PORT),
  authUser: env.MAIL_USER,
  authPassword: env.MAIL_PASS,
  fromName: env.MAIL_FROM,
};