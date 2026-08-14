<template>
  <div class="wiki-nav">
    <q-input
      v-model="filter"
      dense
      outlined
      placeholder="카테고리 찾기"
      class="q-mb-sm"
      clearable
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-list dense>
      <q-item
        v-if="settings.hasHomepage"
        clickable
        :active="selectedKey === 'home'"
        active-class="wiki-nav-active"
        @click="select('home')"
      >
        <q-item-section avatar><q-icon name="home" /></q-item-section>
        <q-item-section>홈</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'all'"
        active-class="wiki-nav-active"
        @click="select('all')"
      >
        <q-item-section avatar><q-icon name="article" /></q-item-section>
        <q-item-section>전체 글</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'uncategorized'"
        active-class="wiki-nav-active"
        @click="select('uncategorized')"
      >
        <q-item-section avatar><q-icon name="inbox" /></q-item-section>
        <q-item-section>미분류</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'keywords'"
        active-class="wiki-nav-active"
        @click="select('keywords')"
      >
        <q-item-section avatar><q-icon name="sell" /></q-item-section>
        <q-item-section>키워드</q-item-section>
      </q-item>
      <q-item
        v-if="auth.canWrite"
        clickable
        :active="selectedKey === 'trash'"
        active-class="wiki-nav-active"
        @click="select('trash')"
      >
        <q-item-section avatar><q-icon name="delete" /></q-item-section>
        <q-item-section>휴지통</q-item-section>
      </q-item>
    </q-list>

    <q-tree
      class="q-mt-sm wiki-category-tree"
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
            비공개
          </q-badge>
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const filter = ref('')
const treeSelected = ref(null)
const expanded = ref([])

const selectedKey = computed(() => {
  if (route.path === '/trash') return 'trash'
  if (route.path === '/keywords' || route.path.startsWith('/keyword/')) return 'keywords'
  const id = route.query.categoryId
  if (id === 'uncategorized') return 'uncategorized'
  if (id) return String(id)
  if (route.query.q || route.query.view === 'list') return 'all'
  if (settings.hasHomepage && route.path === '/') return 'home'
  return 'all'
})

const filteredTree = computed(() => wiki.tree)

watch(() => [wiki.categories.map((category) => category.id).join(','), settings.categoryTreeExpand], () => {
  applyTreeExpand()
}, { immediate: true })

watch(selectedKey, (key) => {
  treeSelected.value = key === 'all' || key === 'home' || key === 'uncategorized' || key === 'keywords' || key === 'trash'
    ? null
    : Number(key)
  ensureSelectedVisible()
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
  if (key && key !== 'all' && key !== 'home' && key !== 'uncategorized' && key !== 'keywords' && key !== 'trash') {
    for (const id of ancestorIds(key)) ids.add(id)
  }
  expanded.value = [...ids]
}

function ensureSelectedVisible() {
  const key = selectedKey.value
  if (!key || key === 'all' || key === 'home' || key === 'uncategorized' || key === 'keywords' || key === 'trash') return
  const extra = ancestorIds(key)
  if (!extra.length) return
  const ids = new Set(expanded.value)
  for (const id of extra) ids.add(id)
  expanded.value = [...ids]
}

function go(query) {
  router.push({ path: '/', query })
}

function select(key) {
  if (key === 'home') go({})
  else if (key === 'all') go(route.query.q ? { q: route.query.q } : (settings.hasHomepage ? { view: 'list' } : {}))
  else if (key === 'uncategorized') go({ ...pickQ(), categoryId: 'uncategorized' })
  else if (key === 'keywords') router.push('/keywords')
  else if (key === 'trash') router.push('/trash')
}

function onTreeSelect(id) {
  if (id == null) return
  go({ ...pickQ(), categoryId: String(id) })
}

function pickQ() {
  return route.query.q ? { q: route.query.q } : {}
}
</script>
