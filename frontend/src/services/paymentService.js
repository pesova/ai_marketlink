// src/services/paymentService.js
import apiClient from '../utils/apiClient';

/**
 * Initiates a payment with Interswitch.
 * payload should contain orderId and any required payment details.
 */
export const initiatePayment = async (orderId, paymentData) => {
  const response = await apiClient.post('/payments/initiate', {
    orderId,
    ...paymentData,
  });
  return response.data; // { paymentUrl, transactionId }
};

/**
 * Verify payment status after redirect/callback.
 */
export const verifyPayment = async (transactionId) => {
  const response = await apiClient.get(`/payments/verify/${transactionId}`);
  return response.data; // { status: 'SUCCESS' | 'FAILED', ... }
};
