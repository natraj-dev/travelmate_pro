import { apiClient } from './axiosClient'

export const activityApi = {
  search: (params) => apiClient.get('/activities', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/activities/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/activities', payload).then((r) => r.data),
  book: (payload) => apiClient.post('/activities/bookings', payload).then((r) => r.data),
  myBookings: () => apiClient.get('/activities/bookings/mine').then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/activities/bookings/${id}/cancel`, { reason }).then((r) => r.data),
}

export const transportApi = {
  search: (params) => apiClient.get('/transport/options', { params }).then((r) => r.data),
  create: (payload) => apiClient.post('/transport/options', payload).then((r) => r.data),
  book: (payload) => apiClient.post('/transport/bookings', payload).then((r) => r.data),
  myBookings: () => apiClient.get('/transport/bookings/mine').then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/transport/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  bookTransfer: (payload) => apiClient.post('/transport/airport-transfers', payload).then((r) => r.data),
  myTransfers: () => apiClient.get('/transport/airport-transfers/mine').then((r) => r.data),
  cancelTransfer: (id) => apiClient.post(`/transport/airport-transfers/${id}/cancel`).then((r) => r.data),
}

export const itineraryApi = {
  list: () => apiClient.get('/itineraries').then((r) => r.data),
  get: (id) => apiClient.get(`/itineraries/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/itineraries', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/itineraries/${id}`, payload).then((r) => r.data),
  addDay: (itineraryId, payload) => apiClient.post(`/itineraries/${itineraryId}/days`, payload).then((r) => r.data),
  addItem: (dayId, payload) => apiClient.post(`/itineraries/days/${dayId}/items`, payload).then((r) => r.data),
  deleteItem: (itemId) => apiClient.delete(`/itineraries/items/${itemId}`).then((r) => r.data),
  remove: (id) => apiClient.delete(`/itineraries/${id}`).then((r) => r.data),
  downloadUrl: (id) => `${apiClient.defaults.baseURL}/itineraries/${id}/download`,
}

export const wishlistApi = {
  list: () => apiClient.get('/wishlist').then((r) => r.data),
  add: (payload) => apiClient.post('/wishlist', payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/wishlist/${id}`).then((r) => r.data),
}

export const reviewApi = {
  list: (params) => apiClient.get('/reviews', { params }).then((r) => r.data),
  create: (payload) => apiClient.post('/reviews', payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/reviews/${id}`).then((r) => r.data),
  respond: (id, operator_response) => apiClient.put(`/reviews/${id}/respond`, { operator_response }).then((r) => r.data),
  moderate: (id, params) => apiClient.put(`/reviews/${id}/moderate`, null, { params }).then((r) => r.data),
}
