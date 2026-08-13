<template>
  <q-page class="wiki-page">
    <div class="row items-center q-mb-md no-wrap">
      <div class="text-h6 text-weight-medium col">{{ heading }}</div>
      <q-btn
        v-if="auth.canWrite && $q.screen.gt.sm"
        class="q-ml-sm"
        unelevated
        color="primary"
        icon="edit"
        label="새 글"
        no-caps
        to="/posts/new"
      />
    </div>

    <q-btn-toggle
      v-if="auth.canWrite"
      v-model="statusFilter"
      class="q-mb-md"
      unelevated
      no-caps
      spread
      toggle-color="primary"
      :options="statusFilterOptions"
    />

    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-card v-if="!posts.length && !loading" flat bordered class="q-pa-lg text-center text-grey-7">
      표시할 글이 없습니다.
    </q-card>

    <q-list v-else separator bordered class="rounded-borders bg-white">
      <q-item v-for="post in posts" :key="post.id" clickable :to="`/posts/${post.id}`" class="q-py-md">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-weight-medium">{{ post.title }}</q-item-label>
          <q-item-label caption class="ellipsis-2-lines">
            {{ post.categoryName || '미분류' }} · {{ post.authorName }} · {{ formatDate(post.updatedAt) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side top>
          <div class="column items-end q-gutter-xs">
            <q-badge :color="post.status === 'draft' ? 'warning' : 'primary'">
              {{ post.status === 'draft' ? '작성중' : '발행' }}
            </q-badge>
            <q-badge v-if="post.status === 'published'" :color="post.visibility === 'private' ? 'grey' : 'positive'">
              {{ post.visibility === 'private' ? '비공개' : '공개' }}
            </q-badge>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'

const route = useRoute()
const $q = useQuasar()
const auth = useAuthStore()
const wiki = useWikiStore()
const posts = ref([])
const loading = ref(false)
const error = ref('')
const statusFilter = ref('all')
const statusFilterOptions = [
  { label: '전체', value: 'all' },
  { label: '발행', value: 'published' },
  { label: '작성중', value: 'draft' }
]

const heading = computed(() => {
  if (route.query.q) return `"${route.query.q}" 검색 결과`
  if (route.query.categoryId === 'uncategorized') return '미분류'
  const id = Number(route.query.categoryId)
  const category = wiki.categories.find((c) => c.id === id)
  return category ? category.name : '전체 글'
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = {}
    if (route.query.categoryId) params.categoryId = route.query.categoryId
    if (route.query.q) params.q = route.query.q
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    const { data } = await api.get('/posts', { params })
    posts.value = data.posts
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

watch(() => [route.query.categoryId, route.query.q, auth.user, statusFilter.value], load, { immediate: true })

function formatDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}
</script>
