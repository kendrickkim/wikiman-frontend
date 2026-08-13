import { defineStore } from 'pinia'
import { Dark } from 'quasar'
import { api } from '@/utils/api'
import { normalizeEditorType } from '@/utils/editors'

const DEFAULT_FAVICON = '/icons/favicon.svg'
const DEFAULT_APPLE_TOUCH = '/icons/apple-touch-icon.png'

function faviconType(url) {
  if (url.endsWith('.svg')) return 'image/svg+xml'
  if (url.endsWith('.ico')) return 'image/x-icon'
  if (url.endsWith('.webp')) return 'image/webp'
  if (url.endsWith('.gif')) return 'image/gif'
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

function applyFavicon(url) {
  if (typeof document === 'undefined') return
  const href = url || DEFAULT_FAVICON
  let link = document.getElementById('wiki-favicon')
  if (!link) {
    link = document.createElement('link')
    link.id = 'wiki-favicon'
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.type = faviconType(href)
  link.href = href
  const apple = document.getElementById('wiki-apple-touch')
  if (apple) apple.href = url || DEFAULT_APPLE_TOUCH
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    siteTitle: 'Wikiman',
    theme: 'light',
    plantumlServer: 'https://www.plantuml.com/plantuml',
    defaultEditor: 'ckeditor',
    favicon: '',
    maxAttachmentMb: 20,
    homePostIds: [],
    hasHomepage: false,
    loaded: false
  }),
  getters: {
    isDark: (state) => state.theme === 'dark'
  },
  actions: {
    apply() {
      Dark.set(this.theme === 'dark')
      document.title = this.siteTitle
      applyFavicon(this.favicon)
    },
    assign(data) {
      this.siteTitle = data.siteTitle || 'Wikiman'
      this.theme = data.theme === 'dark' ? 'dark' : 'light'
      this.plantumlServer = data.plantumlServer || 'https://www.plantuml.com/plantuml'
      this.defaultEditor = normalizeEditorType(data.defaultEditor)
      this.favicon = typeof data.favicon === 'string' ? data.favicon : ''
      const mb = Math.round(Number(data.maxAttachmentMb))
      this.maxAttachmentMb = Number.isFinite(mb) && mb >= 1 && mb <= 200 ? mb : 20
      const ids = Array.isArray(data.homePostIds)
        ? data.homePostIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
        : []
      this.homePostIds = ids
      this.hasHomepage = data.hasHomepage === true || ids.length > 0
      this.apply()
    },
    async load() {
      try {
        const { data } = await api.get('/settings')
        this.assign(data)
      } catch {
        this.apply()
      } finally {
        this.loaded = true
      }
    },
    async save(payload) {
      const { data } = await api.patch('/settings', payload)
      this.assign(data)
      return data
    }
  }
})
