import { apiClient } from './axiosClient'

export const adminApi = {
  users: (params) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  user: (id) => apiClient.get(`/admin/users/${id}`).then((r) => r.data),
  deactivateUser: (id) => apiClient.put(`/admin/users/${id}/deactivate`).then((r) => r.data),
  activateUser: (id) => apiClient.put(`/admin/users/${id}/activate`).then((r) => r.data),
  hotelBookings: (params) => apiClient.get('/admin/bookings/hotel', { params }).then((r) => r.data),
  tourBookings: (params) => apiClient.get('/admin/bookings/tour', { params }).then((r) => r.data),
  payments: (params) => apiClient.get('/admin/payments', { params }).then((r) => r.data),
  assignRole: (payload) => apiClient.put(`/rbac/users/${payload.user_id}/role`, payload).then((r) => r.data),
  permissions: () => apiClient.get('/rbac/permissions').then((r) => r.data),
}

export const auditApi = {
  logs: (params) => apiClient.get('/audit/logs', { params }).then((r) => r.data),
  securityLogs: (params) => apiClient.get('/audit/security-logs', { params }).then((r) => r.data),
  activitySummary: () => apiClient.get('/audit/api-activity-summary').then((r) => r.data),
}

export const reportApi = {
  generate: (payload) => apiClient.post('/reports/generate', payload).then((r) => r.data),
  list: () => apiClient.get('/reports').then((r) => r.data),
  downloadUrl: (id) => `${apiClient.defaults.baseURL}/reports/${id}/download`,
}

export const analyticsApi = {
  admin: () => apiClient.get('/analytics/admin').then((r) => r.data),
  revenueTrend: (days = 30) => apiClient.get('/analytics/revenue-trend', { params: { days } }).then((r) => r.data),
  popularDestinations: (limit = 8) => apiClient.get('/analytics/popular-destinations', { params: { limit } }).then((r) => r.data),
  seasonalDemand: () => apiClient.get('/analytics/seasonal-demand').then((r) => r.data),
}

export const settingsApi = {
  list: (category) => apiClient.get('/settings', { params: { category } }).then((r) => r.data),
  upsert: (payload) => apiClient.put('/settings', payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/settings/${id}`).then((r) => r.data),
  platformInfo: () => apiClient.get('/settings/platform-info').then((r) => r.data),
}
