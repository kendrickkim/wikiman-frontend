import { computed, ref } from 'vue'
import koKr from './koKr.js'
import usEn from './usEn.js'

export const SITE_LANGUAGES = ['ko-KR', 'en-US']
export const DEFAULT_SITE_LANGUAGE = 'ko-KR'

const catalogs = {
  'ko-KR': koKr,
  'en-US': usEn
}

const locale = ref(DEFAULT_SITE_LANGUAGE)

export function normalizeSiteLanguage(value, fallback = DEFAULT_SITE_LANGUAGE) {
  if (SITE_LANGUAGES.includes(value)) return value
  return SITE_LANGUAGES.includes(fallback) ? fallback : DEFAULT_SITE_LANGUAGE
}

export function setLocale(next) {
  locale.value = normalizeSiteLanguage(next)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale.value
  }
  return locale.value
}

export function getLocale() {
  return locale.value
}

function lookup(catalog, key) {
  return key.split('.').reduce((value, part) => {
    if (value && typeof value === 'object') return value[part]
    return undefined
  }, catalog)
}

export function t(key, params = {}) {
  const value = lookup(catalogs[locale.value], key) ?? lookup(koKr, key) ?? key
  if (typeof value !== 'string') return key

  return value.replace(/\{([^{}]+)\}/g, (match, name) => {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  })
}

export function useI18n() {
  return {
    locale: computed(() => locale.value),
    t,
    setLocale
  }
}

export function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value, path)
    }
    return [path]
  })
}
