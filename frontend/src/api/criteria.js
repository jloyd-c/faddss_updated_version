import api from './axios'

export const criteriaApi = {
  list: (params) => api.get('/criteria/', { params }).then(r => r.data),
  get: (id) => api.get(`/criteria/${id}/`).then(r => r.data),
  create: (data) => api.post('/criteria/', data).then(r => r.data),
  update: (id, data) => api.patch(`/criteria/${id}/`, data).then(r => r.data),
}
