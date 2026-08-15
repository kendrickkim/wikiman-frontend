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
        <q-input
          v-model="content"
          type="textarea"
          outlined
          autogrow
          class="wiki-textarea-editor"
          placeholder="내용을 입력하세요."
          input-style="min-height: 160px; line-height: 1.5;"
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
            :disable="!content.trim()"
            @click="save"
          />
        </div>
      </div>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'

const props = defineProps({
  defaultExpanded: { type: Boolean, default: true }
})

const $q = useQuasar()
const expanded = ref(props.defaultExpanded)
const content = ref('')
const saving = ref(false)
const error = ref('')

async function save() {
  const text = content.value.trim()
  if (!text) {
    $q.notify({ type: 'negative', message: '내용을 입력하세요.' })
    return
  }
  saving.value = true
  error.value = ''
  try {
    await api.post('/quick-posts', { content: text })
    content.value = ''
    $q.notify({ type: 'positive', message: '저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err, '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}
</script>
