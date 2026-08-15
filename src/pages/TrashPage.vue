<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <div class="row items-start justify-between q-gutter-sm q-mb-md">
        <div>
          <div :class="isDesktop ? 'text-h4 text-weight-bold' : 'text-h6'">{{ t('nav.trash') }}</div>
          <div class="text-grey-7 q-mt-xs">{{ t('remaining.k157') }}</div>
        </div>
        <q-btn
          v-if="auth.canWrite && posts.length"
          unelevated
          color="negative"
          no-caps
          icon="delete_forever"
          :label="t('posts.emptyTrashTitle')"
          :loading="emptying"
          :disable="loading"
          @click="onEmpty"
        />
      </div>

      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-card v-if="!posts.length && !loading" flat bordered class="q-pa-lg text-center text-grey-7">{{ t('posts.trashEmpty') }}</q-card>

      <div v-else-if="isDesktop" class="wiki-article-card">
        <div v-for="post in posts" :key="post.id" class="wiki-post-row">
          <div class="wiki-post-row__main">
            <div class="wiki-post-row__title">{{ displayTitle(post.title) }}</div>
            <div class="wiki-post-row__meta">
              {{ t('extra.deletedAt', { category: post.categoryName || t('common.uncategorized'), date: formatDate(post.deletedAt) }) }}
            </div>
            <KeywordChips :keywords="post.keywords" />
          </div>
          <div v-if="auth.canWrite" class="wiki-post-row__aside">
            <div class="row q-gutter-xs no-wrap">
              <q-btn outline color="primary" no-caps :label="t('common.restore')" @click="onRestore(post)" />
              <q-btn unelevated color="negative" no-caps :label="t('remaining.k156')" @click="onPurge(post)" />
            </div>
          </div>
        </div>
      </div>

      <q-list v-else separator bordered class="rounded-borders wiki-article-card">
        <q-item v-for="post in posts" :key="post.id" class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-medium wiki-post-row__title">{{ displayTitle(post.title) }}</q-item-label>
            <q-item-label caption>
              {{ t('extra.deletedAt', { category: post.categoryName || t('common.uncategorized'), date: formatDate(post.deletedAt) }) }}
            </q-item-label>
            <KeywordChips :keywords="post.keywords" />
          </q-item-section>
          <q-item-section v-if="auth.canWrite" side>
            <div class="column q-gutter-xs">
              <q-btn outline color="primary" no-caps size="sm" :label="t('common.restore')" @click="onRestore(post)" />
              <q-btn unelevated color="negative" no-caps size="sm" :label="t('remaining.k156')" @click="onPurge(post)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, ref } from 'vue'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import KeywordChips from '@/components/KeywordChips.vue'
import { displayTitle } from '@/utils/title'
import { formatDate } from '@/utils/format'

const { isDesktop } = useLayout()
const { restorePost, purgePost, emptyTrash } = usePostActions()
const auth = useAuthStore()
const posts = ref([])
const loading = ref(false)
const emptying = ref(false)
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

async function onEmpty() {
  emptying.value = true
  try {
    const cleared = await emptyTrash(posts.value.length)
    if (cleared) await load()
  } finally {
    emptying.value = false
  }
}
</script>
