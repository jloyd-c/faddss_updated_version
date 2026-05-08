import api from './axios'

export const usersApi = {
  list: (params) => api.get('/users/', { params }).then(r => r.data),
  get: (id) => api.get(`/users/${id}/`).then(r => r.data),
  create: (data) => api.post('/users/', data).then(r => r.data),
  update: (id, data) => api.patch(`/users/${id}/`, data).then(r => r.data),
}
