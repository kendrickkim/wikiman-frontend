import { Quasar } from 'quasar'
import { DEFAULT_SITE_LANGUAGE, setLocale, t } from '../i18n'

export default async ({ app }) => {
  setLocale(DEFAULT_SITE_LANGUAGE)
  app.config.globalProperties.$t = t
  app.provide('i18nT', t)

  try {
    const lang = await import('quasar/lang/ko-KR')
    Quasar.lang.set(lang.default)
  } catch {
    // The site messages still work if a Quasar language pack cannot be loaded.
  }
}

export async function applyQuasarLang(siteLanguage) {
  const pack = siteLanguage === 'en-US' ? 'en-US' : 'ko-KR'
  const lang = await import(`quasar/lang/${pack}`)
  Quasar.lang.set(lang.default)
}
