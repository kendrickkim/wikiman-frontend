<template>
  <q-dialog :model-value="modelValue" :maximized="$q.screen.lt.md" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="category-manager-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ t('remaining.k001') }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>
      <q-card-section>
        <CategoryManagerPanel @saved="$emit('saved')" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { useQuasar } from 'quasar'
import CategoryManagerPanel from './CategoryManagerPanel.vue'

defineProps({
  modelValue: { type: Boolean, default: false }
})
defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
</script>

<style scoped>
.category-manager-card {
  width: min(800px, 100vw);
}

@media (max-width: 1023px) {
  .category-manager-card {
    width: 100%;
    max-width: 100%;
    min-height: 100%;
  }
}
</style>
