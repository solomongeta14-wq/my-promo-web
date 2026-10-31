import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const adminApi = {
  // Dashboard
  getStats: () => api.get('/admin/dashboard/stats'),
  getLowStock: () => api.get('/admin/dashboard/low-stock'),
  getOutOfStock: () => api.get('/admin/dashboard/out-of-stock'),
  getRecentSales: () => api.get('/admin/dashboard/recent-sales'),
  getAlerts: () => api.get('/admin/dashboard/alerts'),
  markAlertRead: (id: string) => api.put(`/admin/dashboard/alerts/${id}/read`),
  markAllAlertsRead: () => api.put('/admin/dashboard/alerts/read-all'),

  // Products
  getProducts: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  getProduct: (id: string) => api.get(`/admin/products/${id}`),
  createProduct: (data: unknown) => api.post('/admin/products', data),
  updateProduct: (id: string, data: unknown) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  uploadImage: (productId: string, data: { url: string; altText?: string; isPrimary?: boolean }) =>
    api.post(`/admin/products/${productId}/images`, data),
  deleteImage: (productId: string, imageId: string) => api.delete(`/admin/products/${productId}/images/${imageId}`),
  createVariant: (productId: string, data: unknown) => api.post(`/admin/products/${productId}/variants`, data),
  updateVariant: (variantId: string, data: unknown) => api.put(`/admin/products/variants/${variantId}`, data),
  deleteVariant: (variantId: string) => api.delete(`/admin/products/variants/${variantId}`),
  restockVariant: (productId: string, data: { variantId: string; quantity: number }) =>
    api.post(`/admin/products/${productId}/restock`, data),
  toggleNewArrival: (id: string) => api.put(`/admin/products/${id}/publish`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: unknown) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: unknown) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  // Brands
  getBrands: () => api.get('/admin/brands'),
  createBrand: (data: unknown) => api.post('/admin/brands', data),
  updateBrand: (id: string, data: unknown) => api.put(`/admin/brands/${id}`, data),
  deleteBrand: (id: string) => api.delete(`/admin/brands/${id}`),

  // Sales
  getSales: (params?: Record<string, unknown>) => api.get('/admin/sales', { params }),
  getSale: (id: string) => api.get(`/admin/sales/${id}`),
  createSale: (data: unknown) => api.post('/admin/sales', data),

  // Reports
  getDailyReport: (date?: string) => api.get('/admin/reports/daily', { params: { date } }),
  getWeeklyReport: (weekStart?: string) => api.get('/admin/reports/weekly', { params: { weekStart } }),
  getMonthlyReport: (month?: string) => api.get('/admin/reports/monthly', { params: { month } }),
  getTopProducts: (params?: Record<string, unknown>) => api.get('/admin/reports/top-products', { params }),
  getRevenueReport: (params?: Record<string, unknown>) => api.get('/admin/reports/revenue', { params }),

  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data: unknown) => api.post('/admin/users', data),
  updateUser: (id: string, data: unknown) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Activity logs
  getActivityLogs: (params?: Record<string, unknown>) => api.get('/admin/activity-logs', { params }),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: unknown) => api.put('/admin/settings', data),

  // Backups
  getBackups: () => api.get('/admin/backups'),
  createBackup: () => api.post('/admin/backup'),
  deleteBackup: (id: string) => api.delete(`/admin/backups/${id}`),

  // Email
  testEmail: () => api.post('/admin/test-email'),
}

export const shopApi = {
  getProducts: (params?: Record<string, unknown>) => api.get('/shop/products', { params }),
  getProduct: (id: string) => api.get(`/shop/products/${id}`),
  getCategories: () => api.get('/shop/categories'),
  getBrands: () => api.get('/shop/brands'),
  getNewArrivals: (limit?: number) => api.get('/shop/new-arrivals', { params: { limit } }),
  submitContact: (data: unknown) => api.post('/shop/contact', data),
  submitInquiry: (productId: string, data: unknown) => api.post(`/shop/inquiry/${productId}`, data),
}

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  register: (data: { email: string; password: string; name: string; role?: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
}