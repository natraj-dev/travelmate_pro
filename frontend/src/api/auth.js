import { apiClient } from './axiosClient'

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
  logout: (refresh_token) => apiClient.post('/auth/logout', { refresh_token }).then((r) => r.data),
  logoutAll: () => apiClient.post('/auth/logout-all').then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, new_password) => apiClient.post('/auth/reset-password', { token, new_password }).then((r) => r.data),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }).then((r) => r.data),
  resendVerification: () => apiClient.post('/auth/resend-verification').then((r) => r.data),
  changePassword: (payload) => apiClient.post('/auth/change-password', payload).then((r) => r.data),
  sessions: () => apiClient.get('/sessions').then((r) => r.data),
  revokeSession: (id) => apiClient.delete(`/sessions/${id}`).then((r) => r.data),
}

export const profileApi = {
  get: () => apiClient.get('/profile/me').then((r) => r.data),
  update: (payload) => apiClient.put('/profile/me', payload).then((r) => r.data),
  uploadPicture: (file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/profile/me/picture', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  getPreferences: () => apiClient.get('/profile/me/preferences').then((r) => r.data),
  updatePreferences: (preferences) => apiClient.put('/profile/me/preferences', preferences).then((r) => r.data),
}

export const addressApi = {
  list: () => apiClient.get('/addresses').then((r) => r.data),
  create: (payload) => apiClient.post('/addresses', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/addresses/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/addresses/${id}`).then((r) => r.data),
  setPrimary: (id) => apiClient.put(`/addresses/${id}/primary`).then((r) => r.data),
}
