<template>
  <div class="wiki-nav">
    <q-list v-if="showNav && !adminMode" dense>
      <q-item
        v-if="settings.hasHomepage || settings.blogMode"
        clickable
        :active="selectedKey === 'home'"
        active-class="wiki-nav-active"
        @click="select('home')"
      >
        <q-item-section avatar><q-icon name="home" /></q-item-section>
        <q-item-section>{{ t('nav.home') }}</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'all'"
        active-class="wiki-nav-active"
        @click="select('all')"
      >
        <q-item-section avatar><q-icon name="article" /></q-item-section>
        <q-item-section>{{ t('nav.allPosts') }}</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'uncategorized'"
        active-class="wiki-nav-active"
        @click="select('uncategorized')"
      >
        <q-item-section avatar><q-icon name="folder_off" /></q-item-section>
        <q-item-section>{{ t('common.uncategorized') }}</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'keywords'"
        active-class="wiki-nav-active"
        @click="select('keywords')"
      >
        <q-item-section avatar><q-icon name="sell" /></q-item-section>
        <q-item-section>{{ t('nav.keywords') }}</q-item-section>
      </q-item>
      <q-item
        v-if="auth.canWrite"
        clickable
        :active="selectedKey === 'quick-posts'"
        active-class="wiki-nav-active"
        @click="select('quick-posts')"
      >
        <q-item-section avatar><q-icon name="edit_note" /></q-item-section>
        <q-item-section>{{ t('nav.quickPosts') }}</q-item-section>
      </q-item>
      <q-item
        v-if="auth.canWrite"
        clickable
        :active="selectedKey === 'trash'"
        active-class="wiki-nav-active"
        @click="select('trash')"
      >
        <q-item-section avatar><q-icon name="delete" /></q-item-section>
        <q-item-section>{{ t('nav.trash') }}</q-item-section>
      </q-item>
    </q-list>

    <div v-if="showNav && auth.canWrite && adminMode" class="wiki-nav-settings">
      <div class="wiki-drawer-title">{{ t('settings.title') }}</div>
      <q-list dense>
        <q-item
          v-for="item in settingsMenu"
          :key="item.key"
          clickable
          :active="selectedKey === item.key"
          active-class="wiki-nav-active"
          @click="router.push(item.to)"
        >
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-list v-else-if="showNav && auth.canWrite" dense class="wiki-nav-settings">
      <q-item
        clickable
        @click="router.push('/settings/general')"
      >
        <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
        <q-item-section>{{ t('settings.title') }}</q-item-section>
      </q-item>
    </q-list>

    <template v-if="showTree && !adminMode">
      <div class="wiki-drawer-title" :class="{ 'q-mt-md': showNav }">{{ t('nav.categories') }}</div>
      <q-input
        v-model="filter"
        dense
        outlined
        :placeholder="t('categories.search')"
        class="q-mb-sm"
        clearable
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-tree
        class="wiki-category-tree"
        dense
        :nodes="filteredTree"
        node-key="id"
        :filter="filter"
        selected-color="primary"
        v-model:selected="treeSelected"
        v-model:expanded="expanded"
        @update:selected="onTreeSelect"
      >
        <template #default-header="prop">
          <div class="row items-center no-wrap full-width wiki-category-tree__row">
            <div class="ellipsis col">{{ prop.node.name || prop.node.label }}</div>
            <q-badge
              v-if="prop.node.visibility === 'private'"
              dense
              color="grey-7"
              class="q-ml-sm"
            >
              {{ t('common.private') }}
            </q-badge>
          </div>
        </template>
      </q-tree>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from '@/i18n'
import { isWikimanNativeApp, notifyWikimanNativeApp } from '@/utils/nativeApp'

const props = defineProps({
  showNav: { type: Boolean, default: true },
  showTree: { type: Boolean, default: true }
})

