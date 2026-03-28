// src/services/chatService.js
import apiClient from '../utils/apiClient';

/**
 * Sends a user message to the AI chat endpoint.
 * Returns the structured response containing suggested products, filters, etc.
 */
export const sendChatMessage = async (message, context = {}) => {
  const response = await apiClient.post('/chat', { message, ...context });
  return response.data;
};

export const getHistory = async () => {
  const response = await apiClient.get('/chat');
  return response.data;
};

export const clearHistory = async () => {
  const response = await apiClient.delete('/chat/history');
  return response.data;
};
