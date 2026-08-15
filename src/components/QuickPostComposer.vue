<template>
  <q-card flat bordered class="wiki-quick-composer q-mb-md">
    <q-expansion-item
      v-model="expanded"
      dense
      expand-separator
      icon="edit_note"
      :label="t('remaining.k049')"
      header-class="text-weight-medium"
    >
      <div class="q-pa-sm">
        <QuickPostFormFields
          ref="formRef"
          v-model="content"
          :error="error"
          :editor-key="editorKey"
          compact
          actions-space
        >
          <template #actions-start>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :label="t('remaining.k050')"
              to="/quick-posts"
            />
          </template>
          <template #actions-end>
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="t('remaining.k051')"
              :loading="saving"
              :disable="!canSave"
              @click="save"
            />
          </template>
        </QuickPostFormFields>
      </div>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import { useI18n } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import {
  emptyQuickPostContent,
  hasQuickPostContent
} from '@/utils/quickPostContent'
import QuickPostFormFields from '@/components/QuickPostFormFields.vue'

const props = defineProps({
  defaultExpanded: { type: Boolean, default: true }
})

const { t } = useI18n()
const $q = useQuasar()
const settings = useSettingsStore()
const formRef = ref(null)
const expanded = ref(props.defaultExpanded)
const content = ref('')
const editorKey = ref(0)
const saving = ref(false)
const error = ref('')
const editorType = computed(() => settings.quickPostEditor || 'tui')
const canSave = computed(() => hasQuickPostContent(content.value, editorType.value))

function resetContent() {
  content.value = emptyQuickPostContent(editorType.value)
  editorKey.value += 1
}

onMounted(async () => {
  await settings.ensureLoaded()
  resetContent()
})

async function save() {
  if (!canSave.value) {
    $q.notify({ type: 'negative', message: t('remaining.k048') })
    return
  }
  formRef.value?.stopSpeech()
  saving.value = true
  error.value = ''
  try {
    await api.post('/quick-posts', { content: content.value })
    resetContent()
    $q.notify({ type: 'positive', message: t('remaining.k052') })
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k053'))
  } finally {
    saving.value = false
  }
}
</script>
