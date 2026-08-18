<template>
  <q-page class="wiki-page">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">
        {{ t('settings.title') }}<span v-if="sectionLabel"> &gt; {{ sectionLabel }}</span>
      </div>
      <router-view />
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayout } from '@/composables/useLayout'
import { useI18n } from '@/i18n'

const route = useRoute()
const { isDesktop } = useLayout()
const { t } = useI18n()
const settingsSections = computed(() => [
  { to: '/settings/general', label: t('settings.general') },
  { to: '/settings/top-menu', label: t('settings.topMenu') },
  { to: '/settings/categories', label: t('settings.categories') },
  { to: '/settings/homepage', label: t('settings.homepage') },
  { to: '/settings/blog', label: t('settings.blog') },
  { to: '/settings/quick-posts', label: t('settings.quickPosts') },
  { to: '/settings/attachments', label: t('settings.attachments') },
  { to: '/settings/data', label: t('settings.data') },
  { to: '/settings/update', label: t('settings.update') }
])

const sectionLabel = computed(() => {
  const match = settingsSections.value.find((item) => route.path.startsWith(item.to))
  return match?.label || ''
})
</script>
