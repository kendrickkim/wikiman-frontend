import { t } from '../i18n/index.js'

export function displayTitle(title) {
  const value = String(title || '').trim()
  return value || t('common.untitled')
}
