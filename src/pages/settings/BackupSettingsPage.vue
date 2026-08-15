<template>
  <div class="q-gutter-md">
    <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>

    <div class="wiki-split">
      <div>
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">{{ t('backup.title') }}</div>
            <div class="text-grey-7 text-caption q-mt-xs">{{ t('extra.backupDescription') }}</div>
          </q-card-section>
          <q-card-section>
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="download"
              :label="t('backup.download')"
              :loading="downloading"
              :disable="downloading || restoring"
              @click="downloadBackup"
            />
          </q-card-section>
        </q-card>
      </div>

      <div>
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">{{ t('backup.restore') }}</div>
            <div class="text-grey-7 text-caption q-mt-xs">{{ t('extra.restoreDescription') }}</div>
          </q-card-section>
          <q-card-section>
            <div v-if="inspectInfo" class="q-mb-md">
              <div class="text-body2">{{ t('extra.backupFormat', { format: inspectInfo.formatVersion, schema: inspectInfo.schemaVersion }) }}</div>
              <div class="text-body2 q-mt-xs">{{ t('extra.backupDetails', { created: formatDate(inspectInfo.createdAt, 19) || '-', files: inspectInfo.fileCount, uploads: inspectInfo.uploadCount, size: formatBytes(inspectInfo.totalBytes) }) }}</div>
              <div class="text-caption text-positive q-mt-xs">{{ t('backup.inspectPassed') }}</div>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-btn
                outline
                no-caps
                color="primary"
                icon="upload_file"
                :label="t('backup.chooseFile')"
                :loading="inspecting"
                :disable="downloading || restoring || inspecting"
                @click="pickBackup"
              />
              <q-btn
                v-if="inspectInfo"
                unelevated
                no-caps
                color="negative"
                icon="restore"
                :label="t('backup.restoreFromBackup')"
                :loading="restoring"
                :disable="downloading || restoring || inspecting || !pendingFile"
                @click="confirmRestore"
              />
            </div>
            <div v-if="pendingName" class="text-caption text-grey-7 q-mt-sm">{{ t('extra.selectedFile', { name: pendingName }) }}</div>
            <input
              ref="inputEl"
              type="file"
              accept=".wkmbak,application/octet-stream"
              style="display: none"
              @change="onPick"
            >
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">{{ t('backup.linkCache') }}</div>
        <div class="text-grey-7 text-caption q-mt-xs">{{ t('extra.linkCacheDescription', { ttl: linkCache.ttlDays, failureTtl: linkCache.failureTtlDays }) }}</div>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="col-12 col-md-6" :class="isDesktop ? 'q-pr-sm' : 'q-mb-md'">
            <q-input
              v-model.number="cacheTtlDays"
              type="number"
              outlined
              class="full-width"
              :label="t('backup.cacheTtl')"
              :hint="t('remaining.k111')"
              :min="1"
              :max="365"
              step="1"
            />
          </div>
          <div class="col-12 col-md-6" :class="isDesktop ? 'q-pl-sm' : ''">
            <q-input
              v-model.number="failureTtlDays"
              type="number"
              outlined
              class="full-width"
              :label="t('backup.failureTtl')"
              :hint="t('remaining.k111')"
              :min="1"
              :max="365"
              step="1"
            />
          </div>
        </div>
        <div class="row justify-end q-mt-md">
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('backup.saveTtl')"
            :loading="savingLinkCacheSettings"
            @click="saveLinkCacheSettings"
          />
        </div>
        <q-separator class="q-my-md" />
        <div class="text-body2 q-mb-md">{{ t('remaining.k116') }}<span class="text-weight-medium">{{ linkCache.count }}</span>{{ t('remaining.k117') }}</div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="delete_sweep"
          :label="t('backup.clearCache')"
          :loading="clearingLinkCache"
          :disable="clearingLinkCache || !linkCache.count"
          @click="clearLinkCache"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { useWikiStore } from '@/stores/wiki'
import { useAuthStore } from '@/stores/auth'
import { formatBytes, formatDate } from '@/utils/format'

const $q = useQuasar()
const { isDesktop } = useLayout()
const settings = useSettingsStore()
const wiki = useWikiStore()
const auth = useAuthStore()

const error = ref('')
const downloading = ref(false)
const inspecting = ref(false)
const restoring = ref(false)
const clearingLinkCache = ref(false)
const savingLinkCacheSettings = ref(false)
const inputEl = ref(null)
const pendingFile = ref(null)
const pendingName = ref('')
const inspectInfo = ref(null)
const linkCache = reactive({
  count: 0,
  ttlDays: 10,
  failureTtlDays: 1
})
const cacheTtlDays = ref(settings.linkPreviewCacheTtlDays)
const failureTtlDays = ref(settings.linkPreviewFailureTtlDays)

async function loadLinkCache() {
  try {
    const { data } = await api.get('/link-preview/cache')
    linkCache.count = Number(data.count) || 0
    linkCache.ttlDays = Number(data.ttlDays) || 10
    linkCache.failureTtlDays = Number(data.failureTtlDays) || 1
  } catch {
    linkCache.count = 0
  }
}

