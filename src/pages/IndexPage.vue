<template>
  <q-page class="wiki-page wiki-page--article">
    <div class="wiki-main wiki-main--wide">
      <template v-if="showingHome">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="40px" color="primary" />
        </div>
        <q-banner v-else-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>
        <template v-else>
          <div
            v-for="(homePost, index) in homePosts"
            :key="homePost.id"
            :class="index ? 'q-mt-xl' : ''"
          >
            <div class="wiki-article-head">
              <div class="wiki-article-head__body">
                <div :class="['wiki-article-head__title', isDesktop ? 'text-h4 text-weight-bold' : 'text-h5']">{{ displayTitle(homePost.title) }}</div>
                <div class="text-grey-7 q-mt-sm" :class="isDesktop ? 'text-body2' : 'text-caption'">
                  {{ homePost.categoryName || '미분류' }} · {{ homePost.authorName }} · {{ formatDate(homePost.updatedAt) }}
                  <q-badge class="q-ml-sm" color="info">홈페이지</q-badge>
                  <q-badge class="q-ml-sm" :color="homePost.status === 'draft' ? 'warning' : 'primary'">
                    {{ homePost.status === 'draft' ? '작성중' : '발행' }}
                  </q-badge>
                  <q-badge v-if="homePost.status === 'published'" class="q-ml-sm" :color="homePost.visibility === 'private' ? 'grey' : 'positive'">
                    {{ homePost.visibility === 'private' ? '비공개' : '공개' }}
                  </q-badge>
                </div>
                <KeywordChips class="q-mt-sm" :keywords="homePost.keywords" />
              </div>
              <div v-if="auth.canWrite" class="wiki-article-actions">
                <q-btn
                  outline
                  color="primary"
                  icon="edit"
                  :label="isDesktop || $q.screen.gt.xs ? '수정' : undefined"
                  :to="`/posts/${homePost.id}/edit`"
                />
                <q-btn
                  unelevated
                  color="negative"
                  icon="delete"
                  :label="isDesktop || $q.screen.gt.xs ? '삭제' : undefined"
                  @click="onRemoveHome(homePost)"
                />
              </div>
            </div>
            <q-card flat bordered class="wiki-article-card wiki-article-body">
              <PostViewer :editor-type="homePost.editorType" :content="homePost.content" />
            </q-card>
            <FileAttachments :model-value="homePost.attachments || []" card-class="q-mt-md" />
          </div>
        </template>
      </template>

      <template v-else>
        <div class="row items-center q-mb-md no-wrap">
          <div :class="isDesktop ? 'text-h4 text-weight-bold col' : 'text-h6 text-weight-medium col'">
            {{ heading }}
          </div>
        </div>

        <q-btn-toggle
          v-if="auth.canWrite"
          v-model="statusFilter"
          class="q-mb-md"
          unelevated
          no-caps
          :spread="!isDesktop"
          toggle-color="primary"
          :options="statusFilterOptions"
        />

        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="40px" color="primary" />
        </div>

        <q-banner v-else-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

        <q-card v-else-if="!posts.length" flat bordered class="q-pa-lg text-center text-grey-7">
          표시할 글이 없습니다.
        </q-card>

        <div v-else-if="isDesktop" class="wiki-article-card">
          <div v-for="post in posts" :key="post.id" class="wiki-post-row">
            <router-link :to="`/posts/${post.id}`" class="wiki-post-row__main">
              <div class="wiki-post-row__title">{{ displayTitle(post.title) }}</div>
              <div class="wiki-post-row__meta">
                <span class="wiki-post-row__url">{{ postPath(post) }}</span>
                <span>{{ post.categoryName || '미분류' }} · {{ post.authorName }}</span>
                <KeywordChips :keywords="post.keywords" :wrap="false" />
              </div>
            </router-link>
            <div class="wiki-post-row__aside">
              <div class="row q-gutter-xs justify-end">
                <q-badge v-if="post.isHomepage" color="info">홈페이지</q-badge>
                <q-badge :color="post.status === 'draft' ? 'warning' : 'primary'">
                  {{ post.status === 'draft' ? '작성중' : '발행' }}
                </q-badge>
                <q-badge v-if="post.status === 'published'" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                  {{ post.visibility === 'private' ? '비공개' : '공개' }}
                </q-badge>
              </div>
              <div class="row items-center no-wrap q-gutter-xs">
                <div class="wiki-post-row__date">{{ formatDate(post.updatedAt) }}</div>
                <q-btn
                  v-if="auth.canWrite"
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  aria-label="삭제"
                  @click="onRemove(post)"
                />
              </div>
            </div>
          </div>
        </div>

        <q-list v-else separator bordered class="rounded-borders wiki-article-card">
          <q-item v-for="post in posts" :key="post.id" clickable :to="`/posts/${post.id}`" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-medium wiki-post-row__title">{{ displayTitle(post.title) }}</q-item-label>
              <q-item-label caption class="wiki-post-row__meta">
                <span class="wiki-post-row__url">{{ postPath(post) }}</span>
                <span>{{ post.categoryName || '미분류' }} · {{ post.authorName }} · {{ formatDate(post.updatedAt) }}</span>
                <KeywordChips :keywords="post.keywords" :wrap="false" />
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="column items-end q-gutter-xs">
                <q-badge v-if="post.isHomepage" color="info">홈페이지</q-badge>
                <q-badge :color="post.status === 'draft' ? 'warning' : 'primary'">
                  {{ post.status === 'draft' ? '작성중' : '발행' }}
                </q-badge>
                <q-badge v-if="post.status === 'published'" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                  {{ post.visibility === 'private' ? '비공개' : '공개' }}
                </q-badge>
                <q-btn
                  v-if="auth.canWrite"
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  aria-label="삭제"
                  @click.stop.prevent="onRemove(post)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import KeywordChips from '@/components/KeywordChips.vue'
