import { defineRouter } from '#q-app'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const QUICK_ENTRY_KEY = 'wikiman_quick_entry_done'

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 1023px)').matches
}

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
    if (to.path === '/' && to.query.view === 'list') {
      const { view, ...query } = to.query
      return { path: '/list', query, hash: to.hash }
    }

    const auth = useAuthStore()
    const settings = useSettingsStore()
    await Promise.all([auth.ensureLoaded(), settings.ensureLoaded()])

    if (to.path === '/' && !Object.keys(to.query || {}).length) {
      const already = typeof sessionStorage !== 'undefined'
        && sessionStorage.getItem(QUICK_ENTRY_KEY) === '1'
      if (
        !already
        && isMobileViewport()
        && settings.mobileQuickPostEnabled
        && auth.canWrite
      ) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(QUICK_ENTRY_KEY, '1')
        }
        return { path: '/quick-posts/new' }
      }
    }

    if (!to.meta.requiresWriter && !to.meta.requiresAuth) return true
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
