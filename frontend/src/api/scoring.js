import api from './axios'

export const scoringApi = {
  rank: (cycleId) =>
    api.post('/scoring/rank/', { cycle_id: cycleId }).then(r => r.data),
  myScore: (cycleId) =>
    api.get('/scoring/my-score/', { params: { cycle_id: cycleId } }).then(r => r.data),
}
