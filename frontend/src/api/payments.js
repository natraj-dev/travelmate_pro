import { apiClient } from './axiosClient'

export const paymentApi = {
  checkout: (payload) => apiClient.post('/payments/checkout', payload).then((r) => r.data),
  mine: () => apiClient.get('/payments/mine').then((r) => r.data),
  get: (id) => apiClient.get(`/payments/${id}`).then((r) => r.data),
  status: (id) => apiClient.get(`/payments/${id}/status`).then((r) => r.data),
  confirmCheckout: (sessionId) =>
    apiClient
      .get('/payments/confirm-checkout', {
        params: { session_id: sessionId },
      })
      .then((r) => r.data),
}

export const refundApi = {
  request: (payload) => apiClient.post('/refunds', payload).then((r) => r.data),
  mine: () => apiClient.get('/refunds/mine').then((r) => r.data),
  list: (params) => apiClient.get('/refunds', { params }).then((r) => r.data),
  review: (id, payload) => apiClient.put(`/refunds/${id}/review`, payload).then((r) => r.data),
}

export const couponApi = {
  list: () => apiClient.get('/coupons').then((r) => r.data),
  create: (payload) => apiClient.post('/coupons', payload).then((r) => r.data),
  deactivate: (id) => apiClient.put(`/coupons/${id}/deactivate`).then((r) => r.data),
  remove: (id) => apiClient.delete(`/coupons/${id}`).then((r) => r.data),
  validate: (payload) => apiClient.post('/coupons/validate', payload).then((r) => r.data),
}

export const membershipApi = {
  plans: () => apiClient.get('/memberships/plans').then((r) => r.data),
  mine: () => apiClient.get('/memberships/me').then((r) => r.data),
  subscribe: (payload) => apiClient.post('/memberships/subscribe', payload).then((r) => r.data),
  confirm: (sessionId) => apiClient.get('/memberships/confirm', { params: { session_id: sessionId } }).then((r) => r.data),
  cancel: () => apiClient.post('/memberships/me/cancel').then((r) => r.data),
}
