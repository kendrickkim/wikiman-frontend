<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <q-card flat bordered :class="isDesktop ? 'q-pa-lg' : 'q-pa-md'">
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1 text-weight-medium col">
            {{ isEdit ? t('remaining.k082') : t('remaining.k049') }}
          </div>
          <q-btn
            v-if="isEdit"
            flat
            dense
            no-caps
            color="primary"
            :label="t('remaining.k050')"
            to="/quick-posts"
          />
        </div>

        <QuickPostFormFields
          ref="formRef"
          v-model="content"
          :error="error"
          :editor-key="editorKey"
          :actions-class="isDesktop ? 'justify-end' : ''"
          :actions-space="!isDesktop"
        >
          <template #actions-end>
            <q-btn
              v-if="isEdit"
              outline
              no-caps
              color="primary"
              :label="t('remaining.k054')"
              :loading="promoting"
              :disable="saving || !canSave"
              @click="promoteDialog = true"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="isEdit ? t('common.save') : t('remaining.k051')"
              :loading="saving"
              :disable="promoting || !canSave"
              @click="save"
            />
          </template>
        </QuickPostFormFields>
      </q-card>

      <QuickPostPromoteDialog
        v-model="promoteDialog"
        :loading="promoting"
        @confirm="promote"
      />
    </div>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import {
  emptyQuickPostContent,
  hasQuickPostContent
} from '@/utils/quickPostContent'
import QuickPostFormFields from '@/components/QuickPostFormFields.vue'
import QuickPostPromoteDialog from '@/components/QuickPostPromoteDialog.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { isDesktop } = useLayout()
const settings = useSettingsStore()

const formRef = ref(null)
const content = ref('')
const editorKey = ref(0)
const saving = ref(false)
const promoting = ref(false)
const promoteDialog = ref(false)
const error = ref('')
const isEdit = computed(() => Boolean(route.params.id))
const editorType = computed(() => settings.quickPostEditor || 'tui')
const canSave = computed(() => hasQuickPostContent(content.value, editorType.value))

function resetContent() {
  content.value = emptyQuickPostContent(editorType.value)
  editorKey.value += 1
}

async function load() {
  await settings.ensureLoaded()
  if (!isEdit.value) {
    resetContent()
    error.value = ''
    return
  }
  error.value = ''
  try {
    const { data } = await api.get(`/quick-posts/${route.params.id}`)
    content.value = data.quickPost?.content || emptyQuickPostContent(editorType.value)
    editorKey.value += 1
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k083'))
  }
}

async function save() {
  if (!canSave.value) {
    $q.notify({ type: 'negative', message: t('remaining.k048') })
    return
  }
  formRef.value?.stopSpeech()
  saving.value = true
  error.value = ''
  try {
    if (isEdit.value) {
      await api.patch(`/quick-posts/${route.params.id}`, { content: content.value })
      $q.notify({ type: 'positive', message: t('remaining.k052') })
    } else {
      await api.post('/quick-posts', { content: content.value })
      resetContent()
      $q.notify({ type: 'positive', message: t('remaining.k052') })
    }
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k053'))
  } finally {
    saving.value = false
  }
}

async function promote({ editorType: promoteEditorType, keepSource }) {
  if (!isEdit.value) return
  formRef.value?.stopSpeech()
  promoting.value = true
  error.value = ''
  try {
    if (canSave.value) {
      await api.patch(`/quick-posts/${route.params.id}`, { content: content.value })
    }
    const { data } = await api.post(`/quick-posts/${route.params.id}/promote`, {
      editorType: promoteEditorType,
      keepSource
    })
    promoteDialog.value = false
    $q.notify({ type: 'positive', message: t('remaining.k084') })
    await router.replace(`/posts/${data.post.id}/edit`)
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k085'))
  } finally {
    promoting.value = false
  }
}

watch(() => route.fullPath, () => {
  load()
})

onMounted(load)
</script>
