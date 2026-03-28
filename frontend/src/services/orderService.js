// src/services/orderService.js
import apiClient from '../utils/apiClient';

export const createOrder = async (orderPayload) => {
  const response = await apiClient.post('/orders', orderPayload);
  return response.data;
};

/**
 * @returns {Promise<object>} Created order document
 */
export const createOrderOrThrow = async (orderPayload) => {
  const body = await createOrder(orderPayload);
  const order = body?.data;
  if (!body?.success || !order?._id) {
    const msg =
      body?.message ||
      (Array.isArray(body?.errors) && body.errors.map((e) => e.message).filter(Boolean).join(', ')) ||
      'Could not create order';
    throw new Error(msg);
  }
  return order;
};

export const fetchUserOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  const body = response.data ?? {};
  const orders = body.data?.orders;
  const items = Array.isArray(orders) ? orders : body.items ?? [];
  return { ...body, items };
};

export const fetchVendorOrders = async (params = {}) => {
  const response = await apiClient.get('/vendors/orders', { params });
  const inner = response.data?.data;
  return Array.isArray(inner) ? inner : [];
};

export const markOrderShipped = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/ship`);
  return response.data;
};

export const confirmBuyerDelivery = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/confirm-delivery`);
  return response.data;
};
