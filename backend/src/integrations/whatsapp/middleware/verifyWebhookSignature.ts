import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import env from '../../../config/env';


export function verifyRequestSignature(
  req: Request,
  res: Response,
  buf: Buffer,
) {
  let signature = req.headers["x-hub-signature-256"] as string;

  if (!signature) {
    throw new Error("Missing signature header");
  }
  
  let elements = signature.split("=");
  let signatureHash = elements[1];
  let expectedHash = crypto
    .createHmac("sha256", env.WHATSAPP_APP_SECRET)
    .update(buf)
    .digest("hex");
  if (signatureHash != expectedHash) {
    throw new Error("Invalid webhook signature");
  }
}