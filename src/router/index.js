import { defineRouter } from '#q-app'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to) => {
    if (to.query.categoryId && !to.path.startsWith('/category/')) {
      const { categoryId, ...query } = to.query
      return { path: `/category/${categoryId}`, query, hash: to.hash }
    }
    if (!to.meta.requiresWriter && !to.meta.requiresAuth) return true
    const auth = useAuthStore()
    await auth.ensureLoaded()
    if (!auth.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.meta.requiresWriter && !auth.canWrite) {
      return { path: '/' }
    }
    return true
  })

  return Router
})
