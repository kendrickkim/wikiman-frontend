<template>
  <q-page class="wiki-page">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'wiki-edit-toolbar' : 'row items-center q-mb-md'">
        <div class="text-h6">{{ isEdit ? '글 수정' : '새 글' }}</div>
        <q-badge class="q-ml-sm" :color="status === 'draft' ? 'warning' : 'primary'">
          {{ status === 'draft' ? '작성중' : '발행' }}
        </q-badge>
        <q-space v-if="isDesktop" />
        <div v-if="isDesktop" class="wiki-edit-actions">
          <q-btn
            outline
            no-caps
            color="primary"
            label="작성중 저장"
            :loading="saving && savingAs === 'draft'"
            :disable="saving"
            @click="save('draft')"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="발행"
            :loading="saving && savingAs === 'published'"
            :disable="saving"
            @click="save('published')"
          />
          <q-btn outline no-caps label="취소" :to="isEdit ? `/posts/${route.params.id}` : '/'" />
          <q-btn
            v-if="isEdit"
            outline
            no-caps
            color="negative"
            label="삭제"
            :disable="saving"
            @click="deleteCurrent"
          />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-card flat bordered :class="isDesktop ? 'q-pa-lg' : 'q-pa-md'">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input v-model="title" outlined label="제목" :input-class="isDesktop ? 'text-h4 text-weight-bold' : 'text-h5 text-weight-bold'" />
          </div>
          <div class="col-12">
            <KeywordSelect v-model="keywords" />
          </div>
          <div class="col-12">
            <q-checkbox v-model="isHomepage" label="홈페이지로 사용" />
            <div class="text-caption text-grey-7 q-ml-lg">
              사이트에 들어오면 이 글이 먼저 보입니다. 홈페이지는 한 글만 지정할 수 있습니다.
            </div>
          </div>
          <div :class="isDesktop ? 'col-4' : 'col-12 col-md-4'">
            <q-select
              v-model="visibility"
              :options="visibilityOptions"
              emit-value
              map-options
              outlined
              label="공개 범위"
            />
          </div>
          <div :class="isDesktop ? 'col-5' : 'col-12 col-md-8'">
            <CategorySelect v-model="categoryId" />
          </div>
          <div :class="isDesktop ? 'col-3' : 'col-12'">
            <q-select
              :model-value="editorType"
              :options="editorOptions"
              emit-value
              map-options
              outlined
              label="에디터"
              @update:model-value="onEditorChange"
            />
          </div>
        </div>
      </q-card>

      <div class="q-mt-md">
        <EditorJsEditor
          v-if="editorType === 'editorjs'"
          :key="editorKey"
          v-model="drafts.editorjs"
        />
        <div v-else>
          <div class="row items-center q-mb-xs">
            <div class="text-caption text-grey-7 col">{{ sourceHint }}</div>
            <q-toggle v-if="isDesktop" v-model="showPreview" label="미리보기" />
          </div>
          <div class="row q-col-gutter-x-md">
            <div :class="showPreview && isDesktop ? 'col-6' : 'col-12'">
              <SourceEditor
                v-if="editorType === 'html'"
                :key="editorKey + '-html'"
                v-model="drafts.html"
                mode="html"
              />
              <SourceEditor
                v-else
                :key="editorKey + '-md'"
                v-model="drafts.markdown"
                mode="markdown"
              />
            </div>
            <div v-if="showPreview && isDesktop" class="col-6">
              <q-card flat bordered class="wiki-content wiki-preview-card" :class="{ 'wiki-html': editorType === 'html' }">
                <div v-html="previewHtml" />
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isDesktop" class="wiki-edit-actions wiki-edit-actions--mobile q-mt-md">
        <q-btn
          outline
          no-caps
          color="primary"
          label="작성중 저장"
          :loading="saving && savingAs === 'draft'"
          :disable="saving"
          @click="save('draft')"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="발행"
          :loading="saving && savingAs === 'published'"
          :disable="saving"
          @click="save('published')"
        />
        <q-btn outline no-caps label="취소" :to="isEdit ? `/posts/${route.params.id}` : '/'" />
        <q-btn
          v-if="isEdit"
          outline
          no-caps
          color="negative"
          label="삭제"
          :disable="saving"
          @click="deleteCurrent"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { useWikiStore } from '@/stores/wiki'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import { useSettingsStore } from '@/stores/settings'
import { renderMarkdown } from '@/utils/markdown'
import { EDITOR_OPTIONS } from '@/utils/editors'
import CategorySelect from '@/components/CategorySelect.vue'
import KeywordSelect from '@/components/KeywordSelect.vue'
import EditorJsEditor from '@/components/EditorJsEditor.vue'
import SourceEditor from '@/components/SourceEditor.vue'

const EMPTY_EDITORJS = JSON.stringify({ blocks: [] })

const route = useRoute()
const router = useRouter()
const { $q, isDesktop } = useLayout()
const { removePost } = usePostActions()
const settings = useSettingsStore()
const wiki = useWikiStore()

