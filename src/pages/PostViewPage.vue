<template>
  <q-page class="wiki-page wiki-page--article">
    <div class="wiki-main wiki-main--wide">
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>
      <q-banner v-else-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>
      <div v-else-if="post">
        <div class="wiki-article-head">
          <div class="wiki-article-head__body">
            <div :class="['wiki-article-head__title', isDesktop ? 'text-h4 text-weight-bold' : 'text-h5']">{{ displayTitle(post.title) }}</div>
            <div class="text-grey-7 q-mt-sm" :class="isDesktop ? 'text-body2' : 'text-caption'">
              {{ post.categoryName || t('common.uncategorized') }} · {{ post.authorName }} · {{ t('common.created', { date: formatDate(post.createdAt) }) }}<template v-if="isModified"> · {{ t('common.updated', { date: formatDate(post.updatedAt) }) }}</template>
              <q-badge v-if="post.isHomepage" class="q-ml-sm" color="info">{{ t('posts.homepageBadge') }}</q-badge>
              <q-badge class="q-ml-sm" :color="post.status === 'draft' ? 'warning' : 'primary'">
                {{ post.status === 'draft' ? t('status.draft') : t('posts.publish') }}
              </q-badge>
              <q-badge v-if="post.status === 'published'" class="q-ml-sm" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                {{ post.visibility === 'private' ? t('visibility.privateShort') : t('visibility.publicShort') }}
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
              @click="copyLink"
            />
            <template v-if="canEdit">
              <q-btn
                v-if="post.status === 'draft'"
                unelevated
                color="primary"
                icon="publish"
                no-caps
                :dense="!isDesktop"
                :size="isDesktop ? 'md' : 'sm'"
                :label="isDesktop ? t('posts.publish') : undefined"
                :aria-label="isDesktop ? undefined : t('posts.publish')"
                @click="onPublish"
              />
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
                @click="removePost(post)"
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
    </div>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import PostViewer from '@/components/PostViewer.vue'
import KeywordChips from '@/components/KeywordChips.vue'
import FileAttachments from '@/components/FileAttachments.vue'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import { displayTitle } from '@/utils/title'
import { formatDate } from '@/utils/format'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const { isDesktop } = useLayout()
const { removePost, publishPost } = usePostActions()
const auth = useAuthStore()
const post = ref(null)
const loading = ref(false)
const error = ref('')
const canEdit = computed(() => auth.canWrite)
const isModified = computed(() => (
  Boolean(post.value?.updatedAt)
  && formatDate(post.value.updatedAt) !== formatDate(post.value.createdAt)
))

async function onPublish() {
  if (!post.value) return
  const updated = await publishPost(post.value)
  if (updated && typeof updated === 'object') {
    post.value = updated
  } else if (updated) {
    post.value = { ...post.value, status: 'published' }
  }
}

async function copyLink() {
  if (!post.value?.id) return
  const url = `${window.location.origin}/posts/${post.value.id}`
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

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/posts/${route.params.id}`)
    post.value = data.post
  } catch (err) {
    error.value = getErrorMessage(err, t('posts.notFound'))
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })

</script>
