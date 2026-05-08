import api from './axios'

export const beneficiariesApi = {
  list: (params) => api.get('/beneficiaries/', { params }).then(r => r.data),
  get: (id) => api.get(`/beneficiaries/${id}/`).then(r => r.data),
  create: (data) => api.post('/beneficiaries/', data).then(r => r.data),
  update: (id, data) => api.patch(`/beneficiaries/${id}/`, data).then(r => r.data),
  saveIndicator: (id, data) => api.post(`/beneficiaries/${id}/indicators/`, data).then(r => r.data),
}

export const householdsApi = {
  list: (params) => api.get('/households/', { params }).then(r => r.data),
  get: (id) => api.get(`/households/${id}/`).then(r => r.data),
  create: (data) => api.post('/households/', data).then(r => r.data),
  update: (id, data) => api.patch(`/households/${id}/`, data).then(r => r.data),
}

export const familiesApi = {
  list: (params) => api.get('/families/', { params }).then(r => r.data),
  get: (id) => api.get(`/families/${id}/`).then(r => r.data),
  create: (data) => api.post('/families/', data).then(r => r.data),
  update: (id, data) => api.patch(`/families/${id}/`, data).then(r => r.data),
}
