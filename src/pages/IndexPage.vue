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
                  {{ homePost.categoryName || t('common.uncategorized') }} · {{ homePost.authorName }} · {{ t('common.created', { date: formatDate(homePost.createdAt) }) }}<template v-if="isModifiedPost(homePost)"> · {{ t('common.updated', { date: formatDate(homePost.updatedAt) }) }}</template>
                  <q-badge class="q-ml-sm" color="info">{{ t('posts.homepageBadge') }}</q-badge>
                  <q-badge class="q-ml-sm" :color="homePost.status === 'draft' ? 'warning' : 'primary'">
                    {{ homePost.status === 'draft' ? t('common.draft') : t('common.published') }}
                  </q-badge>
                  <q-badge v-if="homePost.status === 'published'" class="q-ml-sm" :color="homePost.visibility === 'private' ? 'grey' : 'positive'">
                    {{ homePost.visibility === 'private' ? t('common.private') : t('common.public') }}
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
                  :label="isDesktop ? t('common.edit') : undefined"
                  :aria-label="isDesktop ? undefined : t('common.edit')"
                  :to="`/posts/${homePost.id}/edit`"
                />
                <q-btn
                  unelevated
                  color="negative"
                  icon="delete"
                  no-caps
                  :dense="!isDesktop"
                  :size="isDesktop ? 'md' : 'sm'"
                  :label="isDesktop ? t('common.delete') : undefined"
                  :aria-label="isDesktop ? undefined : t('common.delete')"
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

      <template v-else-if="showingBlogHome">
        <div v-if="loading" class="flex flex-center q-pa-xl">
          <q-spinner size="40px" color="primary" />
        </div>
        <q-banner v-else-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>
        <q-card v-else-if="!homePosts.length && !posts.length" flat bordered class="q-pa-lg text-center text-grey-7">
          {{ t('posts.empty') }}
        </q-card>
        <template v-else>
          <div
            v-for="(homePost, index) in homePosts"
            :key="`home-${homePost.id}`"
            :class="index ? 'q-mt-xl' : ''"
          >
            <div class="wiki-article-head">
              <div class="wiki-article-head__body">
                <router-link :to="`/posts/${homePost.id}`" class="wiki-article-head__title text-primary" :class="isDesktop ? 'text-h4 text-weight-bold' : 'text-h5'">
                  {{ displayTitle(homePost.title) }}
                </router-link>
                <div class="text-grey-7 q-mt-sm" :class="isDesktop ? 'text-body2' : 'text-caption'">
                  {{ homePost.categoryName || t('common.uncategorized') }} · {{ homePost.authorName }} · {{ t('common.created', { date: formatDate(homePost.createdAt) }) }}<template v-if="isModifiedPost(homePost)"> · {{ t('common.updated', { date: formatDate(homePost.updatedAt) }) }}</template>
                  <q-badge class="q-ml-sm" color="info">{{ t('posts.homepageBadge') }}</q-badge>
                  <q-badge class="q-ml-sm" :color="homePost.status === 'draft' ? 'warning' : 'primary'">
                    {{ homePost.status === 'draft' ? t('common.draft') : t('common.published') }}
                  </q-badge>
                  <q-badge v-if="homePost.status === 'published'" class="q-ml-sm" :color="homePost.visibility === 'private' ? 'grey' : 'positive'">
                    {{ homePost.visibility === 'private' ? t('common.private') : t('common.public') }}
                  </q-badge>
                </div>
                <KeywordChips class="q-mt-sm" :keywords="homePost.keywords" />
              </div>
              <div class="wiki-article-actions">
                <q-btn
                  outline
                  color="primary"
                  icon="content_copy"
                  no-caps
                  :dense="!isDesktop"
                  :size="isDesktop ? 'md' : 'sm'"
                  :label="isDesktop ? t('common.copyLink') : undefined"
                  :aria-label="isDesktop ? undefined : t('common.copyLink')"
                  @click="copyLink(homePost)"
                />
                <template v-if="auth.canWrite">
                  <q-btn
                    outline
                    color="primary"
                    icon="edit"
                    no-caps
                    :dense="!isDesktop"
                    :size="isDesktop ? 'md' : 'sm'"
                    :label="isDesktop ? t('common.edit') : undefined"
                    :aria-label="isDesktop ? undefined : t('common.edit')"
                    :to="`/posts/${homePost.id}/edit`"
                  />
                  <q-btn
                    unelevated
                    color="negative"
                    icon="delete"
                    no-caps
                    :dense="!isDesktop"
                    :size="isDesktop ? 'md' : 'sm'"
                    :label="isDesktop ? t('common.delete') : undefined"
                    :aria-label="isDesktop ? undefined : t('common.delete')"
                    @click="onRemoveHome(homePost)"
                  />
                </template>
              </div>
            </div>
            <q-card flat bordered class="wiki-article-card wiki-article-body">
              <PostViewer :editor-type="homePost.editorType" :content="homePost.content" />
            </q-card>
            <PostLinkPreviews :content="homePost.content" extra-class="q-mt-md" />
            <FileAttachments :model-value="homePost.attachments || []" card-class="q-mt-md" />
          </div>

          <div
            v-for="(post, index) in posts"
            :key="post.id"
            :class="(homePosts.length || index) ? 'q-mt-xl' : ''"
          >
            <div class="wiki-article-head">
              <div class="wiki-article-head__body">
                <router-link :to="`/posts/${post.id}`" class="wiki-article-head__title text-primary" :class="isDesktop ? 'text-h4 text-weight-bold' : 'text-h5'">
                  {{ displayTitle(post.title) }}
                </router-link>
                <div class="text-grey-7 q-mt-sm" :class="isDesktop ? 'text-body2' : 'text-caption'">
                  {{ post.categoryName || t('common.uncategorized') }} · {{ post.authorName }} · {{ t('common.created', { date: formatDate(post.createdAt) }) }}<template v-if="isModifiedPost(post)"> · {{ t('common.updated', { date: formatDate(post.updatedAt) }) }}</template>
                  <q-badge class="q-ml-sm" :color="post.status === 'draft' ? 'warning' : 'primary'">
                    {{ post.status === 'draft' ? t('common.draft') : t('common.published') }}
                  </q-badge>
                  <q-badge v-if="post.status === 'published'" class="q-ml-sm" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                    {{ post.visibility === 'private' ? t('common.private') : t('common.public') }}
                  </q-badge>
                </div>
                <KeywordChips class="q-mt-sm" :keywords="post.keywords" />
              </div>
              <div class="wiki-article-actions">
                <q-btn
                  outline
                  color="primary"
                  icon="content_copy"
                  no-caps
                  :dense="!isDesktop"
                  :size="isDesktop ? 'md' : 'sm'"
                  :label="isDesktop ? t('common.copyLink') : undefined"
                  :aria-label="isDesktop ? undefined : t('common.copyLink')"
                  @click="copyLink(post)"
                />
                <template v-if="auth.canWrite">
                  <q-btn
                    outline
                    color="primary"
                    icon="edit"
                    no-caps
                    :dense="!isDesktop"
                    :size="isDesktop ? 'md' : 'sm'"
                    :label="isDesktop ? t('common.edit') : undefined"
                    :aria-label="isDesktop ? undefined : t('common.edit')"
                    :to="`/posts/${post.id}/edit`"
                  />
                  <q-btn
                    unelevated
                    color="negative"
                    icon="delete"
                    no-caps
                    :dense="!isDesktop"
                    :size="isDesktop ? 'md' : 'sm'"
                    :label="isDesktop ? t('common.delete') : undefined"
                    :aria-label="isDesktop ? undefined : t('common.delete')"
                    @click="onRemove(post)"
                  />
                </template>
              </div>
            </div>
            <q-card flat bordered class="wiki-article-card wiki-article-body">
              <PostViewer :editor-type="post.editorType" :content="post.content" />
            </q-card>
            <PostLinkPreviews :content="post.content" extra-class="q-mt-md" />
            <FileAttachments :model-value="post.attachments || []" card-class="q-mt-md" />
          </div>

          <div
            v-if="total > 0"
            class="wiki-pagination row items-center justify-between q-mt-xl q-gutter-sm"
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
          {{ t('posts.empty') }}
        </q-card>

        <div v-else-if="isDesktop" class="wiki-article-card">
          <div v-for="post in posts" :key="post.id" class="wiki-post-row">
            <router-link :to="`/posts/${post.id}`" class="wiki-post-row__main">
              <div class="wiki-post-row__title">{{ displayTitle(post.title) }}</div>
              <div class="wiki-post-row__meta">
                <span class="wiki-post-row__url">{{ postPath(post) }}</span>
                <span>{{ post.categoryName || t('common.uncategorized') }} · {{ post.authorName }}</span>
                <KeywordChips :keywords="post.keywords" :wrap="false" />
              </div>
            </router-link>
            <div class="wiki-post-row__aside">
              <div class="row q-gutter-xs justify-end">
                <q-badge v-if="post.isHomepage" color="info">{{ t('posts.homepageBadge') }}</q-badge>
                <q-badge :color="post.status === 'draft' ? 'warning' : 'primary'">
                  {{ post.status === 'draft' ? t('common.draft') : t('common.published') }}
                </q-badge>
                <q-badge v-if="post.status === 'published'" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                  {{ post.visibility === 'private' ? t('common.private') : t('common.public') }}
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
                  :aria-label="t('common.delete')"
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
                <span>{{ post.categoryName || t('common.uncategorized') }} · {{ post.authorName }} · {{ formatDate(post.createdAt) }}</span>
                <KeywordChips :keywords="post.keywords" :wrap="false" />
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="column items-end q-gutter-xs">
                <q-badge v-if="post.isHomepage" color="info">{{ t('posts.homepageBadge') }}</q-badge>
                <q-badge :color="post.status === 'draft' ? 'warning' : 'primary'">
                  {{ post.status === 'draft' ? t('common.draft') : t('common.published') }}
                </q-badge>
                <q-badge v-if="post.status === 'published'" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                  {{ post.visibility === 'private' ? t('common.private') : t('common.public') }}
                </q-badge>
                <q-btn
                  v-if="auth.canWrite"
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  :aria-label="t('common.delete')"
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
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { $q, isDesktop } = useLayout()
const { removePost } = usePostActions()
const auth = useAuthStore()
const wiki = useWikiStore()
const settings = useSettingsStore()
const { t } = useI18n()
const posts = ref([])
const homePosts = ref([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const statusFilter = ref('all')
const statusFilterOptions = computed(() => [
  { label: t('status.all'), value: 'all' },
  { label: t('status.published'), value: 'published' },
  { label: t('status.draft'), value: 'draft' }
])
const PAGE_SIZE_KEY = 'wikiman_page_size'
const PAGE_SIZES = [10, 20, 50, 100]
const pageSizeOptions = computed(() => PAGE_SIZES.map((value) => ({
  label: t('posts.pageSize', { count: value }),
  value
})))

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

const isHomeRoot = computed(() => (
  route.path === '/'
  && !activeCategoryId.value
  && !route.query.q
  && !activeKeyword.value
  && route.query.view !== 'list'
))

const wantsBlogHome = computed(() => (
  settings.loaded
  && settings.blogMode
  && isHomeRoot.value
))

const wantsHomepage = computed(() => (
  settings.loaded
  && !settings.blogMode
  && settings.hasHomepage
  && isHomeRoot.value
))

const showingHome = computed(() => wantsHomepage.value && homePosts.value.length > 0)
const showingBlogHome = computed(() => wantsBlogHome.value)

const effectivePageSize = computed(() => (
  wantsBlogHome.value ? settings.blogPostsPerPage : pageSize.value
))

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / effectivePageSize.value) || 1))
const pageRangeLabel = computed(() => {
  if (!total.value) return ''
  const start = (page.value - 1) * effectivePageSize.value + 1
  const end = Math.min(total.value, page.value * effectivePageSize.value)
  return t('posts.pagination', { start, end, total: total.value })
})

