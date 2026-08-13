<template>
  <q-page class="wiki-page">
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>
    <q-banner v-else-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>
    <div v-else-if="post">
      <div class="row items-start q-mb-md q-col-gutter-sm">
        <div class="col-12 col-sm">
          <div class="text-h5">{{ post.title }}</div>
          <div class="text-grey-7 q-mt-sm text-caption text-sm-body2">
            {{ post.categoryName || '미분류' }} · {{ post.authorName }} · {{ formatDate(post.updatedAt) }}
            <q-badge class="q-ml-sm" :color="post.status === 'draft' ? 'warning' : 'primary'">
              {{ post.status === 'draft' ? '작성중' : '발행' }}
            </q-badge>
            <q-badge v-if="post.status === 'published'" class="q-ml-sm" :color="post.visibility === 'private' ? 'grey' : 'positive'">
              {{ post.visibility === 'private' ? '비공개' : '공개' }}
            </q-badge>
          </div>
        </div>
        <div v-if="canEdit" class="col-12 col-sm-auto row q-gutter-sm">
          <q-btn outline color="primary" icon="edit" :label="$q.screen.gt.xs ? '수정' : undefined" :to="`/posts/${post.id}/edit`" />
          <q-btn flat color="negative" icon="delete" :label="$q.screen.gt.xs ? '삭제' : undefined" @click="removePost" />
        </div>
      </div>
      <q-card flat bordered class="q-pa-md q-pa-lg-md">
        <PostViewer :editor-type="post.editorType" :content="post.content" />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import PostViewer from '@/components/PostViewer.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()
const post = ref(null)
const loading = ref(false)
const error = ref('')
const canEdit = computed(() => auth.canWrite)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/posts/${route.params.id}`)
    post.value = data.post
  } catch (err) {
    error.value = getErrorMessage(err, '글을 찾을 수 없습니다.')
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })

function formatDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

function removePost() {
  $q.dialog({
    title: '글 삭제',
    message: '이 글을 삭제할까요?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/posts/${post.value.id}`)
      $q.notify({ type: 'positive', message: '삭제했습니다.' })
      router.push('/')
    } catch (err) {
      $q.notify({ type: 'negative', message: getErrorMessage(err) })
    }
  })
}
</script>
