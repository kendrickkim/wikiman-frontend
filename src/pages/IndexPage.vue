<template>
  <q-page class="wiki-page wiki-page--article">
    <div class="wiki-main wiki-main--wide">
      <QuickPostComposer v-if="showQuickComposer" />

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
                  {{ homePost.categoryName || '미분류' }} · {{ homePost.authorName }} · 작성 {{ formatDate(homePost.createdAt) }}<template v-if="isModifiedPost(homePost)"> · 수정 {{ formatDate(homePost.updatedAt) }}</template>
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
                  no-caps
                  :dense="!isDesktop"
                  :size="isDesktop ? 'md' : 'sm'"
                  :label="isDesktop ? '수정' : undefined"
                  :aria-label="isDesktop ? undefined : '수정'"
                  :to="`/posts/${homePost.id}/edit`"
                />
                <q-btn
                  unelevated
                  color="negative"
                  icon="delete"
                  no-caps
                  :dense="!isDesktop"
                  :size="isDesktop ? 'md' : 'sm'"
                  :label="isDesktop ? '삭제' : undefined"
                  :aria-label="isDesktop ? undefined : '삭제'"
                  @click="onRemoveHome(homePost)"
                />
              </div>
            </div>
            <q-card flat bordered class="wiki-article-card wiki-article-body">
              <PostViewer :editor-type="homePost.editorType" :content="homePost.content" />
            </q-card>
            <PostLinkPreviews :content="homePost.content" extra-class="q-mt-md" />
            <FileAttachments :model-value="homePost.attachments || []" card-class="q-mt-md" />
          </div>
        </template>
      </template>

      <template v-else>
        <div class="row items-center q-mb-md q-gutter-sm">
          <div :class="isDesktop ? 'text-h4 text-weight-bold col' : 'text-h6 text-weight-medium col'">
            {{ heading }}
          </div>
          <q-select
            v-model="pageSize"
            dense
            outlined
            emit-value
            map-options
            hide-bottom-space
            :options="pageSizeOptions"
            style="min-width: 128px"
          />
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

        <div
          v-if="!loading && !error && total > 0"
          class="wiki-pagination row items-center justify-between q-mb-md q-gutter-sm"
        >
          <div class="text-grey-7 text-caption">
            {{ pageRangeLabel }}
          </div>
          <q-pagination
            v-model="page"
            class="wiki-pagination__control"
            :max="pageCount"
            :max-pages="isDesktop ? 7 : 4"
            direction-links
            :boundary-links="isDesktop"
            outline
            color="grey-7"
            active-color="primary"
            active-design="unelevated"
            gutter="sm"
          />
        </div>

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
                <div class="wiki-post-row__date">{{ formatDate(post.createdAt) }}</div>
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
                <span>{{ post.categoryName || '미분류' }} · {{ post.authorName }} · {{ formatDate(post.createdAt) }}</span>
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

        <div
          v-if="!loading && !error && total > 0"
          class="wiki-pagination row items-center justify-between q-mt-md q-gutter-sm"
        >
          <div class="text-grey-7 text-caption">
            {{ pageRangeLabel }}
          </div>
          <q-pagination
            v-model="page"
            class="wiki-pagination__control"
            :max="pageCount"
            :max-pages="isDesktop ? 7 : 4"
            direction-links
            :boundary-links="isDesktop"
            outline
            color="grey-7"
            active-color="primary"
            active-design="unelevated"
            gutter="sm"
          />
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useWikiStore } from '@/stores/wiki'
import { useSettingsStore } from '@/stores/settings'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import KeywordChips from '@/components/KeywordChips.vue'
import PostViewer from '@/components/PostViewer.vue'
import FileAttachments from '@/components/FileAttachments.vue'
import QuickPostComposer from '@/components/QuickPostComposer.vue'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import { displayTitle } from '@/utils/title'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const { $q, isDesktop } = useLayout()
const { removePost } = usePostActions()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const posts = ref([])
const homePosts = ref([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const statusFilter = ref('all')
const statusFilterOptions = [
  { label: '전체', value: 'all' },
  { label: '발행', value: 'published' },
  { label: '작성중', value: 'draft' }
]
const PAGE_SIZE_KEY = 'wikiman_page_size'
const PAGE_SIZES = [10, 20, 50, 100]
const pageSizeOptions = [
  { label: '10개씩', value: 10 },
  { label: '20개씩', value: 20 },
  { label: '50개씩', value: 50 },
  { label: '100개씩', value: 100 }
]

function readStoredPageSize() {
  const n = Number(localStorage.getItem(PAGE_SIZE_KEY))
  return PAGE_SIZES.includes(n) ? n : 10
}

const pageSize = ref(readStoredPageSize())
const activeKeyword = computed(() => {
  const fromParam = route.params.keyword
  if (fromParam != null && String(fromParam).trim() !== '') return String(fromParam)
  return String(route.query.keyword || '').trim()
})
const activeCategoryId = computed(() => {
  if (route.path.startsWith('/category/')) {
    return String(route.params.categoryId || '').trim()
  }
  return ''
})
const listPath = computed(() => {
  if (activeKeyword.value) return `/keyword/${encodeURIComponent(activeKeyword.value)}`
  if (activeCategoryId.value) return `/category/${encodeURIComponent(activeCategoryId.value)}`
  if (route.path === '/list') return '/list'
  return '/'
})
const page = computed({
  get() {
    const n = Math.floor(Number(route.query.page))
    return Number.isFinite(n) && n > 0 ? n : 1
  },
  set(value) {
    const next = { ...route.query }
    delete next.keyword
    delete next.categoryId
    delete next.view
    if (!value || value <= 1) delete next.page
    else next.page = String(value)
    router.push({ path: listPath.value, query: next })
  }
})
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value) || 1))
const pageRangeLabel = computed(() => {
  if (!total.value) return ''
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(total.value, page.value * pageSize.value)
  return `${start}–${end} / ${total.value}개`
})

