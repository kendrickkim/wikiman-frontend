<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: min(420px, 92vw)">
      <q-card-section>
        <div class="text-h6">{{ t('remaining.k059') }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">{{ t('remaining.k060') }}</div>
      </q-card-section>

      <q-card-section>
        <div class="text-body2 text-weight-medium q-mb-sm">{{ t('posts.editor') }}</div>
        <q-select
          v-if="askEditor"
          v-model="editorType"
          outlined
          emit-value
          map-options
          :label="t('posts.editor')"
          :options="EDITOR_OPTIONS"
        />
        <div v-else class="text-body2 text-grey-7">
          {{ t('extra.useEditor', { editor: fixedEditorLabel }) }}
        </div>

        <div class="q-mt-lg">
          <div class="text-body2 text-weight-medium q-mb-sm">{{ t('remaining.k061') }}</div>
          <q-option-group
            v-if="settings.quickPostPromoteSourceMode === 'ask'"
            v-model="sourceAction"
            color="primary"
            :options="sourceOptions"
          />
          <div v-else class="text-body2 text-grey-7">
            {{ settings.quickPostPromoteSourceMode === 'keep' ? t('remaining.k055') : t('remaining.k056') }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps :label="t('dialogs.cancel')" :disable="loading" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="t('remaining.k054')"
          :loading="loading"
          @click="$emit('confirm', { editorType: resolvedEditorType, keepSource })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { computed, ref, watch } from 'vue'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { EDITOR_OPTIONS } from '@/utils/editors'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'confirm'])

const { isDesktop } = useLayout()
const settings = useSettingsStore()
const editorType = ref(settings.defaultEditorFor(isDesktop.value))
const sourceAction = ref('delete')
const sourceOptions = [
  { label: t('remaining.k057'), value: 'delete' },
  { label: t('remaining.k058'), value: 'keep' }
]
const askEditor = computed(() => settings.quickPostPromoteEditor === 'ask')
const resolvedEditorType = computed(() => (
  askEditor.value ? editorType.value : settings.quickPostPromoteEditor
))
const fixedEditorLabel = computed(() => (
  EDITOR_OPTIONS.find((option) => option.value === settings.quickPostPromoteEditor)?.label
  || settings.quickPostPromoteEditor
))
const keepSource = computed(() => (
  settings.quickPostPromoteSourceMode === 'keep'
  || (settings.quickPostPromoteSourceMode === 'ask' && sourceAction.value === 'keep')
))

watch(() => props.modelValue, (opened) => {
  if (opened) {
    editorType.value = settings.defaultEditorFor(isDesktop.value)
    sourceAction.value = 'delete'
  }
})
</script>
