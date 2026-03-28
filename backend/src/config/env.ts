import dotenv from "dotenv";
dotenv.config();

interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;

  ALLOWED_ORIGINS: string[];
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_SALT: number;

  FRONTEND_URL: string;

  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASS: string;
  MAIL_FROM: string;

  INTERSWITCH_CLIENT_ID: string;
  INTERSWITCH_CLIENT_SECRET: string;
  INTERSWITCH_API_URL: string;

  INTERSWITCH_MARKETPLACE_CLIENT_ID: string;
  INTERSWITCH_MARKETPLACE_CLIENT_SECRET: string;
  INTERSWITCH_MARKETPLACE_BASE_URL: string;
  INTERSWITCH_MARKETPLACE_API_URL: string;
  INTERSWITCH_CALLBACK_URL: string;
  INTERSWITCH_PAYABLE_CODE: string;
  INTERSWITCH_MERCHANT_CODE: string;

  OPENAI_API_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  ADMIN_PASSWORD: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;

  /** Days after "delivered / pending confirmation" before escrow auto-releases if the buyer never confirms */
  ESCROW_AUTO_RELEASE_DAYS: number;
}

class EnvConfig {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      PORT: this.getNumber("PORT", 5000),
      NODE_ENV: this.getString("NODE_ENV", "development"),

      ALLOWED_ORIGINS: this.getString("ALLOWED_ORIGINS", "").split(","),
      MONGODB_URI: this.getString(
        "MONGODB_URI",
        "mongodb://localhost:27017/ai-marketlink",
      ),

      JWT_SECRET: this.getString(
        "JWT_SECRET",
        "fallback_secret_key_change_in_production",
      ),
      JWT_EXPIRES_IN: this.getString("JWT_EXPIRES_IN", "24h"),
      JWT_SALT: this.getNumber("JWT_SALT", 10),

      FRONTEND_URL: this.getString("FRONTEND_URL", "http://localhost:5173"),

      MAIL_HOST: this.getString("MAIL_HOST", "smtp.gmail.com"),
      MAIL_PORT: this.getNumber("MAIL_PORT", 587),
      MAIL_USER: this.getString("MAIL_USER", ""),
      MAIL_PASS: this.getString("MAIL_PASS", ""),
      MAIL_FROM: this.getString("MAIL_FROM", "AI MarketLink"),

