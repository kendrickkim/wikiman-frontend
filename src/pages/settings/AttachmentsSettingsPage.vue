<template>
  <div class="q-gutter-md">
    <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>

    <q-form @submit.prevent="saveLimit">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ t('remaining.k105') }}</div>
          <div class="text-grey-7 text-caption q-mt-xs">{{ t('remaining.k106') }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="maxAttachmentMb"
            type="number"
            outlined
            :label="t('remaining.k099')"
            hint="1~200MB"
            :min="1"
            :max="200"
            step="1"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" :label="t('common.save')" :loading="savingLimit" />
        </q-card-actions>
      </q-card>
    </q-form>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">{{ t('remaining.k107') }}</div>
        <div class="text-grey-7 text-caption q-mt-xs">{{ t('extra.attachmentCleanupDescription') }}</div>
      </q-card-section>
      <q-card-section>
        <div v-if="orphanSummary" class="q-mb-md">
          <div class="text-body2">{{ t('remaining.k108') }}<span class="text-weight-medium">{{ orphanSummary.count }}</span>{{ t('remaining.k109') }}<span class="text-weight-medium">{{ formatBytes(orphanSummary.totalBytes) }}</span>
          </div>
          <div v-if="orphanSummary.count" class="text-caption text-grey-7 q-mt-xs">{{ t('remaining.k110') }}</div>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="cleaning_services"
          :label="t('remaining.k100')"
          :loading="cleaningOrphans"
          :disable="cleaningOrphans"
          @click="startOrphanCleanup"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
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
      title: t('remaining.k101'),
      message: t('extra.confirmCleanup', { count: summary.count, size: formatBytes(summary.totalBytes) }),
      persistent: true,
      cancel: { label: t('dialogs.cancel'), flat: true },
      ok: { label: t('dialogs.delete'), color: 'negative', unelevated: true }
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
    $q.notify({ type: 'positive', message: t('remaining.k102') })
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
      $q.notify({ type: 'positive', message: t('remaining.k103') })
      return
    }
    const ok = await confirmOrphanDelete(orphanSummary.value)
    if (!ok) return
    const { data: result } = await api.post('/uploads/orphans/cleanup')
    orphanSummary.value = { count: 0, totalBytes: 0 }
    $q.notify({
      type: 'positive',
      message: t('extra.cleanupResult', { count: result.deletedCount || 0, size: formatBytes(result.deletedBytes) })
    })
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k104'))
  } finally {
    cleaningOrphans.value = false
  }
}
</script>
