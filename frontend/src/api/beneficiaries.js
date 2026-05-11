import api from './axios'

export const residentProfilesApi = {
  list: (params) => api.get('/resident-profiles/', { params }).then(r => r.data),
  get: (id) => api.get(`/resident-profiles/${id}/`).then(r => r.data),
  create: (data) => api.post('/resident-profiles/', data).then(r => r.data),
  update: (id, data) => api.patch(`/resident-profiles/${id}/`, data).then(r => r.data),
  saveIndicator: (id, data) => api.post(`/resident-profiles/${id}/indicators/`, data).then(r => r.data),
}

export const beneficiariesApi = residentProfilesApi

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


