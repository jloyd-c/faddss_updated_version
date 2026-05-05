import axios from 'axios'
import api from './axios'

export const authApi = {
  login: async (username, password) => {
    const { data } = await axios.post('/api/auth/login/', { username, password })
    return data
  },
  logout: async (refresh) => {
    await api.post('/auth/logout/', { refresh })
  },
  me: async () => {
    const { data } = await api.get('/users/me/')
    return data
  },
}
