<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ t('settings.quickPosts') }}</div>
          <div class="text-grey-7 text-caption q-mt-xs">{{ t('remaining.k128') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-lg">
          <div>
            <q-toggle
              v-model="mobileQuickPostEnabled"
              :label="t('remaining.k125')"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('remaining.k129') }}</div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('remaining.k130') }}</div>
            <q-select
              v-model="quickPostEditor"
              outlined
              dense
              emit-value
              map-options
              :options="EDITOR_OPTIONS"
              style="max-width: 360px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('remaining.k131') }}</div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('remaining.k132') }}</div>
            <q-select
              v-model="promoteEditor"
              outlined
              dense
              emit-value
              map-options
              :options="promoteEditorOptions"
              style="max-width: 360px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('remaining.k133') }}</div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('remaining.k134') }}</div>
            <q-select
              v-model="promoteSourceMode"
              outlined
              dense
              emit-value
              map-options
              :options="promoteSourceOptions"
              style="max-width: 360px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('remaining.k135') }}</div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" :label="t('settings.saveSettings')" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { EDITOR_OPTIONS } from '@/utils/editors'

const $q = useQuasar()
const settings = useSettingsStore()
const mobileQuickPostEnabled = ref(settings.mobileQuickPostEnabled)
const quickPostEditor = ref(settings.quickPostEditor)
const promoteEditor = ref(settings.quickPostPromoteEditor)
const promoteSourceMode = ref(settings.quickPostPromoteSourceMode)
const saving = ref(false)
const error = ref('')
const promoteEditorOptions = [
  { label: t('remaining.k126'), value: 'ask' },
  ...EDITOR_OPTIONS
]
const promoteSourceOptions = [
  { label: t('remaining.k126'), value: 'ask' },
  { label: t('remaining.k057'), value: 'delete' },
  { label: t('remaining.k058'), value: 'keep' }
]

onMounted(async () => {
  await settings.ensureLoaded()
  mobileQuickPostEnabled.value = settings.mobileQuickPostEnabled
  quickPostEditor.value = settings.quickPostEditor
  promoteEditor.value = settings.quickPostPromoteEditor
  promoteSourceMode.value = settings.quickPostPromoteSourceMode
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await settings.save({
      mobileQuickPostEnabled: mobileQuickPostEnabled.value,
      quickPostEditor: quickPostEditor.value,
      quickPostPromoteEditor: promoteEditor.value,
      quickPostPromoteSourceMode: promoteSourceMode.value
    })
    mobileQuickPostEnabled.value = settings.mobileQuickPostEnabled
    quickPostEditor.value = settings.quickPostEditor
    promoteEditor.value = settings.quickPostPromoteEditor
    promoteSourceMode.value = settings.quickPostPromoteSourceMode
    $q.notify({ type: 'positive', message: t('remaining.k127') })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>
