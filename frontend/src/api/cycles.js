import api from './axios'

export const cyclesApi = {
  list: () => api.get('/cycles/').then(r => r.data),
  get: (id) => api.get(`/cycles/${id}/`).then(r => r.data),
  create: (data) => api.post('/cycles/', data).then(r => r.data),
  listParticipation: (params) => api.get('/participation/', { params }).then(r => r.data),
  recordParticipation: (data) => api.post('/participation/', data).then(r => r.data),
}
