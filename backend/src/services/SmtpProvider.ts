import nodemailer from 'nodemailer';
import { mailConfig } from '../config/mail';

export enum EmailTemplateEnum {
  EMAIL_VERIFICATION_TOKEN = 'email_verification_token',
  PASSWORD_RESET = 'password_reset',
  ORDER_PLACED = 'order_placed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ESCROW_HELD = 'escrow_held',
  FUNDS_RELEASED = 'funds_released',
  VENDOR_ONBOARD = 'vendor_onboard',
}

export class SmtpProvider {
  private readonly transporter: nodemailer.Transporter;
  private fromValue: string = `${mailConfig.fromName} <${mailConfig.authUser}>`;
  private toValue!: string;
  private subjectValue!: string;
  private textValue!: string;
  private htmlValue!: string;

  public constructor() {
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: false,
      auth: {
        user: mailConfig.authUser,
        pass: mailConfig.authPassword,
      },
    });
  }

  public from(value: string) {
    this.fromValue = value;
    return this;
  }

  public to(value: string) {
    this.toValue = value;
    return this;
  }

  public subject(value: string) {
    this.subjectValue = value;
    return this;
  }

  public text(value: string) {
    this.textValue = value;
    return this;
  }

  public html(value: string) {
    this.htmlValue = value;
    return this;
  }

  public htmlView(template: EmailTemplateEnum, data: Record<string, any>) {
    this.htmlValue = this.renderTemplate(template, data);
    return this;
  }

  private renderTemplate(template: EmailTemplateEnum, data: Record<string, any>): string {
    const templates: Record<EmailTemplateEnum, (d: any) => string> = {
      [EmailTemplateEnum.EMAIL_VERIFICATION_TOKEN]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Welcome to AI MarketLink, ${d.name}!</h2>
          <p>Use the code below to verify your email address:</p>
          <div style="text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4F46E5;">
              ${d.token}
            </span>
          </div>
          <p>This code expires in 24 hours.</p>
          <p>If you did not create an account, ignore this email.</p>
        </div>
      `,
      [EmailTemplateEnum.PASSWORD_RESET]: (d) => `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2>Reset your password</h2>
            <p>Hi ${d.name}, use the code below to reset your password:</p>
            <div style="text-align:center;margin:24px 0;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4F46E5;">
                ${d.token}
              </span>
            </div>
            <p>This code expires in 1 hour.</p>
            <p>If you did not request a password reset, ignore this email.</p>
          </div>
        `,
      [EmailTemplateEnum.ORDER_PLACED]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Order Confirmed</h2>
          <p>Hi ${d.name}, your order has been placed successfully.</p>
          <p><strong>Order ID:</strong> ${d.orderId}</p>
          <p><strong>Product:</strong> ${d.productName}</p>
          <p><strong>Amount:</strong> ₦${d.amount}</p>
          <p>Your payment is securely held in escrow until you confirm delivery.</p>
        </div>
      `,
      [EmailTemplateEnum.ORDER_SHIPPED]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Your Order Has Been Shipped</h2>
          <p>Hi ${d.name}, your order is on its way!</p>
          <p><strong>Order ID:</strong> ${d.orderId}</p>
          <p><strong>Product:</strong> ${d.productName}</p>
          ${d.trackingNumber ? `<p><strong>Tracking:</strong> ${d.trackingNumber}</p>` : ''}
          <a href="${d.confirmUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
            Confirm Delivery
          </a>
        </div>
      `,
      [EmailTemplateEnum.ORDER_DELIVERED]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Delivery Confirmed</h2>
          <p>Hi ${d.name}, you have confirmed delivery of your order.</p>
          <p><strong>Order ID:</strong> ${d.orderId}</p>
          <p><strong>Product:</strong> ${d.productName}</p>
          <p>Funds have been released to the vendor. Thank you!</p>
        </div>
      `,
      [EmailTemplateEnum.ESCROW_HELD]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Payment Received - Funds in Escrow</h2>
          <p>Hi ${d.name}, a buyer placed an order for your product.</p>
          <p><strong>Order ID:</strong> ${d.orderId}</p>
          <p><strong>Product:</strong> ${d.productName}</p>
          <p><strong>Amount:</strong> ₦${d.amount}</p>
          <p>Please ship the item and mark the order as shipped.</p>
        </div>
      `,
      [EmailTemplateEnum.FUNDS_RELEASED]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Funds Released to Your Account</h2>
          <p>Hi ${d.name}, the buyer confirmed delivery.</p>
          <p><strong>Order ID:</strong> ${d.orderId}</p>
          <p><strong>Product:</strong> ${d.productName}</p>
          <p><strong>Amount Released:</strong> ₦${d.amount}</p>
        </div>
      `,
      [EmailTemplateEnum.VENDOR_ONBOARD]: (d) => `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Welcome Vendor, ${d.name}!</h2>
          <p>Your vendor profile for <strong>${d.businessName}</strong> has been created successfully.</p>
          <p>You can now start adding products and managing orders.</p>
        </div>
      `,
    };
    return templates[template](data);
  }

  public async send() {
    if (!this.toValue || !this.subjectValue) {
      throw new Error('Email recipient and subject are required.');
    }
    return await this.transporter.sendMail({
      from: this.fromValue,
      to: this.toValue,
      subject: this.subjectValue,
      text: this.textValue,
      html: this.htmlValue,
    });
  }
}
