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
              {{ post.categoryName || '미분류' }} · {{ post.authorName }} · 작성 {{ formatDate(post.createdAt) }}<template v-if="isModified"> · 수정 {{ formatDate(post.updatedAt) }}</template>
              <q-badge v-if="post.isHomepage" class="q-ml-sm" color="info">홈페이지</q-badge>
              <q-badge class="q-ml-sm" :color="post.status === 'draft' ? 'warning' : 'primary'">
                {{ post.status === 'draft' ? '작성중' : '발행' }}
              </q-badge>
              <q-badge v-if="post.status === 'published'" class="q-ml-sm" :color="post.visibility === 'private' ? 'grey' : 'positive'">
                {{ post.visibility === 'private' ? '비공개' : '공개' }}
              </q-badge>
            </div>
            <KeywordChips class="q-mt-sm" :keywords="post.keywords" />
          </div>
          <div v-if="canEdit" class="wiki-article-actions">
            <q-btn
              outline
              color="primary"
              icon="edit"
              no-caps
              :dense="!isDesktop"
              :size="isDesktop ? 'md' : 'sm'"
              :label="isDesktop ? '수정' : undefined"
              :aria-label="isDesktop ? undefined : '수정'"
              :to="`/posts/${post.id}/edit`"
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
              @click="removePost(post)"
            />
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
import { computed, ref, watch } from 'vue'
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

const route = useRoute()
const { isDesktop } = useLayout()
const { removePost } = usePostActions()
const auth = useAuthStore()
const post = ref(null)
const loading = ref(false)
const error = ref('')
const canEdit = computed(() => auth.canWrite)
const isModified = computed(() => (
  Boolean(post.value?.updatedAt)
  && formatDate(post.value.updatedAt) !== formatDate(post.value.createdAt)
))

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

</script>
