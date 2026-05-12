import api from './axios'

const blob = (url, params) =>
  api.get(url, { params, responseType: 'blob' }).then(r => r.data)

export const reportsApi = {
  cycleRanking: (cycleId) => blob('/reports/cycle-ranking/', { cycle_id: cycleId }),
  beneficiaryMasterlist: () => blob('/reports/beneficiary-masterlist/'),
  participationHistory: (params) => blob('/reports/participation-history/', params),
  auditTrail: (params) => blob('/reports/audit-trail/', params),
  household: () => blob('/reports/household/'),
}

export function downloadBlob(data, filename) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
