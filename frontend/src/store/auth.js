import { create } from 'zustand'
import api from '../api/client'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login/', { email, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
      // Fetch profile
      const profile = await api.get('/auth/profile/')
      set({ user: profile.data, token: data.access, isLoading: false })
      return true
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Login failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  fetchProfile: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try {
      const { data } = await api.get('/auth/profile/')
      set({ user: data, token })
    } catch {
      set({ user: null, token: null })
    }
  },
}))
