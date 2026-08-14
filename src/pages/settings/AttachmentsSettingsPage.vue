<template>
  <div class="q-gutter-md">
    <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>

    <q-form @submit.prevent="saveLimit">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">용량 제한</div>
          <div class="text-grey-7 text-caption q-mt-xs">글 첨부·본문 이미지 업로드에 적용됩니다.</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="maxAttachmentMb"
            type="number"
            outlined
            label="첨부 파일 최대 용량 (MB)"
            hint="1~200MB"
            :min="1"
            :max="200"
            step="1"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" label="저장" :loading="savingLimit" />
        </q-card-actions>
      </q-card>
    </q-form>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">미연결 파일 정리</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          업로드 폴더에서 글(첨부·본문 이미지)이나 파비콘에 연결되지 않은 파일을 찾아 삭제합니다.
          작성 중 올렸지만 저장하지 않은 파일도 포함됩니다.
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="orphanSummary" class="q-mb-md">
          <div class="text-body2">
            연결되지 않은 파일
            <span class="text-weight-medium">{{ orphanSummary.count }}</span>개 ·
            <span class="text-weight-medium">{{ formatBytes(orphanSummary.totalBytes) }}</span>
          </div>
          <div v-if="orphanSummary.count" class="text-caption text-grey-7 q-mt-xs">
            휴지통 글에 연결된 파일은 복원을 위해 남겨 둡니다.
          </div>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="cleaning_services"
          label="정리 시작"
          :loading="cleaningOrphans"
          :disable="cleaningOrphans"
          @click="startOrphanCleanup"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { formatBytes } from '@/utils/format'

const $q = useQuasar()
const settings = useSettingsStore()
const error = ref('')
const savingLimit = ref(false)
const cleaningOrphans = ref(false)
const orphanSummary = ref(null)
const maxAttachmentMb = ref(settings.maxAttachmentMb)

onMounted(async () => {
  await settings.ensureLoaded()
  maxAttachmentMb.value = settings.maxAttachmentMb
})

function confirmOrphanDelete(summary) {
  return new Promise((resolve) => {
    $q.dialog({
      title: '연결되지 않은 파일 삭제',
      message: `연결되지 않은 파일 ${summary.count}개(${formatBytes(summary.totalBytes)})를 삭제할까요? 삭제하면 되돌릴 수 없습니다.`,
      persistent: true,
      cancel: { label: '취소', flat: true },
      ok: { label: '삭제', color: 'negative', unelevated: true }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false))
  })
}

async function saveLimit() {
  savingLimit.value = true
  error.value = ''
  try {
    await settings.save({ maxAttachmentMb: maxAttachmentMb.value })
    maxAttachmentMb.value = settings.maxAttachmentMb
    $q.notify({ type: 'positive', message: '용량 제한을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    savingLimit.value = false
  }
}

async function startOrphanCleanup() {
  cleaningOrphans.value = true
  error.value = ''
  orphanSummary.value = null
  try {
    const { data } = await api.get('/uploads/orphans')
    orphanSummary.value = {
      count: Number(data.count) || 0,
      totalBytes: Number(data.totalBytes) || 0
    }
    if (!orphanSummary.value.count) {
      $q.notify({ type: 'positive', message: '정리할 파일이 없습니다.' })
      return
    }
    const ok = await confirmOrphanDelete(orphanSummary.value)
    if (!ok) return
    const { data: result } = await api.post('/uploads/orphans/cleanup')
    orphanSummary.value = { count: 0, totalBytes: 0 }
    $q.notify({
      type: 'positive',
      message: `파일 ${result.deletedCount || 0}개(${formatBytes(result.deletedBytes)})를 삭제했습니다.`
    })
  } catch (err) {
    error.value = getErrorMessage(err, '첨부파일 정리에 실패했습니다.')
  } finally {
    cleaningOrphans.value = false
  }
}
</script>
