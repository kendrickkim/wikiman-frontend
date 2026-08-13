import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export const useWikiStore = defineStore('wiki', {
  state: () => ({
    categories: [],
    selectedCategoryId: null
  }),
  getters: {
    tree(state) {
      const byParent = new Map()
      for (const category of state.categories) {
        const key = category.parent_id ?? 0
        if (!byParent.has(key)) byParent.set(key, [])
        byParent.get(key).push(category)
      }
      const build = (parentId) => (byParent.get(parentId) || []).map((category) => ({
        id: category.id,
        label: category.name,
        parentId: category.parent_id,
        children: build(category.id)
      }))
      return build(0)
    },
    flatOptions(state) {
      const byParent = new Map()
      for (const category of state.categories) {
        const key = category.parent_id ?? 0
        if (!byParent.has(key)) byParent.set(key, [])
        byParent.get(key).push(category)
      }
      const rows = []
      const walk = (parentId, depth) => {
        for (const category of byParent.get(parentId) || []) {
          rows.push({
            id: category.id,
            name: category.name,
            parent_id: category.parent_id,
            label: `${'— '.repeat(depth)}${category.name}`
          })
          walk(category.id, depth + 1)
        }
      }
      walk(0, 0)
      return rows
    }
  },
  actions: {
    async loadCategories() {
      const { data } = await api.get('/categories')
      this.categories = data.categories
    }
  }
})
