import { defineStore } from 'pinia'
import { api } from '@/utils/api'
import { isWikimanNativeApp, notifyWikimanNativeApp } from '@/utils/nativeApp'

const TOKEN_KEY = 'wikiman_token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7

function tokenFromCookie() {
  if (typeof document === 'undefined') return ''
  const prefix = `${TOKEN_KEY}=`
  for (const part of document.cookie.split(';')) {
    const value = part.trim()
    if (!value.startsWith(prefix)) continue
    try {
      return decodeURIComponent(value.slice(prefix.length))
    } catch {
      return value.slice(prefix.length)
    }
  }
  return ''
}

function storedToken() {
  const localToken = localStorage.getItem(TOKEN_KEY) || ''
  if (localToken || !isWikimanNativeApp()) return localToken
  const appToken = tokenFromCookie()
  if (appToken) localStorage.setItem(TOKEN_KEY, appToken)
  return appToken
}

function syncAuthCookie(token) {
  if (typeof document === 'undefined') return
  if (token) {
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax`
  } else {
    document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: storedToken(),
    user: null,
    loaded: false,
    canRegister: false,
    loading: null
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
    canWrite: (state) => Boolean(state.user?.canWrite)
  },
  actions: {
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_KEY, token)
      syncAuthCookie(token)
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      syncAuthCookie('')
      notifyWikimanNativeApp('logout')
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
        syncAuthCookie('')
        this.loaded = true
        return
      }
      // 기존 세션도 이미지(<img>) 요청에 인증이 실리도록 쿠키를 맞춥니다.
      syncAuthCookie(this.token)
      try {
        const { data } = await api.get('/auth/me')
        this.user = data.user
      } catch {
        this.logout()
      } finally {
        this.loaded = true
      }
    },
    async ensureLoaded({ force = false } = {}) {
      if (this.loaded && !force) return
      if (this.loading && !force) return this.loading
      this.loading = this.restore().finally(() => {
        this.loading = null
      })
      return this.loading
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
