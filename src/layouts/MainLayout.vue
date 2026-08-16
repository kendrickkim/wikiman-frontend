<template>
  <q-layout
    :view="layoutView"
    :class="isDesktop ? 'wiki-layout-desktop' : 'wiki-layout-mobile'"
  >
    <q-header
      :elevated="!isDesktop"
      :bordered="isDesktop || !settings.isDark"
      :class="headerClass"
    >
      <template v-if="isDesktop">
      <q-toolbar class="wiki-toolbar-desktop">
        <q-btn dense flat round icon="menu" :aria-label="t('common.menu')" @click="leftDrawer = !leftDrawer" />
        <q-toolbar-title class="cursor-pointer wiki-brand ellipsis" @click="goHome">
          {{ settings.siteTitle }}
        </q-toolbar-title>
        <q-input
          v-model="search"
          dense
          outlined
          :placeholder="t('posts.searchPlaceholder')"
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
          v-if="treeOnRight"
          dense
          flat
          round
          icon="account_tree"
          :aria-label="t('common.category')"
          @click="rightDrawer = !rightDrawer"
        />
        <q-btn
          v-if="auth.canWrite"
          unelevated
          color="primary"
          icon="add"
          :label="t('nav.write')"
          no-caps
          to="/posts/new"
        />
        <q-btn
          v-if="!auth.isLoggedIn"
          outline
          no-caps
          color="primary"
          :label="t('nav.login')"
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
              <q-item-section>{{ t('nav.settings') }}</q-item-section>
            </q-item>
            <q-item v-if="isNativeApp" clickable v-close-popup @click="changeConnection">
              <q-item-section avatar>
                <q-icon name="manage_accounts" />
              </q-item-section>
              <q-item-section>{{ t('nav.changeConnection') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="logout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>{{ t('nav.logout') }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
      <q-toolbar v-if="settings.showTopMenu" class="wiki-top-menu-bar">
        <q-btn
          v-for="item in settings.topMenuItems"
          :key="item.id"
          flat
          no-caps
          dense
          :label="item.label"
          v-bind="topMenuLinkProps(item)"
          active-class="wiki-top-menu-active"
        />
      </q-toolbar>
      </template>

      <template v-else>
        <q-toolbar>
          <q-btn dense flat round icon="menu" :aria-label="t('common.menu')" @click="leftDrawer = !leftDrawer" />
          <q-toolbar-title class="cursor-pointer wiki-brand ellipsis" @click="goHome">
            {{ settings.siteTitle }}
          </q-toolbar-title>
          <q-space />
          <q-btn
            v-if="$q.screen.lt.sm"
            flat
            round
            dense
            icon="search"
            :aria-label="t('common.search')"
            @click="mobileSearch = !mobileSearch"
          />
            <q-input
            v-else
            v-model="search"
            :dark="settings.isDark"
            dense
            outlined
            :placeholder="t('common.search')"
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
            :label="$q.screen.gt.xs ? t('nav.write') : undefined"
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
            :label="$q.screen.gt.xs ? t('nav.login') : undefined"
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
                <q-item-section>{{ t('nav.settings') }}</q-item-section>
              </q-item>
              <q-item v-if="isNativeApp" clickable v-close-popup @click="changeConnection">
                <q-item-section>{{ t('nav.changeConnection') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="logout">
                <q-item-section>{{ t('nav.logout') }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </q-toolbar>
        <q-toolbar v-if="settings.showTopMenu" class="wiki-top-menu-bar">
          <q-btn
            v-for="item in settings.topMenuItems"
            :key="item.id"
            flat
            no-caps
            dense
            :label="item.label"
            v-bind="topMenuLinkProps(item)"
            active-class="wiki-top-menu-active"
          />
        </q-toolbar>
        <q-toolbar v-if="mobileSearch && $q.screen.lt.sm" class="q-pt-none">
          <q-input
            v-model="search"
            :dark="settings.isDark"
            dense
            outlined
            :placeholder="t('common.search')"
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
      side="left"
      bordered
      :width="drawerWidth"
      :breakpoint="1023"
      :class="drawerClass"
    >
      <div class="wiki-drawer-inner">
        <div v-if="treeOnRight" class="wiki-drawer-title">{{ t('common.menu') }}</div>
        <CategoryTreePanel :show-nav="true" :show-tree="!treeOnRight" />
      </div>
    </q-drawer>

    <q-drawer
      v-if="treeOnRight"
      v-model="rightDrawer"
      side="right"
      bordered
      :width="drawerWidth"
      :breakpoint="1023"
      :class="drawerClass"
    >
      <div class="wiki-drawer-inner">
        <CategoryTreePanel :show-nav="false" :show-tree="true" />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
      <div class="wiki-powered-by" aria-hidden="false">
        {{ t('common.poweredBy') }}
      </div>
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
import { useI18n } from '@/i18n'
import { isWikimanNativeApp, notifyWikimanNativeApp } from '@/utils/nativeApp'

const route = useRoute()
const router = useRouter()
const { $q, isDesktop } = useLayout()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const { t } = useI18n()
const isNativeApp = isWikimanNativeApp()
const leftDrawer = ref(false)
const rightDrawer = ref(false)
const mobileSearch = ref(false)
const search = ref(String(route.query.q || ''))
const drawerWidth = computed(() => (isDesktop.value ? 300 : Math.min(300, $q.screen.width - 24)))
const treeOnRight = computed(() => isDesktop.value && settings.categoryTreeSide === 'right')
const layoutView = computed(() => (treeOnRight.value ? 'hHh LpR fFf' : 'hHh lpR fFf'))
const defaultRightDrawerOpen = computed(() => (
  treeOnRight.value && settings.rightMenuDefaultOpen !== false
))
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
  rightDrawer.value = false
  await Promise.all([auth.ensureLoaded(), wiki.ensureLoaded(), settings.ensureLoaded()])
  leftDrawer.value = isDesktop.value
  rightDrawer.value = defaultRightDrawerOpen.value
})

watch(isDesktop, (desktop) => {
  leftDrawer.value = desktop
  rightDrawer.value = desktop ? defaultRightDrawerOpen.value : false
})

watch(treeOnRight, () => {
  rightDrawer.value = defaultRightDrawerOpen.value
})

watch(() => settings.rightMenuDefaultOpen, () => {
  if (treeOnRight.value) rightDrawer.value = defaultRightDrawerOpen.value
})

watch(() => route.fullPath, () => {
  if (!isDesktop.value) leftDrawer.value = false
})

watch(() => route.query.q, (q) => {
  search.value = String(q || '')
})

watch(() => auth.isLoggedIn, () => {
  wiki.ensureLoaded({ force: true })
})

function topMenuLinkProps(item) {
  if (item.postId) {
    return { to: `/posts/${item.postId}` }
  }
  const url = String(item.url || '').trim()
  if (url.startsWith('/') && !url.startsWith('//')) {
    return { to: url }
  }
  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}

function goHome() {
  router.push('/')
}

function applySearch() {
  const next = {}
  if (search.value.trim()) next.q = search.value.trim()
  router.push({ path: '/', query: next })
  if (!isDesktop.value && $q.screen.lt.sm) mobileSearch.value = false
}

function logout() {
  auth.logout()
  wiki.ensureLoaded({ force: true })
  router.push('/')
}

function changeConnection() {
  notifyWikimanNativeApp('changeConnection')
}
</script>
