// src/services/vendorService.js
import apiClient from '../utils/apiClient';

const unwrap = (res) => res.data?.data ?? res.data;

/**
 * Matches backend ProductCategoryEnum
 */
export const VENDOR_PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing & Fashion' },
  { value: 'books', label: 'Books' },
  { value: 'home', label: 'Home' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'sports', label: 'Sports' },
  { value: 'toys', label: 'Toys' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'health', label: 'Health' },
];

/** GET /vendors/profile */
export const fetchVendorProfile = async () => {
  const res = await apiClient.get('/vendors/profile');
  return unwrap(res);
};

/** GET /vendors/products */
export const fetchVendorProducts = async () => {
  const res = await apiClient.get('/vendors/products');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/** GET /vendors/orders */
export const fetchVendorOrders = async () => {
  const res = await apiClient.get('/vendors/orders');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

/** GET /vendors/balance */
export const fetchVendorBalance = async () => {
  const res = await apiClient.get('/vendors/balance');
  return unwrap(res);
};

/**
 * POST /products — multipart (image required)
 */
export const createVendorProduct = async ({
  name,
  description,
  price,
  category,
  quantity,
  imageFile,
}) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', String(price));
  formData.append('category', category);
  if (quantity != null && quantity !== '') {
    formData.append('quantity', String(quantity));
  }
  if (!imageFile) {
    throw new Error('Product image is required');
  }
  formData.append('image', imageFile);
  const res = await apiClient.post('/products', formData);
  return unwrap(res);
};

/** PUT /products/:id */
export const updateVendorProduct = async (productId, updates) => {
  const res = await apiClient.put(`/products/${productId}`, updates);
  return unwrap(res);
};

/** DELETE /products/:id */
export const deleteVendorProduct = async (productId) => {
  const res = await apiClient.delete(`/products/${productId}`);
  return unwrap(res);
};

/** PATCH /orders/:orderId/ship */
export const markVendorOrderShipped = async (orderId) => {
  const res = await apiClient.patch(`/orders/${orderId}/ship`);
  return unwrap(res);
};

/** PATCH /orders/:orderId/delivered */
export const markVendorOrderDelivered = async (orderId) => {
  const res = await apiClient.patch(`/orders/${orderId}/delivered`);
  return unwrap(res);
};

/** PATCH /vendors/bank-details */
export const updateVendorBankDetails = async (payload) => {
  const res = await apiClient.patch('/vendors/bank-details', payload);
  return unwrap(res);
};
