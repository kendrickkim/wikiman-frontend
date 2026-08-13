import { defineStore } from 'pinia'
import { Dark } from 'quasar'
import { api } from '@/utils/api'
import { normalizeEditorType } from '@/utils/editors'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    siteTitle: 'Wikiman',
    theme: 'light',
    plantumlServer: 'https://www.plantuml.com/plantuml',
    defaultEditor: 'editorjs',
    homePostId: null,
    loaded: false
  }),
  getters: {
    isDark: (state) => state.theme === 'dark'
  },
  actions: {
    apply() {
      Dark.set(this.theme === 'dark')
      document.title = this.siteTitle
    },
    assign(data) {
      this.siteTitle = data.siteTitle || 'Wikiman'
      this.theme = data.theme === 'dark' ? 'dark' : 'light'
      this.plantumlServer = data.plantumlServer || 'https://www.plantuml.com/plantuml'
      this.defaultEditor = normalizeEditorType(data.defaultEditor)
      const homeId = Number(data.homePostId)
      this.homePostId = Number.isFinite(homeId) && homeId > 0 ? homeId : null
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
