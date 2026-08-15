<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <div class="q-mb-md">
        <div :class="isDesktop ? 'text-h4 text-weight-bold' : 'text-h6'">{{ t('settings.quickPosts') }}</div>
        <div class="text-grey-7 q-mt-xs">{{ t('remaining.k091') }}</div>
      </div>
      <q-btn
        class="full-width q-mb-md"
        unelevated
        color="primary"
        no-caps
        icon="add"
        :label="t('remaining.k086')"
        to="/quick-posts/new"
      />

      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-card v-if="!items.length && !loading" flat bordered class="q-pa-lg text-center text-grey-7">{{ t('remaining.k092') }}</q-card>

      <div v-else class="q-gutter-md">
        <q-card v-for="item in items" :key="item.id" flat bordered class="q-pa-md">
          <QuickPostBody :content="item.content" :max-links="3" />
          <div class="text-caption text-grey-7 q-mt-sm">{{ formatDate(item.updatedAt) }}</div>
          <div class="row q-gutter-xs q-mt-sm">
            <q-btn flat dense no-caps color="primary" :label="t('common.edit')" :to="`/quick-posts/${item.id}/edit`" />
            <q-btn flat dense no-caps color="primary" :label="t('remaining.k054')" :loading="promotingId === item.id" @click="openPromote(item)" />
            <q-btn flat dense no-caps color="negative" :label="t('dialogs.delete')" :loading="deletingId === item.id" @click="remove(item)" />
          </div>
        </q-card>
      </div>

      <QuickPostPromoteDialog
        v-model="promoteDialog"
        :loading="promotingId !== null"
        @confirm="promote"
      />
    </div>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { formatDate } from '@/utils/format'
import QuickPostBody from '@/components/QuickPostBody.vue'
import QuickPostPromoteDialog from '@/components/QuickPostPromoteDialog.vue'

const router = useRouter()
const $q = useQuasar()
const { isDesktop } = useLayout()

const items = ref([])
const loading = ref(false)
const error = ref('')
const deletingId = ref(null)
const promotingId = ref(null)
const promoteDialog = ref(false)
const promoteTarget = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/quick-posts')
    items.value = Array.isArray(data.quickPosts) ? data.quickPosts : []
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k083'))
  } finally {
    loading.value = false
  }
}

async function remove(item) {
  $q.dialog({
    title: t('remaining.k087'),
    message: t('remaining.k088'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    deletingId.value = item.id
    try {
      await api.delete(`/quick-posts/${item.id}`)
      items.value = items.value.filter((row) => row.id !== item.id)
      $q.notify({ type: 'positive', message: t('remaining.k089') })
    } catch (err) {
      error.value = getErrorMessage(err, t('remaining.k090'))
    } finally {
      deletingId.value = null
    }
  })
}

function openPromote(item) {
  promoteTarget.value = item
  promoteDialog.value = true
}

async function promote({ editorType, keepSource }) {
  const item = promoteTarget.value
  if (!item) return
  promotingId.value = item.id
  error.value = ''
  try {
    const { data } = await api.post(`/quick-posts/${item.id}/promote`, { editorType, keepSource })
    if (!data.sourceKept) {
      items.value = items.value.filter((row) => row.id !== item.id)
    }
    promoteDialog.value = false
    promoteTarget.value = null
    $q.notify({ type: 'positive', message: t('remaining.k084') })
    await router.push(`/posts/${data.post.id}/edit`)
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k085'))
  } finally {
    promotingId.value = null
  }
}

onMounted(load)
</script>
