import api from './axios'

export const auditApi = {
  list: (params) => api.get('/audit/', { params }).then(r => r.data),
  profileChanges: (params) => api.get('/audit/profile-changes/', { params }).then(r => r.data),
}