      INTERSWITCH_CLIENT_ID: this.getString("INTERSWITCH_CLIENT_ID", ""),
      INTERSWITCH_CLIENT_SECRET: this.getString(
        "INTERSWITCH_CLIENT_SECRET",
        "",
      ),
      INTERSWITCH_API_URL: this.getString(
        "INTERSWITCH_API_URL",
        "https://api-marketplace-routing.k8.isw.la",
      ),
      INTERSWITCH_CALLBACK_URL: this.getString(
        "INTERSWITCH_CALLBACK_URL",
        "http://localhost:5000/",
      ),
      INTERSWITCH_PAYABLE_CODE: this.getString(
        "INTERSWITCH_PAYABLE_CODE",
        "",
      ),
      INTERSWITCH_MARKETPLACE_CLIENT_ID: this.getString(
        "INTERSWITCH_MARKETPLACE_CLIENT_ID",
        "",
      ),
      INTERSWITCH_MARKETPLACE_CLIENT_SECRET: this.getString(
        "INTERSWITCH_MARKETPLACE_CLIENT_SECRET",
        "",
      ),
      INTERSWITCH_MARKETPLACE_BASE_URL: this.getString(
        "INTERSWITCH_MARKETPLACE_BASE_URL",
        "https://qa.interswitchng.com",
      ),
      INTERSWITCH_MARKETPLACE_API_URL: this.getString(
        "INTERSWITCH_MARKETPLACE_API_URL",
        "https://api-marketplace-routing.k8.isw.la",
      ),
      INTERSWITCH_MERCHANT_CODE: this.getString(
        "INTERSWITCH_MERCHANT_CODE",
        "",
      ),
      CLOUDINARY_API_SECRET: this.getString("CLOUDINARY_API_SECRET", ""),
      CLOUDINARY_API_KEY: this.getString("CLOUDINARY_API_KEY", ""),
      CLOUDINARY_CLOUD_NAME: this.getString("CLOUDINARY_CLOUD_NAME", ""),
      OPENAI_API_KEY: this.getString("OPENAI_API_KEY", ""),
      ADMIN_PASSWORD: this.getString("ADMIN_PASSWORD", ""),
      WHATSAPP_ACCESS_TOKEN: this.getString("WHATSAPP_ACCESS_TOKEN", ""),
      WHATSAPP_PHONE_NUMBER_ID: this.getString("WHATSAPP_PHONE_NUMBER_ID", ""),
      WHATSAPP_VERIFY_TOKEN: this.getString("WHATSAPP_VERIFY_TOKEN", ""),
      WHATSAPP_APP_SECRET: this.getString("WHATSAPP_APP_SECRET", ""),
      REDIS_URL: this.getString("REDIS_URL", ""),
      REDIS_HOST: this.getString("REDIS_HOST", ""),
      REDIS_PORT: this.getNumber("REDIS_PORT", 6379),
      ESCROW_AUTO_RELEASE_DAYS: this.getNumber("ESCROW_AUTO_RELEASE_DAYS", 7),
    };
  }

  private getString(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(
        `Warning: Invalid number for ${key}, using default: ${defaultValue}`,
      );
      return defaultValue;
    }

    return parsed;
  }

  get PORT(): number {
    return this.config.PORT;
  }
  get NODE_ENV(): string {
    return this.config.NODE_ENV;
  }
  get ALLOWED_ORIGINS(): string[] {
    return this.config.ALLOWED_ORIGINS;
  }
  get MONGODB_URI(): string {
    return this.config.MONGODB_URI;
  }
  get JWT_SECRET(): string {
    return this.config.JWT_SECRET;
  }
  get JWT_SALT(): number {
    return this.config.JWT_SALT;
  }
  get JWT_EXPIRES_IN(): string {
    return this.config.JWT_EXPIRES_IN;
  }
  get FRONTEND_URL(): string {
    return this.config.FRONTEND_URL;
  }
  get MAIL_HOST(): string {
    return this.config.MAIL_HOST;
  }
  get MAIL_PORT(): number {
    return this.config.MAIL_PORT;
  }
  get MAIL_USER(): string {
    return this.config.MAIL_USER;
  }
  get MAIL_PASS(): string {
    return this.config.MAIL_PASS;
  }
  get MAIL_FROM(): string {
    return this.config.MAIL_FROM;
  }

  get INTERSWITCH_CLIENT_ID(): string {
    return this.config.INTERSWITCH_CLIENT_ID;
  }
  get INTERSWITCH_CLIENT_SECRET(): string {
    return this.config.INTERSWITCH_CLIENT_SECRET;
  }
  get INTERSWITCH_API_URL(): string {
    return this.config.INTERSWITCH_API_URL;
  }
  get INTERSWITCH_CALLBACK_URL(): string {
    return this.config.INTERSWITCH_CALLBACK_URL;
  }
  get INTERSWITCH_MERCHANT_CODE(): string {
    return this.config.INTERSWITCH_MERCHANT_CODE;
  }
  get INTERSWITCH_PAYABLE_CODE(): string {
    return this.config.INTERSWITCH_PAYABLE_CODE;
  }
  get INTERSWITCH_MARKETPLACE_CLIENT_ID(): string {
    return this.config.INTERSWITCH_MARKETPLACE_CLIENT_ID;
  }
  get INTERSWITCH_MARKETPLACE_CLIENT_SECRET(): string {
    return this.config.INTERSWITCH_MARKETPLACE_CLIENT_SECRET;
  }
  get INTERSWITCH_MARKETPLACE_BASE_URL(): string {
    return this.config.INTERSWITCH_MARKETPLACE_BASE_URL;
  }
  get INTERSWITCH_MARKETPLACE_API_URL(): string {
    return this.config.INTERSWITCH_MARKETPLACE_API_URL;
  }
  get OPENAI_API_KEY(): string {
    return this.config.OPENAI_API_KEY;
  }

  get CLOUDINARY_CLOUD_NAME(): string {
    return this.config.CLOUDINARY_CLOUD_NAME;
  }

  get CLOUDINARY_API_KEY(): string {
    return this.config.CLOUDINARY_API_KEY;
  }

  get ADMIN_PASSWORD(): string {
    return this.config.ADMIN_PASSWORD;
  }

  // WhatsApp integration vars
  get WHATSAPP_ACCESS_TOKEN(): string {
    return this.config.WHATSAPP_ACCESS_TOKEN;
  }
  get WHATSAPP_PHONE_NUMBER_ID(): string {
    return this.config.WHATSAPP_PHONE_NUMBER_ID;
  }
  get WHATSAPP_VERIFY_TOKEN(): string {
    return this.config.WHATSAPP_VERIFY_TOKEN;
  }
  get WHATSAPP_APP_SECRET(): string {
    return this.config.WHATSAPP_APP_SECRET;
  }
  get REDIS_URL(): string {
    return this.config.REDIS_URL;
  }

  get REDIS_HOST(): string {
    return this.config.REDIS_HOST;
  }

  get REDIS_PORT(): number {
    return this.config.REDIS_PORT;
  }

  get ESCROW_AUTO_RELEASE_DAYS(): number {
    return this.config.ESCROW_AUTO_RELEASE_DAYS;
  }

  get CLOUDINARY_API_SECRET(): string {
    return this.config.CLOUDINARY_API_SECRET;
  }

  public validate(): void {
    const required = [
      "MONGODB_URI",
      "JWT_SECRET",
      "MAIL_USER",
      "MAIL_PASS",
      "INTERSWITCH_CLIENT_ID",
      "INTERSWITCH_CLIENT_SECRET",
      "INTERSWITCH_MARKETPLACE_CLIENT_ID",
      "INTERSWITCH_MARKETPLACE_CLIENT_SECRET",
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_VERIFY_TOKEN",
      "WHATSAPP_APP_SECRET",
      "REDIS_URL",
    ];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Warning: Missing required environment variables: ${missing.join(", ")}`,
      );
    }
  }
}

const env = new EnvConfig();
env.validate();

export default env;
