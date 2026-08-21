import { apiClient } from './axiosClient'

export const hotelApi = {
  search: (params) => apiClient.get('/hotels/search', { params }).then((r) => r.data),
  availableRooms: (hotelId, params) => apiClient.get(`/hotels/search/${hotelId}/available-rooms`, { params }).then((r) => r.data),
  list: (params) => apiClient.get('/hotels', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/hotels/${id}`).then((r) => r.data),
  register: (payload) => apiClient.post('/hotels', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/hotels/${id}`, payload).then((r) => r.data),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/hotels/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  verify: (id, status) => apiClient.put(`/hotels/${id}/verify`, null, { params: { status } }).then((r) => r.data),
  deactivate: (id) => apiClient.delete(`/hotels/${id}`).then((r) => r.data),
  rooms: (hotelId) => apiClient.get(`/rooms/hotel/${hotelId}`).then((r) => r.data),
  createRoom: (payload) => apiClient.post('/rooms', payload).then((r) => r.data),
  updateRoom: (id, payload) => apiClient.put(`/rooms/${id}`, payload).then((r) => r.data),
  deleteRoom: (id) => apiClient.delete(`/rooms/${id}`).then((r) => r.data),
  roomTypes: () => apiClient.get('/rooms/types').then((r) => r.data),
}

export const hotelBookingApi = {
  create: (payload) => apiClient.post('/hotel-bookings', payload).then((r) => r.data),
  list: (params) => apiClient.get('/hotel-bookings', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/hotel-bookings/${id}`).then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/hotel-bookings/${id}/cancel`, { reason }).then((r) => r.data),
}
