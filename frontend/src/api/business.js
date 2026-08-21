import { apiClient } from './axiosClient'

export const agentApi = {
  register: (payload) => apiClient.post('/agents', payload).then((r) => r.data),
  me: () => apiClient.get('/agents/me').then((r) => r.data),
  list: (params) => apiClient.get('/agents', { params }).then((r) => r.data),
  verify: (id, status) => apiClient.put(`/agents/${id}/verify`, null, { params: { status } }).then((r) => r.data),
  myCustomers: () => apiClient.get('/agents/me/customers').then((r) => r.data),
  linkCustomer: (customerId, notes) => apiClient.post(`/agents/me/customers/${customerId}`, null, { params: { notes } }).then((r) => r.data),
}

export const leadApi = {
  list: (params) => apiClient.get('/leads', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/leads/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/leads', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/leads/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/leads/${id}`).then((r) => r.data),
}

export const dashboardApi = {
  hotelManager: () => apiClient.get('/dashboard/hotel-manager').then((r) => r.data),
  tourOperator: () => apiClient.get('/dashboard/tour-operator').then((r) => r.data),
  agent: () => apiClient.get('/dashboard/agent').then((r) => r.data),
  customer: () => apiClient.get('/dashboard/customer').then((r) => r.data),
}

export const documentApi = {
  list: () => apiClient.get('/documents').then((r) => r.data),
  upload: (formData) => apiClient.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/documents/${id}`).then((r) => r.data),
  verify: (id) => apiClient.put(`/documents/${id}/verify`).then((r) => r.data),
}

export const insuranceApi = {
  plans: () => apiClient.get('/insurance/plans').then((r) => r.data),
  purchase: (payload) => apiClient.post('/insurance/purchase', payload).then((r) => r.data),
  myPolicies: () => apiClient.get('/insurance/policies/mine').then((r) => r.data),
}

export const mapsApi = {
  config: () => apiClient.get('/maps/config').then((r) => r.data),
  geocode: (address) => apiClient.get('/maps/geocode', { params: { address } }).then((r) => r.data),
  distance: (origin, destination, mode = 'driving') =>
    apiClient.get('/maps/distance', { params: { origin, destination, mode } }).then((r) => r.data),
  nearby: (latitude, longitude, radius_meters = 3000, type = 'tourist_attraction') =>
    apiClient.get('/maps/nearby', { params: { latitude, longitude, radius_meters, type } }).then((r) => r.data),
}
