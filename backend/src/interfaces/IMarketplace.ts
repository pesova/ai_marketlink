export interface VerifyNinResponse {
  success: boolean;
  code: string;
  message: string;
  data: VerifyNinData;
}

export interface VerifyNinData {
  applicant: NinApplicant;
  summary: NinSummary;
  status: NinStatus;
  nin: NinDetails;
}

export interface NinApplicant {
  firstname: string;
  lastname: string;
}

export interface NinSummary {
  nin_check: NinCheck;
}

export interface NinCheck {
  status?: string;
  fieldMatches?: any;
}

export interface NinStatus {
  state: string;
  status: string;
}

export interface NinDetails {
  nin: string;
  phone: string;
  gender: 'm' | 'f' | string;
  photo: string; // base64 image string
  firstname: string;
  lastname: string;
  middlename?: string;
}