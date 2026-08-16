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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data
    if (data?.error === 'INSTALL_REQUIRED' && window.location.pathname !== '/install.php') {
      const target = typeof data?.params?.installUrl === 'string'
        ? data.params.installUrl
        : '/install.php'
      window.location.replace(target)
    }
    return Promise.reject(error)
  }
)

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
