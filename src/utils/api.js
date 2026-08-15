import axios from 'axios'
import { t } from '../i18n/index.js'

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

export function getErrorMessage(err, fallback) {
  const data = err?.response?.data
  const serverError = data?.error

  if (typeof serverError === 'string' && /^[A-Z][A-Z0-9_]*$/.test(serverError)) {
    const key = `errors.${serverError}`
    const translated = t(key, data.params || {})
    return translated === key ? (fallback || t('common.errorRequestFailed')) : translated
  }

  if (typeof serverError === 'string' && serverError) return serverError
  return err?.message || fallback || t('common.errorRequestFailed')
}
