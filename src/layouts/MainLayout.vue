<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark text-white wiki-header">
      <q-toolbar>
        <q-btn dense flat round icon="menu" aria-label="메뉴" @click="leftDrawer = !leftDrawer" />
        <q-toolbar-title class="cursor-pointer ellipsis" style="max-width: 42vw;" @click="goHome">
          Wikiman
        </q-toolbar-title>
        <q-space />
        <q-input
          v-if="$q.screen.gt.xs"
          v-model="search"
          dark
          dense
          outlined
          placeholder="검색"
          class="q-mr-sm wiki-search"
          debounce="300"
          @keyup.enter="applySearch"
          @update:model-value="applySearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          v-else
          flat
          round
          dense
          icon="search"
          aria-label="검색"
          @click="mobileSearch = !mobileSearch"
        />
        <q-btn
          v-if="auth.canWrite"
          unelevated
          color="primary"
          icon="add"
          :label="$q.screen.gt.sm ? '새 글' : undefined"
          :round="$q.screen.lt.md"
          dense
          no-caps
          to="/posts/new"
        />
        <q-btn
          v-if="!auth.isLoggedIn"
          flat
          no-caps
          :dense="$q.screen.lt.sm"
          :label="$q.screen.gt.xs ? '로그인' : undefined"
          :icon="$q.screen.lt.sm ? 'login' : undefined"
          to="/login"
        />
        <q-btn-dropdown
          v-else
          flat
          no-caps
          :dense="$q.screen.lt.sm"
          :icon="$q.screen.lt.sm ? 'account_circle' : undefined"
          :label="$q.screen.gt.xs ? auth.user.username : undefined"
        >
          <q-list>
            <q-item>
              <q-item-section class="text-grey-8">{{ auth.user.username }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="logout">
              <q-item-section>로그아웃</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
      <q-toolbar v-if="mobileSearch && $q.screen.lt.sm" class="q-pt-none">
        <q-input
          v-model="search"
          dark
          dense
          outlined
          placeholder="검색"
          class="full-width"
          debounce="300"
          autofocus
          @keyup.enter="applySearch"
          @update:model-value="applySearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template #append>
            <q-icon name="close" class="cursor-pointer" @click="mobileSearch = false" />
          </template>
        </q-input>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawer"
      show-if-above
      bordered
      :width="drawerWidth"
      class="bg-white"
      :breakpoint="1023"
    >
      <div class="q-pa-md">
        <div class="text-subtitle2 q-mb-sm">카테고리</div>
        <CategoryTreePanel />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import CategoryTreePanel from '@/components/CategoryTreePanel.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()
const wiki = useWikiStore()
const leftDrawer = ref(false)
const mobileSearch = ref(false)
const search = ref(String(route.query.q || ''))
const drawerWidth = computed(() => ($q.screen.lt.sm ? Math.min(300, $q.screen.width - 24) : 280))

onMounted(async () => {
  leftDrawer.value = $q.screen.gt.sm
  await Promise.all([auth.restore(), wiki.loadCategories()])
})

watch(() => $q.screen.gt.sm, (desktop) => {
  leftDrawer.value = desktop
})

watch(() => route.fullPath, () => {
  if ($q.screen.lt.md) leftDrawer.value = false
})

watch(() => route.query.q, (q) => {
  search.value = String(q || '')
})

function goHome() {
  router.push('/')
}

function applySearch() {
  const next = { ...route.query }
  if (search.value.trim()) next.q = search.value.trim()
  else delete next.q
  router.push({ path: '/', query: next })
  if ($q.screen.lt.sm) mobileSearch.value = false
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.wiki-header {
  padding-top: env(safe-area-inset-top);
}

.wiki-search {
  width: min(320px, 36vw);
}
</style>
