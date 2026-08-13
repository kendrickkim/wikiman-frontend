import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('wikiman_token') || '',
    user: null,
    loaded: false,
    canRegister: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
    canWrite: (state) => Boolean(state.user?.canWrite)
  },
  actions: {
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('wikiman_token', token)
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('wikiman_token')
    },
    async loadStatus() {
      try {
        const { data } = await api.get('/auth/status')
        this.canRegister = Boolean(data.canRegister)
      } catch {
        this.canRegister = false
      }
    },
    async restore() {
      await this.loadStatus()
      if (!this.token) {
        this.loaded = true
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        this.user = data.user
      } catch {
        this.logout()
      } finally {
        this.loaded = true
      }
    },
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.setSession(data.token, data.user)
      await this.loadStatus()
    },
    async register(username, password) {
      const { data } = await api.post('/auth/register', { username, password })
      this.setSession(data.token, data.user)
      await this.loadStatus()
    }
  }
})
