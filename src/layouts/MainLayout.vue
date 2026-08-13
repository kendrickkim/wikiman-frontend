<template>
  <q-layout
    view="hHh lpR fFf"
    :class="isDesktop ? 'wiki-layout-desktop' : 'wiki-layout-mobile'"
  >
    <q-header
      :elevated="!isDesktop"
      :bordered="isDesktop || !settings.isDark"
      :class="headerClass"
    >
      <q-toolbar v-if="isDesktop" class="wiki-toolbar-desktop">
        <q-btn dense flat round icon="menu" aria-label="메뉴" @click="leftDrawer = !leftDrawer" />
        <q-toolbar-title class="cursor-pointer wiki-brand ellipsis" @click="goHome">
          {{ settings.siteTitle }}
        </q-toolbar-title>
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="글 검색"
          :dark="settings.isDark"
          :bg-color="settings.isDark ? undefined : 'grey-2'"
          class="wiki-search"
          debounce="300"
          @keyup.enter="applySearch"
          @update:model-value="applySearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-space />
        <q-btn
          v-if="auth.canWrite"
          unelevated
          color="primary"
          icon="add"
          label="새 글"
          no-caps
          to="/posts/new"
        />
        <q-btn
          v-if="!auth.isLoggedIn"
          outline
          no-caps
          color="primary"
          label="로그인"
          to="/login"
        />
        <q-btn-dropdown v-else flat no-caps dropdown-icon="expand_more">
          <template #label>
            <div class="row items-center no-wrap">
              <q-avatar size="28px" color="primary" text-color="white" class="q-mr-sm">
                {{ auth.user.username.slice(0, 1).toUpperCase() }}
              </q-avatar>
              <span>{{ auth.user.username }}</span>
            </div>
          </template>
          <q-list>
            <q-item v-if="auth.canWrite" clickable v-close-popup to="/settings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>사이트 관리</q-item-section>
            </q-item>
            <q-item clickable v-close-popup to="/trash">
              <q-item-section avatar>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>휴지통</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="logout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>로그아웃</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>

      <template v-else>
        <q-toolbar>
          <q-btn dense flat round icon="menu" aria-label="메뉴" @click="leftDrawer = !leftDrawer" />
          <q-toolbar-title class="cursor-pointer ellipsis" style="max-width: 42vw;" @click="goHome">
            {{ settings.siteTitle }}
          </q-toolbar-title>
          <q-space />
          <q-btn
            v-if="$q.screen.lt.sm"
            flat
            round
            dense
            icon="search"
            aria-label="검색"
            @click="mobileSearch = !mobileSearch"
          />
            <q-input
            v-else
            v-model="search"
            :dark="settings.isDark"
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
            v-if="auth.canWrite"
            unelevated
            color="primary"
            icon="add"
            :label="$q.screen.gt.xs ? '새 글' : undefined"
            :round="$q.screen.lt.sm"
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
              <q-item v-if="auth.canWrite" clickable v-close-popup to="/settings">
                <q-item-section>사이트 관리</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/trash">
                <q-item-section>휴지통</q-item-section>
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
            :dark="settings.isDark"
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
      </template>
    </q-header>

    <q-drawer
      v-model="leftDrawer"
      bordered
      :width="drawerWidth"
      :breakpoint="1023"
      :class="drawerClass"
    >
      <div class="wiki-drawer-inner">
        <div class="wiki-drawer-title">카테고리</div>
        <CategoryTreePanel />
        <q-btn
          v-if="auth.isLoggedIn"
          class="q-mt-md full-width"
          flat
          no-caps
          icon="delete"
          label="휴지통"
          to="/trash"
        />
        <q-btn
          v-if="auth.canWrite"
          class="q-mt-sm full-width"
          flat
          no-caps
          icon="settings"
          label="사이트 관리"
          to="/settings"
        />
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
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'
import { useLayout } from '@/composables/useLayout'
import CategoryTreePanel from '@/components/CategoryTreePanel.vue'

const route = useRoute()
const router = useRouter()
const { $q, isDesktop } = useLayout()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const leftDrawer = ref(false)
const mobileSearch = ref(false)
const search = ref(String(route.query.q || ''))
const drawerWidth = computed(() => (isDesktop.value ? 300 : Math.min(300, $q.screen.width - 24)))
const headerClass = computed(() => {
  const layout = isDesktop.value ? 'wiki-header wiki-header--desktop' : 'wiki-header wiki-header--mobile'
  return settings.isDark
    ? `bg-dark text-white ${layout}`
    : `bg-white text-dark ${layout}`
})
const drawerClass = computed(() => {
  if (settings.isDark) return 'bg-dark text-white wiki-drawer'
  return isDesktop.value ? 'bg-grey-1 wiki-drawer wiki-drawer--desktop' : 'bg-white wiki-drawer'
})

onMounted(async () => {
  leftDrawer.value = isDesktop.value
  await Promise.all([auth.restore(), wiki.loadCategories(), settings.load()])
})

watch(isDesktop, (desktop) => {
  leftDrawer.value = desktop
})

watch(() => route.fullPath, () => {
  if (!isDesktop.value) leftDrawer.value = false
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
  if (!isDesktop.value && $q.screen.lt.sm) mobileSearch.value = false
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>
