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
          <q-btn outline no-caps label="취소" :disable="saving" @click="cancelEdit" />
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
            <q-input v-model="title" outlined label="제목" />
          </div>
          <div class="col-12">
            <KeywordSelect v-model="keywords" />
          </div>
          <div class="col-12">
            <q-checkbox v-model="isHomepage" label="홈페이지로 사용" />
            <div class="text-caption text-grey-7 q-ml-lg">
              여러 글을 지정할 수 있으며, 홈에서는 표시 순서대로 이어서 보입니다.
            </div>
            <q-input
              v-if="isHomepage"
              v-model.number="homepageSort"
              type="number"
              outlined
              dense
              class="q-mt-sm q-ml-lg"
              style="max-width: 220px"
              label="표시 순서"
              hint="숫자가 작을수록 위에 표시됩니다."
              :min="0"
              :max="9999"
              step="1"
            />
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

      <FileAttachments v-model="attachments" editable class="q-mt-md" />

      <div class="q-mt-md">
        <CkeditorEditor
          v-if="editorType === 'ckeditor'"
          :key="editorKey"
          v-model="drafts.ckeditor"
        />
        <EditorJsEditor
          v-else-if="editorType === 'editorjs'"
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
        <q-btn outline no-caps label="취소" :disable="saving" @click="cancelEdit" />
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
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useWikiStore } from '@/stores/wiki'
import { useLayout } from '@/composables/useLayout'
import { usePostActions } from '@/composables/usePostActions'
import { useSettingsStore } from '@/stores/settings'
import { renderMarkdown } from '@/utils/markdown'
import { sanitizeHtml } from '@/utils/sanitize'
import { EDITOR_OPTIONS } from '@/utils/editors'
import CategorySelect from '@/components/CategorySelect.vue'
import KeywordSelect from '@/components/KeywordSelect.vue'
import FileAttachments from '@/components/FileAttachments.vue'

const CkeditorEditor = defineAsyncComponent(() => import('@/components/CkeditorEditor.vue'))
const EditorJsEditor = defineAsyncComponent(() => import('@/components/EditorJsEditor.vue'))
const SourceEditor = defineAsyncComponent(() => import('@/components/SourceEditor.vue'))

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
const homepageSort = ref(0)
const visibility = ref('public')
const status = ref('draft')
const categoryId = ref(null)
const editorType = ref(settings.defaultEditor)
const previousEditorType = ref(settings.defaultEditor)
const drafts = ref({ ckeditor: '', editorjs: EMPTY_EDITORJS, markdown: '', html: '' })
const attachments = ref([])
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
    ? sanitizeHtml(drafts.value.html)
    : sanitizeHtml(renderMarkdown(drafts.value.markdown))
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
    homepageSort: isHomepage.value ? Number(homepageSort.value) || 0 : null,
    visibility: visibility.value,
    categoryId: categoryId.value ?? null,
    editorType: editorType.value,
    content: editorContent(),
    attachments: attachments.value.map((file) => file.storedName).sort()
  })
}

const isDirty = computed(() => leaveReady.value && snapshot() !== savedSnapshot.value)
const cancelTarget = computed(() => (isEdit.value ? `/posts/${route.params.id}` : '/'))
let removeLeaveGuard = null

function confirmLeave() {
  if (leaveConfirming) return leaveConfirming
  leaveConfirming = new Promise((resolve) => {
    Dialog.create({
      title: '저장하지 않은 내용',
      message: '저장하지 않은 내용이 있습니다. 이 페이지를 나가면 사라집니다.',
      persistent: true,
      cancel: { label: '머무르기', flat: true },
      ok: { label: '나가기', color: 'negative', unelevated: true }
    }).onOk(() => resolve(true))
      .onCancel(() => resolve(false))
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

async function leaveTo(path) {
  if (!bypassLeave.value && isDirty.value) {
    const ok = await confirmLeave()
    if (!ok) return false
  }
  bypassLeave.value = true
  await router.push(path)
  return true
}

async function cancelEdit() {
  await leaveTo(cancelTarget.value)
}

removeLeaveGuard = router.beforeEach(async (to, from) => {
  if (bypassLeave.value) return true
  if (from.fullPath !== route.fullPath) return true
  if (to.fullPath === from.fullPath) return true
  if (!isDirty.value) return true
  const ok = await confirmLeave()
  if (ok) {
    bypassLeave.value = true
    return true
  }
  return false
})

onMounted(async () => {
  // 새 글은 로딩 중에도 이탈 확인이 되도록 기준 스냅샷을 먼저 잡습니다.
  if (!isEdit.value) {
    editorType.value = settings.defaultEditor
    previousEditorType.value = settings.defaultEditor
    savedSnapshot.value = snapshot()
    leaveReady.value = true
  }

  await Promise.all([wiki.ensureLoaded(), settings.ensureLoaded()])
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/posts/${route.params.id}`)
      const post = data.post
      title.value = post.title
      keywords.value = post.keywords || []
      isHomepage.value = Boolean(post.isHomepage)
      homepageSort.value = post.homepageSort != null ? Number(post.homepageSort) : 0
      visibility.value = post.visibility
      status.value = post.status || 'published'
      categoryId.value = post.categoryId
      editorType.value = post.editorType
      previousEditorType.value = post.editorType
      if (post.editorType === 'markdown') drafts.value.markdown = post.content || ''
      else if (post.editorType === 'html') drafts.value.html = post.content || ''
      else if (post.editorType === 'ckeditor') drafts.value.ckeditor = post.content || ''
      else drafts.value.editorjs = post.content || EMPTY_EDITORJS
      attachments.value = Array.isArray(post.attachments) ? post.attachments : []
      editorKey.value += 1
    } catch (err) {
      error.value = getErrorMessage(err)
    }
    savedSnapshot.value = snapshot()
    leaveReady.value = true
  } else {
    const dirtyAlready = isDirty.value
    editorType.value = settings.defaultEditor
    previousEditorType.value = settings.defaultEditor
    if (!dirtyAlready) {
      savedSnapshot.value = snapshot()
      editorKey.value += 1
    }
  }
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  removeLeaveGuard?.()
  removeLeaveGuard = null
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
      homepageSort: isHomepage.value ? Number(homepageSort.value) || 0 : undefined,
      visibility: visibility.value,
      status: nextStatus,
      categoryId: categoryId.value,
      editorType: editorType.value,
      content: editorType.value === 'editorjs' ? drafts.value.editorjs : drafts.value[editorType.value],
      attachments: attachments.value
    }
    const { data } = isEdit.value
      ? await api.patch(`/posts/${route.params.id}`, payload)
      : await api.post('/posts', payload)
    status.value = nextStatus
    await settings.load({ force: true })
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
