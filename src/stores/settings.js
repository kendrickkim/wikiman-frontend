import { defineStore } from 'pinia'
import { Dark } from 'quasar'
import { api } from '@/utils/api'
import { normalizeEditorType, EDITOR_OPTIONS } from '@/utils/editors'

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

function applyFontScale(scale) {
  if (typeof document === 'undefined') return
  const n = Number(scale)
  const value = Number.isFinite(n) && n > 0 ? n / 100 : 1
  document.documentElement.style.setProperty('--wiki-font-scale', String(value))
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    siteTitle: 'Wikiman',
    theme: 'light',
    plantumlServer: 'https://www.plantuml.com/plantuml',
    defaultEditor: 'ckeditor',
    defaultEditorMobile: 'ckeditor',
    favicon: '',
    maxAttachmentMb: 20,
    categoryTreeExpand: 'expanded',
    categoryTreeSide: 'left',
    fontScale: 100,
    topMenuVisible: true,
    mobileQuickPostEnabled: false,
    quickPostPromoteSourceMode: 'ask',
    quickPostPromoteEditor: 'ask',
    linkPreviewCacheTtlDays: 10,
    linkPreviewFailureTtlDays: 1,
    homePostIds: [],
    hasHomepage: false,
    topMenuItems: [],
    loaded: false,
    loading: null
  }),
  getters: {
    isDark: (state) => state.theme === 'dark',
    showTopMenu: (state) => state.topMenuVisible && state.topMenuItems.length > 0
  },
  actions: {
    defaultEditorFor(desktop) {
      return desktop ? this.defaultEditor : this.defaultEditorMobile
    },
    apply() {
      Dark.set(this.theme === 'dark')
      document.title = this.siteTitle
      applyFavicon(this.favicon)
      applyFontScale(this.fontScale)
    },
    assign(data) {
      this.siteTitle = data.siteTitle || 'Wikiman'
      this.theme = data.theme === 'dark' ? 'dark' : 'light'
      this.plantumlServer = data.plantumlServer || 'https://www.plantuml.com/plantuml'
      this.defaultEditor = normalizeEditorType(data.defaultEditor)
      this.defaultEditorMobile = normalizeEditorType(data.defaultEditorMobile || data.defaultEditor)
      this.favicon = typeof data.favicon === 'string' ? data.favicon : ''
      const mb = Math.round(Number(data.maxAttachmentMb))
      this.maxAttachmentMb = Number.isFinite(mb) && mb >= 1 && mb <= 200 ? mb : 20
      const treeExpand = String(data.categoryTreeExpand || '')
      this.categoryTreeExpand = ['expanded', 'collapsed', 'root'].includes(treeExpand) ? treeExpand : 'expanded'
      this.categoryTreeSide = data.categoryTreeSide === 'right' ? 'right' : 'left'
      const scale = Math.round(Number(data.fontScale))
      this.fontScale = Number.isFinite(scale) && scale >= 60 && scale <= 120 ? scale : 100
      this.topMenuVisible = data.topMenuVisible !== false
      this.mobileQuickPostEnabled = data.mobileQuickPostEnabled === true
      this.quickPostPromoteSourceMode = ['ask', 'delete', 'keep'].includes(data.quickPostPromoteSourceMode)
        ? data.quickPostPromoteSourceMode
        : 'ask'
      this.quickPostPromoteEditor = data.quickPostPromoteEditor === 'ask'
        || EDITOR_OPTIONS.some((option) => option.value === data.quickPostPromoteEditor)
        ? data.quickPostPromoteEditor
        : 'ask'
      const linkCacheTtl = Math.round(Number(data.linkPreviewCacheTtlDays))
      this.linkPreviewCacheTtlDays = Number.isFinite(linkCacheTtl) && linkCacheTtl >= 1 && linkCacheTtl <= 365
        ? linkCacheTtl
        : 10
      const linkFailureTtl = Math.round(Number(data.linkPreviewFailureTtlDays))
      this.linkPreviewFailureTtlDays = Number.isFinite(linkFailureTtl) && linkFailureTtl >= 1 && linkFailureTtl <= 365
        ? linkFailureTtl
        : 1
      const ids = Array.isArray(data.homePostIds)
        ? data.homePostIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
        : []
      this.homePostIds = ids
      this.hasHomepage = data.hasHomepage === true || ids.length > 0
      this.topMenuItems = Array.isArray(data.topMenuItems)
        ? data.topMenuItems.map((item) => {
          const postId = Number(item.postId)
          const url = String(item.url || '').trim()
          return {
            id: Number(item.id),
            label: String(item.label || '').trim(),
            postId: Number.isInteger(postId) && postId > 0 ? postId : null,
            postTitle: String(item.postTitle || ''),
            url
          }
        }).filter((item) => item.id > 0 && item.label && (item.postId || item.url))
        : []
      this.apply()
    },
    async load({ force = false } = {}) {
      if (this.loaded && !force) return
      try {
        const { data } = await api.get('/settings')
        this.assign(data)
      } catch {
        this.apply()
      } finally {
        this.loaded = true
      }
    },
    async ensureLoaded({ force = false } = {}) {
      if (this.loaded && !force) return
      if (this.loading && !force) return this.loading
      this.loading = this.load({ force }).finally(() => {
        this.loading = null
      })
      return this.loading
    },
    async save(payload) {
      const { data } = await api.patch('/settings', payload)
      this.assign(data)
      return data
    }
  }
})
