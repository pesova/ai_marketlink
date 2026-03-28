// api.js — AI MarketLink
// Live backend: https://api-marketlink.pesovatech.xyz

const BASE_URL = import.meta.env.VITE_API_URL || "https://api-marketlink.pesovatech.xyz";

// ── Token helpers ──
export const getToken  = () => localStorage.getItem("ml_token");
export const setToken  = (t) => localStorage.setItem("ml_token", t);
export const removeToken = () => localStorage.removeItem("ml_token");
export const getUser   = () => { try { return JSON.parse(localStorage.getItem("ml_user")); } catch { return null; } };
export const setUser   = (u) => localStorage.setItem("ml_user", JSON.stringify(u));
export const removeUser= () => localStorage.removeItem("ml_user");
export const isLoggedIn= () => !!getToken();
export const getUserRole = () => getUser()?.role || null;

// ── Base request ──
const request = async (method, path, body = null, isFormData = false) => {
  const token = getToken();
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
export const authAPI = {
  register: (body) => request("POST", "/api/auth/register", body),

  login: async (email, password) => {
    const data = await request("POST", "/api/auth/login", { email, password });
    if (data.data?.token) { setToken(data.data.token); setUser(data.data.user); }
    return data;
  },

  verifyEmail:        (email, token)              => request("POST", "/api/auth/verify-email", { email, token }),
  resendVerification: (email)                     => request("POST", "/api/auth/resend-verification", { email }),
  forgotPassword:     (email)                     => request("POST", "/api/auth/forgot-password", { email }),
  verifyResetToken:   (email, token)              => request("POST", "/api/auth/verify-reset-token", { email, token }),
  resetPassword:      (email, token, newPassword) => request("POST", "/api/auth/reset-password", { email, token, newPassword, confirmPassword: newPassword }),
  getProfile:         ()                          => request("GET",  "/api/auth/profile"),

  logout: () => { removeToken(); removeUser(); return request("POST", "/api/auth/logout"); },
};

// ════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════
export const productsAPI = {
  // Get all products with optional filters
  getAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== null))
    ).toString();
    return request("GET", `/api/products${query ? `?${query}` : ""}`);
  },

  // Search products by keyword
  search: (q, limit = 20) =>
    request("GET", `/api/products/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  // Get single product
  getById: (id) => request("GET", `/api/products/${id}`),

  // Vendor: create product with image upload
  create: (formData) => request("POST", "/api/products", formData, true),

  // Vendor: update product
  update: (id, body) => request("PUT", `/api/products/${id}`, body),

  // Vendor: delete product
  delete: (id) => request("DELETE", `/api/products/${id}`),

  // Vendor: get own products
  getMyProducts: () => request("GET", "/api/products/vendor/my-products"),
};

// ════════════════════════════════════════
// VENDOR
// ════════════════════════════════════════
export const vendorAPI = {
  onboard:         (body) => request("POST",  "/api/vendors/onboard", body),
  onboardExisting: (body) => request("POST",  "/api/vendors/onboard/existing", body),
  getProfile:      ()     => request("GET",   "/api/vendors/profile"),
  updateBankDetails:(body)=> request("PATCH", "/api/vendors/bank-details", body),
  getProducts:     ()     => request("GET",   "/api/vendors/products"),
  getOrders:       ()     => request("GET",   "/api/vendors/orders"),
  getBalance:      ()     => request("GET",   "/api/vendors/balance"),
  getPublicProfile:(id)   => request("GET",   `/api/vendors/${id}`),
};

// ════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════
export const ordersAPI = {
  create:          (body)    => request("POST",  "/api/orders", body),
  getBuyerOrders:  ()        => request("GET",   "/api/orders"),
  getById:         (id)      => request("GET",   `/api/orders/${id}`),
  confirmDelivery: (id)      => request("PATCH", `/api/orders/${id}/confirm-delivery`),
  cancel:          (id)      => request("PATCH", `/api/orders/${id}/cancel`),
  markShipped:     (id)      => request("PATCH", `/api/orders/${id}/ship`),
};

// ════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════
export const paymentsAPI = {
  initiate:    (orderId)           => request("POST", "/api/payments/initiate", { orderId }),
  getEscrow:   (orderId)           => request("GET",  `/api/payments/escrow/${orderId}`),
  checkStatus: (reference, amount) => request("GET",  `/api/payments/status?reference=${reference}&amount=${amount}`),
};

// ════════════════════════════════════════
// CHAT (real backend AI)
// ════════════════════════════════════════
export const chatAPI = {
  sendMessage:  (message) => request("POST",   "/api/chat", { message }),
  getHistory:   ()        => request("GET",    "/api/chat"),
  clearHistory: ()        => request("DELETE", "/api/chat/history"),
};

// ════════════════════════════════════════
// ADMIN (requires JWT + admin role)
// ════════════════════════════════════════
export const adminAPI = {
  /** EscrowTransaction docs, populated order / buyer / vendor */
  getEscrows: () => request("GET", "/api/admin/escrows"),
  getUsers: (page = 1, limit = 50) =>
    request("GET", `/api/admin/users?page=${page}&limit=${limit}`),
  getOrders: (page = 1, limit = 100) =>
    request("GET", `/api/admin/orders?page=${page}&limit=${limit}`),
  getVendors: (page = 1, limit = 100) =>
    request("GET", `/api/admin/vendors?page=${page}&limit=${limit}`),
  getVendorBalances: (vendorId) =>
    request("GET", `/api/admin/vendor/${encodeURIComponent(vendorId)}/balances`),
  /** Body: { orderId, action } action is 'release' | 'refund' */
  resolveDispute: (orderId, action) =>
    request("POST", "/api/admin/dispute", { orderId, action }),
};