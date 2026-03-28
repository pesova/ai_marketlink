import axios from "axios";
import env from "../../config/env";

type InterswitchClientType = "developer" | "marketplace";

interface InterswitchToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

class InterswitchAuth {
  private cache: Record<InterswitchClientType, TokenCache | null> = {
    developer: null,
    marketplace: null,
  };

  private getCredentials(type: InterswitchClientType) {
    if (type === "marketplace") {
      return {
        clientId: env.INTERSWITCH_MARKETPLACE_CLIENT_ID,
        clientSecret: env.INTERSWITCH_MARKETPLACE_CLIENT_SECRET,
        baseUrl: env.INTERSWITCH_MARKETPLACE_BASE_URL
      };
    }
    return {
      clientId: env.INTERSWITCH_CLIENT_ID,
      clientSecret: env.INTERSWITCH_CLIENT_SECRET,
      baseUrl: env.INTERSWITCH_API_URL
    };
  }

  private getBasicAuth(clientId: string, clientSecret: string): string {
    return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  }

  async getToken(type: InterswitchClientType = "developer"): Promise<string> {
    const cached = this.cache[type];
    // TODO: cache token with MAp
    // Return cached token if still valid with 60s buffer
    if (cached && Date.now() < cached.expiresAt - 60000) {
      return cached.token;
    }

    const { clientId, clientSecret, baseUrl } = this.getCredentials(type);

    const response = await axios.post<InterswitchToken>(
      `${baseUrl}/passport/oauth/token?grant_type=client_credentials`,
      new URLSearchParams({
        scope: "profile",
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${this.getBasicAuth(clientId, clientSecret)}`,
        },
      },
    );    
    this.cache[type] = {
      token: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };

    return this.cache[type]!.token;
  }
}

export default new InterswitchAuth();