const NAV_KEYS = new Set([
  'all',
  'home',
  'uncategorized',
  'keywords',
  'quick-posts',
  'trash',
  'settings-general',
  'settings-top-menu',
  'settings-categories',
  'settings-homepage',
  'settings-blog',
  'settings-quick-posts',
  'settings-attachments',
  'settings-data'
])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const { t } = useI18n()
const adminMode = computed(() => route.path.startsWith('/settings'))
const settingsMenu = computed(() => [
  { key: 'settings-general', to: '/settings/general', label: t('settings.general'), icon: 'tune' },
  { key: 'settings-top-menu', to: '/settings/top-menu', label: t('settings.topMenu'), icon: 'view_week' },
  { key: 'settings-categories', to: '/settings/categories', label: t('settings.categories'), icon: 'folder' },
  { key: 'settings-homepage', to: '/settings/homepage', label: t('settings.homepage'), icon: 'home' },
  { key: 'settings-blog', to: '/settings/blog', label: t('settings.blog'), icon: 'rss_feed' },
  { key: 'settings-quick-posts', to: '/settings/quick-posts', label: t('settings.quickPosts'), icon: 'edit_note' },
  { key: 'settings-attachments', to: '/settings/attachments', label: t('settings.attachments'), icon: 'attach_file' },
  { key: 'settings-data', to: '/settings/data', label: t('settings.data'), icon: 'storage' }
])
const filter = ref('')
const treeSelected = ref(null)
const expanded = ref([])

const selectedKey = computed(() => {
  if (route.path === '/trash') return 'trash'
  if (route.path.startsWith('/quick-posts')) return 'quick-posts'
  if (route.path.startsWith('/settings')) {
    const match = settingsMenu.value.find((item) => route.path.startsWith(item.to))
    return match?.key || 'settings-general'
  }
  if (route.path === '/keywords' || route.path.startsWith('/keyword/')) return 'keywords'
  if (route.path.startsWith('/category/')) {
    const id = String(route.params.categoryId || '')
    if (id === 'uncategorized') return 'uncategorized'
    if (id) return id
  }
  if (route.path === '/list') return 'all'
  if (route.query.q || route.query.view === 'list') return 'all'
  if ((settings.hasHomepage || settings.blogMode) && route.path === '/') return 'home'
  return 'all'
})

const filteredTree = computed(() => wiki.tree)

watch(() => [wiki.categories.map((category) => category.id).join(','), settings.categoryTreeExpand], () => {
  if (props.showTree) applyTreeExpand()
}, { immediate: true })

watch(selectedKey, (key) => {
  treeSelected.value = NAV_KEYS.has(key) ? null : Number(key)
  if (props.showTree) ensureSelectedVisible()
}, { immediate: true })

function defaultExpandedIds() {
  const mode = settings.categoryTreeExpand
  if (mode === 'collapsed') return []
  if (mode === 'root') {
    return wiki.categories
      .filter((category) => category.parent_id == null)
      .map((category) => category.id)
  }
  return wiki.categories.map((category) => category.id)
}

function ancestorIds(categoryId) {
  const byId = new Map(wiki.categories.map((category) => [category.id, category]))
  const ids = []
  let current = byId.get(Number(categoryId))
  while (current?.parent_id) {
    ids.push(current.parent_id)
    current = byId.get(current.parent_id)
  }
  return ids
}

function applyTreeExpand() {
  const ids = new Set(defaultExpandedIds())
  const key = selectedKey.value
  if (key && !NAV_KEYS.has(key)) {
    for (const id of ancestorIds(key)) ids.add(id)
  }
  expanded.value = [...ids]
}

function ensureSelectedVisible() {
  const key = selectedKey.value
  if (!key || NAV_KEYS.has(key)) return
  const extra = ancestorIds(key)
  if (!extra.length) return
  const ids = new Set(expanded.value)
  for (const id of extra) ids.add(id)
  expanded.value = [...ids]
}

function go(query) {
  const empty = !query || !Object.keys(query).length
  if (empty && isWikimanNativeApp() && notifyWikimanNativeApp('goHome')) return
  router.replace({ path: '/', query })
}

function select(key) {
  if (key === 'home') go({})
  else if (key === 'all') {
    router.push({ path: '/list', query: route.query.q ? { q: route.query.q } : {} })
  }
  else if (key === 'uncategorized') {
    router.push({ path: '/category/uncategorized', query: pickQ() })
  }
  else if (key === 'keywords') router.push('/keywords')
  else if (key === 'quick-posts') router.push('/quick-posts')
  else if (key === 'trash') router.push('/trash')
}

function onTreeSelect(id) {
  if (id == null) return
  router.push({ path: `/category/${id}`, query: pickQ() })
}

function pickQ() {
  return route.query.q ? { q: route.query.q } : {}
}
</script>