onMounted(async () => {
  await settings.ensureLoaded()
  cacheTtlDays.value = settings.linkPreviewCacheTtlDays
  failureTtlDays.value = settings.linkPreviewFailureTtlDays
  await loadLinkCache()
})

async function saveLinkCacheSettings() {
  savingLinkCacheSettings.value = true
  error.value = ''
  try {
    await settings.save({
      linkPreviewCacheTtlDays: cacheTtlDays.value,
      linkPreviewFailureTtlDays: failureTtlDays.value
    })
    cacheTtlDays.value = settings.linkPreviewCacheTtlDays
    failureTtlDays.value = settings.linkPreviewFailureTtlDays
    linkCache.ttlDays = settings.linkPreviewCacheTtlDays
    linkCache.failureTtlDays = settings.linkPreviewFailureTtlDays
    $q.notify({ type: 'positive', message: t('remaining.k112') })
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k113'))
  } finally {
    savingLinkCacheSettings.value = false
  }
}

async function clearLinkCache() {
  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: t('backup.clearCacheTitle'),
      message: t('backup.clearCacheMessage', { count: linkCache.count }),
      persistent: true,
      cancel: { label: t('dialogs.cancel'), flat: true },
      ok: { label: t('dialogs.delete'), color: 'negative', unelevated: true }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false))
  })
  if (!ok) return

  clearingLinkCache.value = true
  error.value = ''
  try {
    const { data } = await api.delete('/link-preview/cache')
    linkCache.count = 0
    linkCache.ttlDays = Number(data.ttlDays) || linkCache.ttlDays
    linkCache.failureTtlDays = Number(data.failureTtlDays) || linkCache.failureTtlDays
    $q.notify({
      type: 'positive',
      message: data.deleted ? t('backup.cacheDeleted', { count: data.deleted }) : t('backup.cacheEmpty')
    })
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k114'))
  } finally {
    clearingLinkCache.value = false
  }
}

function filenameFromDisposition(header, fallback) {
  const raw = String(header || '')
  const utf = raw.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1])
    } catch {
      // keep falling through
    }
  }
  const plain = raw.match(/filename="?([^";]+)"?/i)
  return plain?.[1] || fallback
}

async function downloadBackup() {
  downloading.value = true
  error.value = ''
  try {
    const { data, headers } = await api.get('/backup/download', {
      responseType: 'blob',
      timeout: 300000
    })
    const name = filenameFromDisposition(headers['content-disposition'], 'wikiman-backup.wkmbak')
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    $q.notify({ type: 'positive', message: t('backup.downloaded') })
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      try {
        const text = JSON.parse(await err.response.data.text())
        error.value = text.error || t('backup.failed')
      } catch {
        error.value = getErrorMessage(err, t('backup.failed'))
      }
    } else {
      error.value = getErrorMessage(err, t('backup.failed'))
    }
  } finally {
    downloading.value = false
  }
}

function pickBackup() {
  inputEl.value?.click()
}

async function onPick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  pendingFile.value = null
  pendingName.value = ''
  inspectInfo.value = null
  if (!file) return
  if (!String(file.name).toLowerCase().endsWith('.wkmbak')) {
    error.value = t('backup.invalidExtension')
    return
  }
  pendingFile.value = file
  pendingName.value = file.name
  inspecting.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('backup', file)
    const { data } = await api.post('/backup/inspect', form, { timeout: 300000 })
    inspectInfo.value = data
  } catch (err) {
    pendingFile.value = null
    pendingName.value = ''
    error.value = getErrorMessage(err, t('backup.inspectFailed'))
  } finally {
    inspecting.value = false
  }
}

function confirmRestore() {
  if (!pendingFile.value || !inspectInfo.value) return
  $q.dialog({
    title: t('backup.restoreTitle'),
    message: t('backup.restoreMessage', { version: inspectInfo.value.formatVersion }),
    persistent: true,
    cancel: { label: t('dialogs.cancel'), flat: true },
    ok: { label: t('backup.restore'), color: 'negative', unelevated: true }
  }).onOk(() => {
    restoreBackup()
  })
}

async function restoreBackup() {
  if (!pendingFile.value) return
  restoring.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('backup', pendingFile.value)
    const { data } = await api.post('/backup/restore', form, { timeout: 600000 })
    if (data.settings) settings.assign(data.settings)
    await Promise.all([
      auth.ensureLoaded({ force: true }),
      wiki.ensureLoaded({ force: true }),
      settings.load({ force: true })
    ])
    inspectInfo.value = null
    pendingFile.value = null
    pendingName.value = ''
    $q.notify({ type: 'positive', message: t('backup.restored') })
    window.setTimeout(() => window.location.reload(), 600)
  } catch (err) {
    error.value = getErrorMessage(err, t('backup.restoreFailed'))
  } finally {
    restoring.value = false
  }
}
</script>

<style scoped>
.wiki-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 1024px) {
  .wiki-split {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
