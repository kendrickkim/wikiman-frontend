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
        v-if="settings.homePostId"
        clickable
        :active="selectedKey === 'home'"
        active-class="bg-blue-1 text-primary"
        @click="select('home')"
      >
        <q-item-section avatar><q-icon name="home" /></q-item-section>
        <q-item-section>홈</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'all'"
        active-class="bg-blue-1 text-primary"
        @click="select('all')"
      >
        <q-item-section avatar><q-icon name="article" /></q-item-section>
        <q-item-section>전체 글</q-item-section>
      </q-item>
      <q-item
        clickable
        :active="selectedKey === 'uncategorized'"
        active-class="bg-blue-1 text-primary"
        @click="select('uncategorized')"
      >
        <q-item-section avatar><q-icon name="inbox" /></q-item-section>
        <q-item-section>미분류</q-item-section>
      </q-item>
    </q-list>

    <q-tree
      class="q-mt-sm"
      dense
      :nodes="filteredTree"
      node-key="id"
      :filter="filter"
      selected-color="primary"
      v-model:selected="treeSelected"
      v-model:expanded="expanded"
      @update:selected="onTreeSelect"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const wiki = useWikiStore()
const settings = useSettingsStore()
const filter = ref('')
const treeSelected = ref(null)
const expanded = ref([])

const selectedKey = computed(() => {
  const id = route.query.categoryId
  if (id === 'uncategorized') return 'uncategorized'
  if (id) return String(id)
  if (route.query.q || route.query.view === 'list') return 'all'
  if (settings.homePostId && route.path === '/') return 'home'
  return 'all'
})

const filteredTree = computed(() => wiki.tree)

watch(() => wiki.categories.map((category) => category.id).join(','), () => {
  expanded.value = wiki.categories.map((category) => category.id)
}, { immediate: true })

watch(selectedKey, (key) => {
  treeSelected.value = key === 'all' || key === 'home' || key === 'uncategorized' ? null : Number(key)
}, { immediate: true })

function go(query) {
  router.push({ path: '/', query })
}

function select(key) {
  if (key === 'home') go({})
  else if (key === 'all') go(route.query.q ? { q: route.query.q } : (settings.homePostId ? { view: 'list' } : {}))
  else if (key === 'uncategorized') go({ ...pickQ(), categoryId: 'uncategorized' })
}

function onTreeSelect(id) {
  if (id == null) return
  go({ ...pickQ(), categoryId: String(id) })
}

function pickQ() {
  return route.query.q ? { q: route.query.q } : {}
}
</script>
