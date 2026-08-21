import { apiClient } from './axiosClient'

export const tourApi = {
  search: (params) => apiClient.get('/tours/search', { params }).then((r) => r.data),
  list: (params) => apiClient.get('/tour-packages', { params }).then((r) => r.data),
  mine: () => apiClient.get('/tour-packages/mine').then((r) => r.data),
  get: (id) => apiClient.get(`/tour-packages/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/tour-packages', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/tour-packages/${id}`, payload).then((r) => r.data),
  publish: (id, publish = true) => apiClient.put(`/tour-packages/${id}/publish`, null, { params: { publish } }).then((r) => r.data),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/tour-packages/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  schedules: (packageId, upcomingOnly = true) =>
    apiClient.get(`/tour-schedules/package/${packageId}`, { params: { upcoming_only: upcomingOnly } }).then((r) => r.data),
  createSchedule: (payload) => apiClient.post('/tour-schedules', payload).then((r) => r.data),
  updateSchedule: (id, params) => apiClient.put(`/tour-schedules/${id}`, null, { params }).then((r) => r.data),
  cancelSchedule: (id) => apiClient.delete(`/tour-schedules/${id}`).then((r) => r.data),
}

export const tourBookingApi = {
  create: (payload) => apiClient.post('/tour-bookings', payload).then((r) => r.data),
  list: (params) => apiClient.get('/tour-bookings', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/tour-bookings/${id}`).then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/tour-bookings/${id}/cancel`, { reason }).then((r) => r.data),
}

export const operatorApi = {
  register: (payload) => apiClient.post('/tour-operators', payload).then((r) => r.data),
  me: () => apiClient.get('/tour-operators/me').then((r) => r.data),
  list: (params) => apiClient.get('/tour-operators', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/tour-operators/${id}`).then((r) => r.data),
  uploadLogo: (file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/tour-operators/me/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  uploadLicense: (file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/tour-operators/me/license-document', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  verify: (id, status) => apiClient.put(`/tour-operators/${id}/verify`, null, { params: { status } }).then((r) => r.data),
  guides: (operatorId) => apiClient.get(`/tour-operators/${operatorId}/guides`).then((r) => r.data),
  addGuide: (payload) => apiClient.post('/tour-operators/me/guides', payload).then((r) => r.data),
  removeGuide: (id) => apiClient.delete(`/tour-operators/me/guides/${id}`).then((r) => r.data),
}
