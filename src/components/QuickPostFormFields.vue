<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <QuickPostBodyEditor
      :key="editorKey"
      :model-value="modelValue"
      :compact="compact"
      :editor-key="editorKey"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <PostLinkPreviews :content="modelValue" :max-links="maxLinks" extra-class="q-mt-sm" />

    <div class="row q-gutter-sm q-mt-sm items-center" :class="actionsClass">
      <slot name="actions-start" />
      <q-space v-if="actionsSpace" />
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
      <slot name="actions-end" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'
import { useSettingsStore } from '@/stores/settings'
import { appendQuickPostSpeech } from '@/utils/quickPostContent'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import QuickPostBodyEditor from '@/components/QuickPostBodyEditor.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  error: { type: String, default: '' },
  editorKey: { type: [String, Number], default: 0 },
  compact: { type: Boolean, default: false },
  maxLinks: { type: Number, default: 5 },
  actionsClass: { type: [String, Array, Object], default: '' },
  actionsSpace: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const settings = useSettingsStore()
const editorType = computed(() => settings.quickPostEditor || 'tui')

const {
  supported: speechSupported,
  listening: speechListening,
  stop: stopSpeech,
  toggle: toggleSpeech
} = useSpeechRecognition({
  onTranscript(transcript) {
    emit(
      'update:modelValue',
      appendQuickPostSpeech(props.modelValue, editorType.value, transcript)
    )
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

defineExpose({ stopSpeech })
</script>