const wantsHomepage = computed(() => (
  settings.loaded
  && settings.hasHomepage
  && route.path === '/'
  && !activeCategoryId.value
  && !route.query.q
  && !activeKeyword.value
  && route.query.view !== 'list'
))

const showingHome = computed(() => wantsHomepage.value && homePosts.value.length > 0)

const showQuickComposer = computed(() => (
  !isDesktop.value
  && settings.mobileQuickPostEnabled
  && auth.canWrite
  && route.path === '/'
  && !activeCategoryId.value
  && !route.query.q
  && !activeKeyword.value
  && route.query.view !== 'list'
))

const heading = computed(() => {
  if (activeKeyword.value) return `"${activeKeyword.value}" 키워드 글`
  if (route.query.q) return `"${route.query.q}" 검색 결과`
  if (activeCategoryId.value === 'uncategorized') return '미분류'
  const id = Number(activeCategoryId.value)
  const category = wiki.categories.find((c) => c.id === id)
  return category ? category.name : '전체 글'
})

const listKey = computed(() => [
  route.path,
  String(route.params.keyword || ''),
  String(activeCategoryId.value || ''),
  String(route.query.q || ''),
  String(route.query.view || ''),
  String(route.query.page || ''),
  String(pageSize.value),
  String(settings.hasHomepage),
  settings.loaded ? '1' : '0',
  auth.user?.id || '',
  statusFilter.value
].join('|'))

let loadGeneration = 0
let loadAbort = null

async function loadList(signal) {
  const params = {
    page: page.value,
    pageSize: pageSize.value
  }
  if (activeCategoryId.value) params.categoryId = activeCategoryId.value
  if (route.query.q) params.q = route.query.q
  if (activeKeyword.value) params.keyword = activeKeyword.value
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  const { data } = await api.get('/posts', { params, signal })
  posts.value = data.posts
  total.value = Number(data.total) || 0
  homePosts.value = []
  if (data.page && data.page !== page.value) page.value = data.page
}

async function load() {
  if (!settings.loaded) {
    loading.value = true
    return
  }
  const generation = ++loadGeneration
  loadAbort?.abort()
  loadAbort = new AbortController()
  const { signal } = loadAbort
  loading.value = true
  error.value = ''
  try {
    if (wantsHomepage.value) {
      try {
        const { data } = await api.get('/posts/homepage', { signal })
        if (generation !== loadGeneration) return
        homePosts.value = Array.isArray(data.posts) ? data.posts : []
        posts.value = []
        total.value = 0
        if (homePosts.value.length) return
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') return
        homePosts.value = []
      }
    } else {
      homePosts.value = []
    }
    await loadList(signal)
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') return
    if (generation !== loadGeneration) return
    error.value = getErrorMessage(err)
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

watch(listKey, load, { immediate: true })

watch(pageSize, (value) => {
  localStorage.setItem(PAGE_SIZE_KEY, String(value))
  if (page.value !== 1) page.value = 1
})

watch(statusFilter, () => {
  if (page.value !== 1) page.value = 1
})

onBeforeUnmount(() => {
  loadAbort?.abort()
})

function postPath(post) {
  return `${window.location.origin}/posts/${post.id}`
}

function isModifiedPost(post) {
  return Boolean(post?.updatedAt) && formatDate(post.updatedAt) !== formatDate(post.createdAt)
}

async function onRemove(post) {
  const removed = await removePost(post, { redirect: false })
  if (removed) {
    if (post.isHomepage) {
      settings.hasHomepage = settings.homePostIds.filter((id) => id !== post.id).length > 0
      settings.homePostIds = settings.homePostIds.filter((id) => id !== post.id)
    }
    if (posts.value.length <= 1 && page.value > 1) {
      page.value = page.value - 1
      return
    }
    await load()
  }
}

async function onRemoveHome(post) {
  const removed = await removePost(post, { redirect: false })
  if (removed) {
    settings.homePostIds = settings.homePostIds.filter((id) => id !== post.id)
    settings.hasHomepage = settings.homePostIds.length > 0
    await load()
  }
}
</script>
