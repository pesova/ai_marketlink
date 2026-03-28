import axios, { AxiosResponse } from 'axios';
import env from '../../config/env';
import InterswitchAuth from './InterswitchAuth';
import { VerifyNinResponse } from '../../interfaces/IMarketplace';

interface NinVerificationPayload {
  firstName: string;
  lastName: string;
  nin: string;
}

interface NinVerificationResponse {
  verified: boolean;
  data?: Record<string, any>;
  message?: string;
}

class NinService {
  private readonly baseUrl = env.INTERSWITCH_MARKETPLACE_API_URL;

  async verifyNin(payload: NinVerificationPayload): Promise<NinVerificationResponse> {
    try {
        const token = await InterswitchAuth.getToken('marketplace');    
        const response: AxiosResponse<VerifyNinResponse> = await axios.post(
          `${this.baseUrl}/marketplace-routing/api/v1/verify/identity/nin`,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            nin: payload.nin
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );        
        if(response.data?.data === null) {
            // TODO: no valid NIN for dev
          return {
            verified: false,
            message: response.data?.message
          };
        }
    
        return {
          verified: true,
          data: response.data,
          message: 'NIN verified successfully'
        };
        
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'NIN verification service error';
      return {
        verified: false,
        message: msg,
      };
    }
  }
}

export default new NinService();