<template>
  <div class="category-select row no-wrap items-start q-gutter-sm">
    <CategoryTreeSelect
      class="col"
      :model-value="modelValue"
      :label="t('categories.title')"
      root-:label="t('common.uncategorized')"
      empty-icon="folder_off"
      :empty-value="null"
      :dense="!isDesktop"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <q-btn
      v-if="canManage"
      class="category-select__manage"
      :class="{ 'category-select__manage--dense': !isDesktop }"
      outline
      no-caps
      unelevated
      icon="account_tree"
      :label="isDesktop ? t('common.manage') : undefined"
      :aria-label="t('remaining.k001')"
      @click="managerOpen = true"
    />
    <CategoryManagerDialog v-model="managerOpen" @saved="onSaved" />
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { computed, ref } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import { useAuthStore } from '@/stores/auth'
import { useLayout } from '@/composables/useLayout'
import CategoryManagerDialog from './CategoryManagerDialog.vue'
import CategoryTreeSelect from './CategoryTreeSelect.vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'managed'])

const { isDesktop } = useLayout()
const wiki = useWikiStore()
const auth = useAuthStore()
const managerOpen = ref(false)
const canManage = computed(() => auth.canWrite)

function onSaved() {
  const id = props.modelValue
  if (id != null && !wiki.categories.some((c) => c.id === Number(id))) {
    emit('update:modelValue', null)
  }
  emit('managed')
}
</script>

<style scoped>
.category-select__manage {
  min-height: 56px;
  height: 56px;
  padding: 0 16px;
}

.category-select__manage--dense {
  min-height: 40px;
  height: 40px;
  padding: 0 12px;
}
</style>
