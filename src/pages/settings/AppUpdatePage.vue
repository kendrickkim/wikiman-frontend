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
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn
            outline
            no-caps
            color="primary"
            icon="refresh"
            :label="t('settings.updateRefresh')"
            :loading="checking"
            :disable="updating || starting"
            @click="refresh"
          />
          <q-btn
            v-if="newer"
            unelevated
            no-caps
            color="primary"
            icon="system_update"
            :label="t('settings.updateNow')"
            :loading="starting || updating"
            :disable="checking || updating"
            @click="confirmStart"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from '@/i18n'
import {
  isWikimanNativeAndroid,
  notifyWikimanNativeApp,
  onWikimanNativeEvent
} from '@/utils/nativeApp'

const { t } = useI18n()
const $q = useQuasar()
const androidApp = isWikimanNativeAndroid()
const currentVersion = ref('')
const latestVersion = ref('')
const newer = ref(false)
const upToDate = ref(false)
const error = ref('')
const checking = ref(false)
const starting = ref(false)
const updating = ref(false)
let offNative = () => {}

function refresh() {
  if (!androidApp || updating.value || starting.value) return
  error.value = ''
  checking.value = true
  notifyWikimanNativeApp('update:check')
}

function confirmStart() {
  if (!androidApp || updating.value || checking.value || starting.value) return
  $q.dialog({
    title: t('settings.update'),
    message: t('settings.updateConfirm'),
    persistent: true,
    cancel: { label: t('common.cancel'), flat: true },
    ok: { label: t('settings.updateNow'), color: 'primary', unelevated: true }
  }).onOk(() => {
    start()
  })
}

function start() {
  if (!androidApp || updating.value || checking.value) return
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
    checking.value = false
    starting.value = false
    error.value = ''
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
    checking.value = false
  }
}

onMounted(() => {
  if (!androidApp) return
  offNative = onWikimanNativeEvent(onNative)
  refresh()
})

onBeforeUnmount(() => {
  offNative()
})
</script>
