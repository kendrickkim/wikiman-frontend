import axios from 'axios'

export const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wikiman_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(err, fallback = '요청에 실패했습니다.') {
  return err?.response?.data?.error || err?.message || fallback
}
