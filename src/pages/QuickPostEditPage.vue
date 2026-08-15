<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-card flat bordered :class="isDesktop ? 'q-pa-lg' : 'q-pa-md'">
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1 text-weight-medium col">
            {{ isEdit ? '간단 포스트 수정' : '간단 입력' }}
          </div>
          <q-btn
            v-if="isEdit"
            flat
            dense
            no-caps
            color="primary"
            label="목록"
            to="/quick-posts"
          />
        </div>

        <q-input
          v-model="content"
          type="textarea"
          outlined
          autogrow
          class="wiki-textarea-editor"
          placeholder="내용을 입력하세요."
          input-style="min-height: 280px; line-height: 1.5;"
        />

        <div v-if="linkUrls.length" class="wiki-link-cards q-mt-md">
          <LinkPreviewCard v-for="url in linkUrls" :key="url" :url="url" />
        </div>

        <div class="row q-gutter-sm q-mt-md" :class="isDesktop ? 'justify-end' : ''">
          <q-btn
            v-if="isEdit"
            outline
            no-caps
            color="primary"
            label="포스트로 이동"
            :loading="promoting"
            :disable="saving || !content.trim()"
            @click="promote"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="isEdit ? '저장' : '저장하고 계속'"
            :loading="saving"
            :disable="promoting || !content.trim()"
            @click="save"
          />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { extractUrls } from '@/utils/urls'
import LinkPreviewCard from '@/components/LinkPreviewCard.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { isDesktop } = useLayout()

const content = ref('')
const saving = ref(false)
const promoting = ref(false)
const error = ref('')
const isEdit = computed(() => Boolean(route.params.id))
const linkUrls = computed(() => extractUrls(content.value, { limit: 5 }))

async function load() {
  if (!isEdit.value) {
    content.value = ''
    error.value = ''
    return
  }
  error.value = ''
  try {
    const { data } = await api.get(`/quick-posts/${route.params.id}`)
    content.value = data.quickPost?.content || ''
  } catch (err) {
    error.value = getErrorMessage(err, '간단 포스트를 불러오지 못했습니다.')
  }
}

async function save() {
  const text = content.value.trim()
  if (!text) {
    $q.notify({ type: 'negative', message: '내용을 입력하세요.' })
    return
  }
  saving.value = true
  error.value = ''
  try {
    if (isEdit.value) {
      await api.patch(`/quick-posts/${route.params.id}`, { content: text })
      $q.notify({ type: 'positive', message: '저장했습니다.' })
    } else {
      await api.post('/quick-posts', { content: text })
      content.value = ''
      $q.notify({ type: 'positive', message: '저장했습니다.' })
    }
  } catch (err) {
    error.value = getErrorMessage(err, '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

async function promote() {
  if (!isEdit.value) return
  promoting.value = true
  error.value = ''
  try {
    if (content.value.trim()) {
      await api.patch(`/quick-posts/${route.params.id}`, { content: content.value.trim() })
    }
    const { data } = await api.post(`/quick-posts/${route.params.id}/promote`)
    $q.notify({ type: 'positive', message: '일반 포스트 초안으로 옮겼습니다.' })
    await router.replace(`/posts/${data.post.id}/edit`)
  } catch (err) {
    error.value = getErrorMessage(err, '포스트로 옮기지 못했습니다.')
  } finally {
    promoting.value = false
  }
}

watch(() => route.fullPath, () => {
  load()
})

onMounted(load)
</script>