import PostViewer from '@/components/PostViewer.vue'
import FileAttachments from '@/components/FileAttachments.vue'
import { displayTitle } from '@/utils/title'

const route = useRoute()
const { $q, isDesktop } = useLayout()
const { removePost } = usePostActions()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const posts = ref([])
const homePosts = ref([])
const loading = ref(false)
const error = ref('')
const statusFilter = ref('all')
const statusFilterOptions = [
  { label: '전체', value: 'all' },
  { label: '발행', value: 'published' },
  { label: '작성중', value: 'draft' }
]

const wantsHomepage = computed(() => (
  settings.loaded
  && settings.hasHomepage
  && !route.query.categoryId
  && !route.query.q
  && route.query.view !== 'list'
))

const showingHome = computed(() => wantsHomepage.value && homePosts.value.length > 0)

const heading = computed(() => {
  if (route.query.q) return `"${route.query.q}" 검색 결과`
  if (route.query.categoryId === 'uncategorized') return '미분류'
  const id = Number(route.query.categoryId)
  const category = wiki.categories.find((c) => c.id === id)
  return category ? category.name : '전체 글'
})

async function loadList() {
  const params = {}
  if (route.query.categoryId) params.categoryId = route.query.categoryId
  if (route.query.q) params.q = route.query.q
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  const { data } = await api.get('/posts', { params })
  posts.value = data.posts
  homePosts.value = []
}

async function load() {
  if (!settings.loaded) {
    loading.value = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    if (wantsHomepage.value) {
      try {
        const { data } = await api.get('/posts/homepage')
        homePosts.value = Array.isArray(data.posts) ? data.posts : []
        posts.value = []
        if (homePosts.value.length) return
      } catch {
        homePosts.value = []
      }
    } else {
      homePosts.value = []
    }
    await loadList()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

watch(
  () => [
    route.query.categoryId,
    route.query.q,
    route.query.view,
    settings.hasHomepage,
    settings.homePostIds.join(','),
    settings.loaded,
    auth.user,
    statusFilter.value
  ],
  load,
  { immediate: true }
)

function formatDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

function postPath(post) {
  return `${window.location.origin}/posts/${post.id}`
}

async function onRemove(post) {
  const removed = await removePost(post, { redirect: false })
  if (removed) {
    await settings.load()
    await load()
  }
}

async function onRemoveHome(post) {
  const removed = await removePost(post, { redirect: false })
  if (removed) {
    await settings.load()
    await load()
  }
}
</script>
