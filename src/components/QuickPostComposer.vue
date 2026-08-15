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
      <div class="q-pa-md">
        <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>
        <QuickPostBodyEditor
          :key="editorKey"
          v-model="content"
          compact
          :editor-key="editorKey"
        />
        <PostLinkPreviews :content="content" :max-links="5" extra-class="q-mt-md" />

        <div class="row q-gutter-sm q-mt-md items-center">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            :label="t('remaining.k050')"
            to="/quick-posts"
          />
          <q-space />
          <div v-if="speechListening" class="text-caption text-negative">
            {{ t('speech.listening') }}
          </div>
          <q-btn
            v-if="speechSupported"
            round
            dense
            :outline="!speechListening"
            :unelevated="speechListening"
            :color="speechListening ? 'negative' : 'primary'"
            :icon="speechListening ? 'stop' : 'mic'"
            :aria-label="speechListening ? t('speech.stop') : t('speech.start')"
            @click="toggleSpeech"
          >
            <q-tooltip>
              {{ speechListening ? t('speech.stop') : t('speech.start') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('remaining.k051')"
            :loading="saving"
            :disable="!canSave"
            @click="save"
          />
        </div>
      </div>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'
import {
  appendQuickPostSpeech,
  emptyQuickPostContent,
  hasQuickPostContent
} from '@/utils/quickPostContent'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import QuickPostBodyEditor from '@/components/QuickPostBodyEditor.vue'

const props = defineProps({
  defaultExpanded: { type: Boolean, default: true }
})

const $q = useQuasar()
const settings = useSettingsStore()
const expanded = ref(props.defaultExpanded)
const content = ref('')
const editorKey = ref(0)
const saving = ref(false)
const error = ref('')
const editorType = computed(() => settings.quickPostEditor || 'textarea')
const canSave = computed(() => hasQuickPostContent(content.value, editorType.value))
const {
  supported: speechSupported,
  listening: speechListening,
  stop: stopSpeech,
  toggle: toggleSpeech
} = useSpeechRecognition({
  onTranscript(transcript) {
    content.value = appendQuickPostSpeech(content.value, editorType.value, transcript)
  },
  onError(code) {
    if (code === 'aborted' || code === 'no-speech') return
    const key = code === 'not-allowed' || code === 'service-not-allowed'
      ? 'speech.permissionDenied'
      : code === 'audio-capture'
        ? 'speech.microphoneUnavailable'
        : 'speech.failed'
    $q.notify({ type: 'negative', message: t(key) })
  }
})

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
  stopSpeech()
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
