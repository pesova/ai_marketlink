const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const getGoogleAuthUrl = () => `${API_BASE_URL}/auth/google`;

export const OAUTH_ERROR_MESSAGES = {
  access_denied: "You cancelled Google sign-in.",
  missing_params: "Sign-in failed. Please try again.",
  invalid_state: "Sign-in session expired. Please try again.",
  no_email: "Google did not provide an email address for this account.",
  oauth_failed: "Google sign-in failed. Please try again.",
  config_missing: "Google sign-in is not configured on the server.",
  fetch_failed: "We could not load your profile. Please try logging in again.",
};

export function getOAuthErrorMessage(code) {
  return OAUTH_ERROR_MESSAGES[code] || "Something went wrong during sign-in.";
}
