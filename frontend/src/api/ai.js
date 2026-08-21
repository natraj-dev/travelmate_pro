import { apiClient } from './axiosClient'

export const aiChatApi = {
  conversations: () => apiClient.get('/ai/chat/conversations').then((r) => r.data),
  conversation: (id) => apiClient.get(`/ai/chat/conversations/${id}`).then((r) => r.data),
  send: (payload) => apiClient.post('/ai/chat/message', payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/ai/chat/conversations/${id}`).then((r) => r.data),
}

export const aiItineraryApi = {
  generate: (payload) => apiClient.post('/ai/itinerary/generate', payload).then((r) => r.data),
  get: (id) => apiClient.get(`/ai/itinerary/${id}`).then((r) => r.data),
  save: (payload) => apiClient.post('/ai/itinerary/save', payload).then((r) => r.data),
}

export const aiRecommendationApi = {
  get: (params) => apiClient.get('/ai/recommendations', { params }).then((r) => r.data),
}

export const aiInsightApi = {
  generate: (insightType) => apiClient.post('/ai/insights/generate', null, { params: { insight_type: insightType } }).then((r) => r.data),
  list: () => apiClient.get('/ai/insights').then((r) => r.data),
}
