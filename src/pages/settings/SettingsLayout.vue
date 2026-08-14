<template>
  <q-page class="wiki-page">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">
        사이트 관리<span v-if="sectionLabel"> &gt; {{ sectionLabel }}</span>
      </div>
      <router-view />
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayout } from '@/composables/useLayout'

const SETTINGS_SECTIONS = [
  { to: '/settings/general', label: '일반' },
  { to: '/settings/top-menu', label: '상단 메뉴' },
  { to: '/settings/categories', label: '카테고리' },
  { to: '/settings/homepage', label: '홈페이지' },
  { to: '/settings/attachments', label: '첨부파일' },
  { to: '/settings/backup', label: '백업/복구' }
]

const route = useRoute()
const { isDesktop } = useLayout()

const sectionLabel = computed(() => {
  const match = SETTINGS_SECTIONS.find((item) => route.path.startsWith(item.to))
  return match?.label || ''
})
</script>
