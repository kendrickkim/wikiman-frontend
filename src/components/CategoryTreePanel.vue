<template>
  <div>
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
        clickable
        :active="selectedKey === 'all'"
        active-class="bg-blue-1 text-primary"
        @click="select('all')"
      >
        <q-item-section avatar><q-icon name="home" /></q-item-section>
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
      :nodes="filteredTree"
      node-key="id"
      :filter="filter"
      selected-color="primary"
      v-model:selected="treeSelected"
      default-expand-all
      @update:selected="onTreeSelect"
    />

    <q-btn
      v-if="auth.canWrite"
      class="q-mt-md full-width"
      outline
      no-caps
      icon="edit"
      label="카테고리 관리"
      @click="managerOpen = true"
    />

    <CategoryManagerDialog v-model="managerOpen" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import CategoryManagerDialog from './CategoryManagerDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const wiki = useWikiStore()
const filter = ref('')
const managerOpen = ref(false)
const treeSelected = ref(null)

const selectedKey = computed(() => {
  const id = route.query.categoryId
  if (id === 'uncategorized') return 'uncategorized'
  if (id) return String(id)
  return 'all'
})

const filteredTree = computed(() => wiki.tree)

watch(selectedKey, (key) => {
  treeSelected.value = key === 'all' || key === 'uncategorized' ? null : Number(key)
}, { immediate: true })

function go(query) {
  router.push({ path: '/', query })
}

function select(key) {
  if (key === 'all') go(route.query.q ? { q: route.query.q } : {})
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
