<template>
  <q-card flat bordered class="wiki-quick-composer q-mb-md">
    <q-expansion-item
      v-model="expanded"
      dense
      expand-separator
      icon="edit_note"
      label="간단 입력"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md">
        <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>
        <QuickPostBodyEditor
          :key="editorKey"
          v-model="content"
          compact
          :editor-key="editorKey"
        />
        <PostLinkPreviews :content="content" :max-links="5" extra-class="q-mt-md" />

        <div class="row q-gutter-sm q-mt-md items-center">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            label="목록"
            to="/quick-posts"
          />
          <q-space />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="저장하고 계속"
            :loading="saving"
            :disable="!canSave"
            @click="save"
          />
        </div>
      </div>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { emptyQuickPostContent, hasQuickPostContent } from '@/utils/quickPostContent'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import QuickPostBodyEditor from '@/components/QuickPostBodyEditor.vue'

const props = defineProps({
  defaultExpanded: { type: Boolean, default: true }
})

const $q = useQuasar()
const settings = useSettingsStore()
const expanded = ref(props.defaultExpanded)
const content = ref('')
const editorKey = ref(0)
const saving = ref(false)
const error = ref('')
const editorType = computed(() => settings.quickPostEditor || 'textarea')
const canSave = computed(() => hasQuickPostContent(content.value, editorType.value))

function resetContent() {
  content.value = emptyQuickPostContent(editorType.value)
  editorKey.value += 1
}

onMounted(async () => {
  await settings.ensureLoaded()
  resetContent()
})

async function save() {
  if (!canSave.value) {
    $q.notify({ type: 'negative', message: '내용을 입력하세요.' })
    return
  }
  saving.value = true
  error.value = ''
  try {
    await api.post('/quick-posts', { content: content.value })
    resetContent()
    $q.notify({ type: 'positive', message: '저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err, '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}
</script>