const isEdit = computed(() => Boolean(route.params.id))
const title = ref('')
const keywords = ref([])
const isHomepage = ref(false)
const visibility = ref('public')
const status = ref('draft')
const categoryId = ref(null)
const editorType = ref(settings.defaultEditor)
const previousEditorType = ref(settings.defaultEditor)
const drafts = ref({ editorjs: EMPTY_EDITORJS, markdown: '', html: '' })
const editorKey = ref(0)
const showPreview = ref(isDesktop.value)
const saving = ref(false)
const savingAs = ref('')
const error = ref('')
const savedSnapshot = ref('')
const leaveReady = ref(false)
const bypassLeave = ref(false)
let leaveConfirming = null

const visibilityOptions = [
  { label: '전체 공개', value: 'public' },
  { label: '비공개 (작성자만)', value: 'private' }
]
const editorOptions = EDITOR_OPTIONS
const sourceHint = computed(() => (
  editorType.value === 'html'
    ? 'HTML · 이미지 붙여넣기'
    : 'Markdown · plantuml · 이미지 붙여넣기'
))
const previewHtml = computed(() => (
  editorType.value === 'html'
    ? drafts.value.html
    : renderMarkdown(drafts.value.markdown)
))

function editorContent() {
  if (editorType.value === 'editorjs') {
    try {
      const parsed = JSON.parse(drafts.value.editorjs || EMPTY_EDITORJS)
      return JSON.stringify(parsed.blocks || [])
    } catch {
      return drafts.value.editorjs || ''
    }
  }
  return drafts.value[editorType.value] || ''
}

function snapshot() {
  return JSON.stringify({
    title: title.value.trim(),
    keywords: [...keywords.value].map((item) => String(item).trim()).filter(Boolean).sort(),
    isHomepage: Boolean(isHomepage.value),
    visibility: visibility.value,
    categoryId: categoryId.value ?? null,
    editorType: editorType.value,
    content: editorContent()
  })
}

const isDirty = computed(() => leaveReady.value && snapshot() !== savedSnapshot.value)

function confirmLeave() {
  if (leaveConfirming) return leaveConfirming
  leaveConfirming = new Promise((resolve) => {
    $q.dialog({
      title: '저장하지 않은 내용',
      message: '저장하지 않은 내용이 있습니다. 이 페이지를 나가면 사라집니다.',
      persistent: true,
      cancel: { label: '머무르기', flat: true },
      ok: { label: '나가기', color: 'negative', unelevated: true }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  }).finally(() => {
    leaveConfirming = null
  })
  return leaveConfirming
}

function onBeforeUnload(event) {
  if (!isDirty.value || bypassLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  await Promise.all([wiki.loadCategories(), settings.load()])
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/posts/${route.params.id}`)
      const post = data.post
      title.value = post.title
      keywords.value = post.keywords || []
      isHomepage.value = Boolean(post.isHomepage)
      visibility.value = post.visibility
      status.value = post.status || 'published'
      categoryId.value = post.categoryId
      editorType.value = post.editorType
      previousEditorType.value = post.editorType
      if (post.editorType === 'markdown') drafts.value.markdown = post.content || ''
      else if (post.editorType === 'html') drafts.value.html = post.content || ''
      else drafts.value.editorjs = post.content || EMPTY_EDITORJS
      editorKey.value += 1
    } catch (err) {
      error.value = getErrorMessage(err)
    }
  } else {
    editorType.value = settings.defaultEditor
    previousEditorType.value = settings.defaultEditor
  }
  savedSnapshot.value = snapshot()
  leaveReady.value = true
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (bypassLeave.value || !isDirty.value) return true
  const ok = await confirmLeave()
  if (ok) bypassLeave.value = true
  return ok
})

async function deleteCurrent() {
  const removed = await removePost({
    id: Number(route.params.id),
    title: title.value.trim() || '이 글'
  }, { redirect: false })
  if (removed) {
    bypassLeave.value = true
    router.push('/')
  }
}

function onEditorChange(next) {
  if (next === previousEditorType.value) return
  $q.dialog({
    title: '에디터 변경',
    message: '에디터를 바꾸면 내용은 변환되지 않습니다. 각 에디터의 초안은 따로 유지됩니다.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    editorType.value = next
    previousEditorType.value = next
    editorKey.value += 1
  })
}

async function save(nextStatus) {
  saving.value = true
  savingAs.value = nextStatus
  error.value = ''
  try {
    const payload = {
      title: title.value.trim(),
      keywords: keywords.value,
      isHomepage: isHomepage.value,
      visibility: visibility.value,
      status: nextStatus,
      categoryId: categoryId.value,
      editorType: editorType.value,
      content: editorType.value === 'editorjs' ? drafts.value.editorjs : drafts.value[editorType.value]
    }
    const { data } = isEdit.value
      ? await api.patch(`/posts/${route.params.id}`, payload)
      : await api.post('/posts', payload)
    status.value = nextStatus
    if (data.post.isHomepage) settings.homePostId = data.post.id
    else if (settings.homePostId === data.post.id) settings.homePostId = null
    $q.notify({ type: 'positive', message: nextStatus === 'published' ? '발행했습니다.' : '작성중으로 저장했습니다.' })
    bypassLeave.value = true
    router.push(`/posts/${data.post.id}`)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
    savingAs.value = ''
  }
}
</script>
