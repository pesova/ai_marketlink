// src/services/productService.js
import apiClient from '../utils/apiClient';

/**
 * Fetch a paginated list of products with optional filters.
 * params: { page, limit, search, category, minPrice, maxPrice, availability }
 */
export const fetchProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data; // { items: [], total, page, limit }
};

/**
 * GET /products/:id — returns the product document (unwraps { success, data }).
 */
export const fetchProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  const body = response.data;
  const product = body?.data ?? body;
  if (!product?._id) {
    throw new Error(body?.message || 'Product not found');
  }
  return product;
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, updates) => {
  const response = await apiClient.put(`/products/${id}`, updates);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
};
