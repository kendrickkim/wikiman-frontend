<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">{{ t('categories.title') }}</div>
      <div class="text-grey-7 text-caption q-mt-xs">{{ t('categories.description') }}</div>
    </q-card-section>
    <q-card-section>
      <CategoryManagerPanel />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import CategoryManagerPanel from '@/components/CategoryManagerPanel.vue'

const wiki = useWikiStore()

onMounted(() => {
  wiki.ensureLoaded()
})
</script>
