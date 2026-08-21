import { apiClient } from './axiosClient'

export const notificationApi = {
  list: (params) => apiClient.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.put('/notifications/read-all').then((r) => r.data),
  remove: (id) => apiClient.delete(`/notifications/${id}`).then((r) => r.data),
}

export const messageApi = {
  // Existing conversations
  conversations: () =>
    apiClient.get('/messages/conversations').then((r) => r.data),

  // Users that the current user is allowed to message
  contacts: () =>
    apiClient.get('/messages/contacts').then((r) => r.data),

  // Messages between two users
  thread: (otherUserId) =>
    apiClient.get(`/messages/thread/${otherUserId}`).then((r) => r.data),

  // Send a message
  send: (payload) =>
    apiClient.post('/messages', payload).then((r) => r.data),

  // Delete a sent message
  remove: (id) =>
    apiClient.delete(`/messages/${id}`).then((r) => r.data),
}

export const supportApi = {
  createTicket: (payload) => apiClient.post('/support/tickets', payload).then((r) => r.data),
  myTickets: () => apiClient.get('/support/tickets/mine').then((r) => r.data),
  allTickets: (params) => apiClient.get('/support/tickets', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/support/tickets/${id}`).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/support/tickets/${id}`, payload).then((r) => r.data),
  reply: (id, payload) => apiClient.post(`/support/tickets/${id}/replies`, payload).then((r) => r.data),
}
