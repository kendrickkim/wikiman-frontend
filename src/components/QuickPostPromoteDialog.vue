<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: min(420px, 92vw)">
      <q-card-section>
        <div class="text-h6">포스트 이동</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          일반 포스트로 옮길 옵션을 확인하세요.
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-body2 text-weight-medium q-mb-sm">에디터</div>
        <q-select
          v-if="askEditor"
          v-model="editorType"
          outlined
          emit-value
          map-options
          label="에디터"
          :options="EDITOR_OPTIONS"
        />
        <div v-else class="text-body2 text-grey-7">
          설정에 따라 {{ fixedEditorLabel }}를 사용합니다.
        </div>

        <div class="q-mt-lg">
          <div class="text-body2 text-weight-medium q-mb-sm">간단 포스트 원본</div>
          <q-option-group
            v-if="settings.quickPostPromoteSourceMode === 'ask'"
            v-model="sourceAction"
            color="primary"
            :options="sourceOptions"
          />
          <div v-else class="text-body2 text-grey-7">
            {{ settings.quickPostPromoteSourceMode === 'keep' ? '설정에 따라 원본을 유지합니다.' : '설정에 따라 원본을 삭제합니다.' }}
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps label="취소" :disable="loading" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="포스트로 이동"
          :loading="loading"
          @click="$emit('confirm', { editorType: resolvedEditorType, keepSource })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
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
  { label: '이동 후 삭제', value: 'delete' },
  { label: '원본 유지', value: 'keep' }
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
