<template>
  <div class="q-gutter-md">
    <q-banner v-if="!androidApp" class="bg-orange-1 text-warning">
      {{ t('settings.updateAndroidOnly') }}
    </q-banner>

    <q-card v-else flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">{{ t('settings.update') }}</div>
        <div class="text-grey-7 text-caption q-mt-xs">{{ t('settings.updateDescription') }}</div>
      </q-card-section>
      <q-card-section class="q-gutter-sm">
        <div>{{ t('settings.updateCurrent') }}: {{ currentVersion || t('settings.updateChecking') }}</div>
        <div>{{ t('settings.updateLatest') }}: {{ latestVersion || t('settings.updateChecking') }}</div>
        <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>
        <q-banner v-else-if="upToDate" class="bg-green-1 text-positive">
          {{ t('settings.updateLatestInstalled') }}
        </q-banner>
        <q-btn
          v-if="newer"
          unelevated
          no-caps
          color="primary"
          icon="system_update"
          :label="t('settings.updateNow')"
          :loading="starting || updating"
          :disable="updating"
          @click="start"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from '@/i18n'
import {
  isWikimanNativeAndroid,
  notifyWikimanNativeApp,
  onWikimanNativeEvent
} from '@/utils/nativeApp'

const { t } = useI18n()
const androidApp = isWikimanNativeAndroid()
const currentVersion = ref('')
const latestVersion = ref('')
const newer = ref(false)
const upToDate = ref(false)
const error = ref('')
const starting = ref(false)
const updating = ref(false)
const autoStarted = ref(false)
let offNative = () => {}

function start() {
  if (!androidApp || updating.value) return
  error.value = ''
  starting.value = true
  notifyWikimanNativeApp('update:start')
}

function onNative(detail) {
  const type = detail?.type
  if (type === 'update:info') {
    currentVersion.value = detail.currentVersion || ''
    latestVersion.value = detail.latestVersion || ''
    newer.value = detail.newer === true
    upToDate.value = detail.supported === true && detail.newer !== true
    updating.value = detail.updating === true
    starting.value = false
    error.value = ''
    if (newer.value && !autoStarted.value && !updating.value) {
      autoStarted.value = true
      start()
    }
    return
  }
  if (type === 'update:progress') {
    updating.value = detail.status === 'downloading' || detail.status === 'installing'
    starting.value = updating.value
    if (detail.status === 'cancelled') {
      updating.value = false
      starting.value = false
    }
    return
  }
  if (type === 'update:error') {
    error.value = detail.message || t('settings.updateFailed')
    updating.value = false
    starting.value = false
  }
}

onMounted(() => {
  if (!androidApp) return
  offNative = onWikimanNativeEvent(onNative)
  notifyWikimanNativeApp('update:check')
})

onBeforeUnmount(() => {
  offNative()
})
</script>
