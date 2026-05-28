import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          localStorage.setItem('token', data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  getMe: () => api.get('/auth/me'),
  updateProfile: d => api.put('/auth/profile', d),
  changePassword: d => api.put('/auth/change-password', d),
  changeEmail: d => api.put('/auth/change-email', d),
  forgotPassword: d => api.post('/auth/forgot-password', d),
  resetPassword: d => api.post('/auth/reset-password', d)
};

export const productAPI = {
  getAll: p => api.get('/products', { params: p }),
  getOne: id => api.get(`/products/${id}`),
  getRelated: id => api.get(`/products/${id}/related`),
  getCategories: () => api.get('/products/categories'),
  getSuggestions: q => api.get('/products/search/suggestions', { params: { q } }),
  create: d => api.post('/products', d),
  update: (id, d) => api.put(`/products/${id}`, d),
  delete: id => api.delete(`/products/${id}`)
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: d => api.post('/cart/add', d),
  update: d => api.put('/cart/update', d),
  remove: productId => api.delete(`/cart/item/${productId}`),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: d => api.post('/cart/coupon', d)
};

export const orderAPI = {
  place: d => api.post('/orders', d),
  getAll: () => api.get('/orders'),
  getOne: id => api.get(`/orders/${id}`),
  cancel: (id, d) => api.put(`/orders/${id}/cancel`, d),
  rate: (id, d) => api.put(`/orders/${id}/rate`, d)
};

export const addressAPI = {
  getAll: () => api.get('/addresses'),
  add: d => api.post('/addresses', d),
  update: (id, d) => api.put(`/addresses/${id}`, d),
  delete: id => api.delete(`/addresses/${id}`),
  getWishlist: () => api.get('/addresses/wishlist'),
  updateWishlist: d => api.post('/addresses/wishlist', d)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDbStats: () => api.get('/admin/db-stats'),
  getOrders: p => api.get('/admin/orders', { params: p }),
  updateOrderStatus: (id, d) => api.put(`/admin/orders/${id}/status`, d),
  getUsers: p => api.get('/admin/users', { params: p }),
  getProducts: p => api.get('/admin/products', { params: p }),
  createProduct: d => api.post('/admin/products', d),
  updateProduct: (id, d) => api.put(`/admin/products/${id}`, d),
  deleteProduct: id => api.delete(`/admin/products/${id}`),
  toggleProduct: id => api.patch(`/admin/products/${id}/toggle`),
  getDeliveryMap: () => api.get('/admin/delivery-map')
};

export default api;
