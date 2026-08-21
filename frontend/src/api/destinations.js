import { apiClient } from './axiosClient'

export const destinationApi = {
  list: (params) =>
    apiClient
      .get('/destinations', { params })
      .then((r) => r.data),

  popular: (limit = 8) =>
    apiClient
      .get('/destinations/popular', {
        params: { limit },
      })
      .then((r) => r.data),

  get: (id) =>
    apiClient
      .get(`/destinations/${id}`)
      .then((r) => r.data),

  create: (payload) =>
    apiClient
      .post('/destinations', payload)
      .then((r) => r.data),

  update: (id, payload) =>
    apiClient
      .put(`/destinations/${id}`, payload)
      .then((r) => r.data),

  remove: (id) =>
    apiClient
      .delete(`/destinations/${id}`)
      .then((r) => r.data),

  uploadImage: (id, formData) =>
    apiClient
      .post(`/destinations/${id}/images`, formData)
      .then((r) => r.data),

  categories: () =>
    apiClient
      .get('/destination-categories')
      .then((r) => r.data),

  createCategory: (payload) =>
    apiClient
      .post('/destination-categories', payload)
      .then((r) => r.data),
}

export const travelGuideApi = {
  forDestination: (destinationId) =>
    apiClient
      .get(`/travel-guides/destination/${destinationId}`)
      .then((r) => r.data),

  get: (id) =>
    apiClient
      .get(`/travel-guides/${id}`)
      .then((r) => r.data),

  create: (payload) =>
    apiClient
      .post('/travel-guides', payload)
      .then((r) => r.data),
}