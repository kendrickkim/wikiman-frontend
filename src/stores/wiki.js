import { defineStore } from 'pinia'
import { api } from '@/utils/api'
import { buildCategoryFlatOptions, buildCategoryTree } from '@/utils/categories'

export const useWikiStore = defineStore('wiki', {
  state: () => ({
    categories: [],
    keywords: [],
    loaded: false,
    keywordsLoaded: false,
    loading: null,
    keywordsLoading: null
  }),
  getters: {
    tree: (state) => buildCategoryTree(state.categories),
    flatOptions: (state) => buildCategoryFlatOptions(state.categories),
    keywordNames: (state) => state.keywords.map((item) => item.name)
  },
  actions: {
    async loadCategories({ force = false } = {}) {
      if (this.loaded && !force) return
      const { data } = await api.get('/categories')
      this.categories = data.categories
      this.loaded = true
    },
    async ensureLoaded({ force = false } = {}) {
      if (this.loaded && !force) return
      if (this.loading && !force) return this.loading
      this.loading = this.loadCategories({ force }).finally(() => {
        this.loading = null
      })
      return this.loading
    },
    async loadKeywords({ force = false } = {}) {
      if (this.keywordsLoaded && !force) return
      const { data } = await api.get('/posts/keywords')
      this.keywords = Array.isArray(data.keywords)
        ? data.keywords.map((item) => (
          typeof item === 'string' ? { name: item, count: 0 } : item
        )).filter((item) => item?.name)
        : []
      this.keywordsLoaded = true
    },
    async ensureKeywords({ force = false } = {}) {
      if (this.keywordsLoaded && !force) return
      if (this.keywordsLoading && !force) return this.keywordsLoading
      this.keywordsLoading = this.loadKeywords({ force }).finally(() => {
        this.keywordsLoading = null
      })
      return this.keywordsLoading
    }
  }
})
