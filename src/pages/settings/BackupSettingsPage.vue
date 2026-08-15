<template>
  <div class="q-gutter-md">
    <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">백업</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          데이터베이스와 첨부파일을 <code>.wkmbak</code> 파일로 묶어 내려받습니다.
          파일 앞머리에 Wikiman 식별 헤더와 형식 버전이 들어 있습니다.
        </div>
      </q-card-section>
      <q-card-section>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="download"
          label="백업 다운로드"
          :loading="downloading"
          :disable="downloading || restoring"
          @click="downloadBackup"
        />
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">복구</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          백업 파일을 올리면 헤더·버전·DB 구조를 확인한 뒤, 현재 데이터를 전부 덮어씁니다.
          복구하면 되돌릴 수 없습니다.
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="inspectInfo" class="q-mb-md">
          <div class="text-body2">형식 버전 {{ inspectInfo.formatVersion }} · 스키마 {{ inspectInfo.schemaVersion }}</div>
          <div class="text-body2 q-mt-xs">
            생성 {{ formatDate(inspectInfo.createdAt, 19) || '-' }} ·
            파일 {{ inspectInfo.fileCount }}개 ·
            첨부 {{ inspectInfo.uploadCount }}개 ·
            {{ formatBytes(inspectInfo.totalBytes) }}
          </div>
          <div class="text-caption text-positive q-mt-xs">구조 검사를 통과했습니다.</div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-btn
            outline
            no-caps
            color="primary"
            icon="upload_file"
            label="백업 파일 선택"
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
            label="이 백업으로 복구"
            :loading="restoring"
            :disable="downloading || restoring || inspecting || !pendingFile"
            @click="confirmRestore"
          />
        </div>
        <div v-if="pendingName" class="text-caption text-grey-7 q-mt-sm">선택: {{ pendingName }}</div>
        <input
          ref="inputEl"
          type="file"
          accept=".wkmbak,application/octet-stream"
          style="display: none"
          @change="onPick"
        >
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">링크 미리보기 캐시</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          외부 링크의 제목·설명·이미지 메타 정보를 약 {{ linkCache.ttlDays }}일간 저장합니다.
          만료 후 다시 가져오지 못하면 기존 정보를 유지하고 {{ linkCache.failureTtlDays }}일 연장합니다.
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="col-12 col-md-6" :class="isDesktop ? 'q-pr-sm' : 'q-mb-md'">
            <q-input
              v-model.number="cacheTtlDays"
              type="number"
              outlined
              class="full-width"
              label="기본 TTL (일)"
              hint="1~365일"
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
              label="조회 실패 시 연장 TTL (일)"
              hint="1~365일"
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
            label="TTL 설정 저장"
            :loading="savingLinkCacheSettings"
            @click="saveLinkCacheSettings"
          />
        </div>
        <q-separator class="q-my-md" />
        <div class="text-body2 q-mb-md">
          캐시된 주소
          <span class="text-weight-medium">{{ linkCache.count }}</span>개
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="delete_sweep"
          label="캐시 삭제"
          :loading="clearingLinkCache"
          :disable="clearingLinkCache || !linkCache.count"
          @click="clearLinkCache"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
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
    $q.notify({ type: 'positive', message: '링크 캐시 TTL 설정을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err, 'TTL 설정을 저장하지 못했습니다.')
  } finally {
    savingLinkCacheSettings.value = false
  }
}

async function clearLinkCache() {
  const ok = await new Promise((resolve) => {
    $q.dialog({
      title: '링크 미리보기 캐시 삭제',
      message: `캐시된 주소 ${linkCache.count}개를 삭제할까요? 다음 미리보기 때 다시 가져옵니다.`,
      persistent: true,
      cancel: { label: '취소', flat: true },
      ok: { label: '삭제', color: 'negative', unelevated: true }
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
      message: data.deleted ? `캐시 ${data.deleted}개를 삭제했습니다.` : '삭제할 캐시가 없습니다.'
    })
  } catch (err) {
    error.value = getErrorMessage(err, '캐시를 삭제하지 못했습니다.')
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
    $q.notify({ type: 'positive', message: '백업 파일을 내려받았습니다.' })
  } catch (err) {
    if (err?.response?.data instanceof Blob) {
      try {
        const text = JSON.parse(await err.response.data.text())
        error.value = text.error || '백업에 실패했습니다.'
      } catch {
        error.value = getErrorMessage(err, '백업에 실패했습니다.')
      }
    } else {
      error.value = getErrorMessage(err, '백업에 실패했습니다.')
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
    error.value = '확장자가 .wkmbak 인 백업 파일만 선택할 수 있습니다.'
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
    error.value = getErrorMessage(err, '백업 파일을 확인할 수 없습니다.')
  } finally {
    inspecting.value = false
  }
}

function confirmRestore() {
  if (!pendingFile.value || !inspectInfo.value) return
  $q.dialog({
    title: '전체 데이터 복구',
    message: `형식 버전 ${inspectInfo.value.formatVersion} 백업으로 현재 사이트 데이터를 모두 덮어쓸까요? 이 작업은 되돌릴 수 없습니다.`,
    persistent: true,
    cancel: { label: '취소', flat: true },
    ok: { label: '복구', color: 'negative', unelevated: true }
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
    $q.notify({ type: 'positive', message: '백업으로 복구했습니다.' })
    window.setTimeout(() => window.location.reload(), 600)
  } catch (err) {
    error.value = getErrorMessage(err, '복구에 실패했습니다.')
  } finally {
    restoring.value = false
  }
}
</script>
