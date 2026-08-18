import { isWikimanNativeAndroid, notifyWikimanNativeApp } from './nativeApp.js'

const SKIP_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'radio',
  'file',
  'hidden',
  'submit',
  'reset',
  'range',
  'color'
])

export function findEditableElement(node) {
  let el = node
  if (el && el.nodeType === 3) el = el.parentElement
  while (el && el.nodeType === 1) {
    const tag = el.tagName
    const type = String(el.type || '').toLowerCase()
    if (tag === 'TEXTAREA') return el
    if (tag === 'INPUT' && !SKIP_INPUT_TYPES.has(type)) return el
    if (el.isContentEditable) return el
    el = el.parentElement
  }
  return null
}

export function ensureNativeIme(target) {
  if (!isWikimanNativeAndroid() || typeof document === 'undefined') return false
  const el = findEditableElement(target)
  if (!el) return false
  notifyWikimanNativeApp('keyboard:focus')
  try { el.setAttribute('inputmode', 'text') } catch (_) {}
  const selection = window.getSelection?.()
  let range = null
  try {
    if (selection?.rangeCount) range = selection.getRangeAt(0).cloneRange()
  } catch (_) {}
  const dummy = document.createElement('textarea')
  dummy.setAttribute('inputmode', 'text')
  dummy.setAttribute('autocomplete', 'off')
  dummy.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:16px;opacity:0.01;font-size:16px;border:0;padding:0;margin:0;z-index:-1;'
  document.body.appendChild(dummy)
  dummy.focus()
  window.setTimeout(() => {
    dummy.remove()
    try { el.focus({ preventScroll: true }) } catch (_) { el.focus() }
    try {
      if (range && selection && el.contains(range.commonAncestorContainer)) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } catch (_) {}
  }, 30)
  return true
}
