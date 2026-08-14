<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">휴지통</div>
      <div class="text-grey-7 q-mb-md">삭제된 글은 여기에 보관됩니다. 복원하거나 완전히 삭제할 수 있습니다.</div>

      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-card v-if="!posts.length && !loading" flat bordered class="q-pa-lg text-center text-grey-7">
        휴지통이 비어 있습니다.
      </q-card>

      <div v-else-if="isDesktop" class="wiki-article-card">
        <div v-for="post in posts" :key="post.id" class="wiki-post-row">
          <div class="wiki-post-row__main">
            <div class="wiki-post-row__title">{{ displayTitle(post.title) }}</div>
            <div class="wiki-post-row__meta">
              {{ post.categoryName || '미분류' }} · {{ formatDate(post.deletedAt) }}에 삭제
            </div>
            <KeywordChips :keywords="post.keywords" />
          </div>
          <div v-if="auth.canWrite" class="wiki-post-row__aside">
            <div class="row q-gutter-xs no-wrap">
              <q-btn outline color="primary" no-caps label="복원" @click="onRestore(post)" />
              <q-btn unelevated color="negative" no-caps label="완전 삭제" @click="onPurge(post)" />
            </div>
          </div>
        </div>
      </div>

      <q-list v-else separator bordered class="rounded-borders wiki-article-card">
        <q-item v-for="post in posts" :key="post.id" class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-medium wiki-post-row__title">{{ displayTitle(post.title) }}</q-item-label>
            <q-item-label caption>
              {{ post.categoryName || '미분류' }} · {{ formatDate(post.deletedAt) }}에 삭제
            </q-item-label>
            <KeywordChips :keywords="post.keywords" />
          </q-item-section>
          <q-item-section v-if="auth.canWrite" side>
            <div class="column q-gutter-xs">
              <q-btn outline color="primary" no-caps size="sm" label="복원" @click="onRestore(post)" />
              <q-btn unelevated color="negative" no-caps size="sm" label="완전 삭제" @click="onPurge(post)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import KeywordChips from '@/components/KeywordChips.vue'
import { displayTitle } from '@/utils/title'
import { formatDate } from '@/utils/format'

const { isDesktop } = useLayout()
const { restorePost, purgePost } = usePostActions()
const auth = useAuthStore()
const posts = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/posts/trash')
    posts.value = data.posts
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)


async function onRestore(post) {
  const restored = await restorePost(post)
  if (restored) await load()
}

async function onPurge(post) {
  const removed = await purgePost(post)
  if (removed) await load()
}
</script>
