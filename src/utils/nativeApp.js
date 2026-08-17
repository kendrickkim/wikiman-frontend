const APP_USER_AGENT_PATTERN = /\bWikimanApp\/[\d.]+/i
const NATIVE_EVENT = 'wikiman-native'

export function isWikimanNativeApp() {
  if (typeof navigator === 'undefined') return false
  return APP_USER_AGENT_PATTERN.test(navigator.userAgent || '')
}

export function notifyWikimanNativeApp(message) {
  if (!isWikimanNativeApp() || typeof window === 'undefined') return false
  const channel = window.WikimanApp
  if (!channel || typeof channel.postMessage !== 'function') return false
  channel.postMessage(String(message))
  return true
}

export function onWikimanNativeEvent(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') return () => {}
  const listener = (event) => handler(event.detail)
  window.addEventListener(NATIVE_EVENT, listener)
  return () => window.removeEventListener(NATIVE_EVENT, listener)
}

export function takeWikimanSharedDraft() {
  if (!isWikimanNativeApp() || typeof localStorage === 'undefined') return ''
  const key = 'wikiman_shared_draft'
  const draft = localStorage.getItem(key) || ''
  localStorage.removeItem(key)
  return draft
}