const showQuickComposer = computed(() => (
  !isDesktop.value
  && settings.mobileQuickPostEnabled
  && auth.canWrite
  && isHomeRoot.value
))

const heading = computed(() => {
  if (activeKeyword.value) return t('posts.keywordResults', { keyword: activeKeyword.value })
  if (route.query.q) return t('posts.searchResults', { query: route.query.q })
  if (activeCategoryId.value === 'uncategorized') return t('common.uncategorized')
  const id = Number(activeCategoryId.value)
  const category = wiki.categories.find((c) => c.id === id)
  return category ? category.name : t('nav.allPosts')
})

const listKey = computed(() => [
  route.path,
  String(route.params.keyword || ''),
  String(activeCategoryId.value || ''),
  String(route.query.q || ''),
  String(route.query.view || ''),
  String(route.query.page || ''),
  String(pageSize.value),
  String(settings.blogMode ? '1' : '0'),
  String(settings.blogShowHomepage ? '1' : '0'),
  String(settings.blogPostsPerPage),
  String(settings.hasHomepage),
  settings.homePostIds.join(','),
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

async function loadBlogFeed(signal) {
  const params = {
    page: page.value,
    pageSize: settings.blogPostsPerPage,
    status: 'published',
    includeContent: 1
  }
  const feedReq = api.get('/posts', { params, signal })
  let pinned = []
  if (settings.blogShowHomepage && page.value === 1) {
    try {
      const { data: homeData } = await api.get('/posts/homepage', { signal })
      pinned = Array.isArray(homeData.posts) ? homeData.posts : []
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') throw err
      pinned = []
    }
  }
  const { data } = await feedReq
  const pinnedIds = settings.blogShowHomepage
    ? new Set([
      ...pinned.map((post) => Number(post.id)),
      ...settings.homePostIds.map((id) => Number(id))
    ].filter((id) => Number.isFinite(id) && id > 0))
    : new Set()
  const feedPosts = Array.isArray(data.posts) ? data.posts : []
  posts.value = pinnedIds.size
    ? feedPosts.filter((post) => !pinnedIds.has(Number(post.id)))
    : feedPosts
  total.value = Number(data.total) || 0
  homePosts.value = page.value === 1 ? pinned : []
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
    if (wantsBlogHome.value) {
      await loadBlogFeed(signal)
      return
    }
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

async function copyLink(post) {
  if (!post?.id) return
  const url = postPath(post)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const input = document.createElement('input')
      input.value = url
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    $q.notify({ type: 'positive', message: t('posts.copiedLink') })
  } catch {
    $q.notify({ type: 'negative', message: t('posts.copyLinkFailed') })
  }
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
