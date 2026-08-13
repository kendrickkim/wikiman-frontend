<template>
  <q-page class="wiki-page">
    <div class="row items-center q-mb-md">
      <div class="text-h6">{{ isEdit ? '글 수정' : '새 글' }}</div>
      <q-badge class="q-ml-sm" :color="status === 'draft' ? 'warning' : 'primary'">
        {{ status === 'draft' ? '작성중' : '발행' }}
      </q-badge>
    </div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-card flat bordered class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-input v-model="title" outlined label="제목" />
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="visibility"
            :options="visibilityOptions"
            emit-value
            map-options
            outlined
            label="공개 범위"
          />
        </div>
        <div class="col-12 col-md-8">
          <CategorySelect v-model="categoryId" />
        </div>
        <div class="col-12">
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
        <div class="row items-center q-mb-sm">
          <div class="text-caption text-grey-7 col">Markdown · plantuml · 이미지 붙여넣기</div>
          <q-toggle v-if="$q.screen.gt.sm" v-model="showPreview" label="미리보기" />
        </div>
        <div class="row q-col-gutter-md">
          <div :class="showPreview && $q.screen.gt.sm ? 'col-12 col-md-6' : 'col-12'">
            <MarkdownEditor :key="editorKey + '-md'" v-model="drafts.markdown" />
          </div>
          <div v-if="showPreview && $q.screen.gt.sm" class="col-12 col-md-6">
            <q-card flat bordered class="wiki-content q-pa-md" style="min-height: 420px;">
              <div v-html="previewHtml" />
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div class="row q-gutter-sm q-mt-md">
      <q-btn
        outline
        color="primary"
        class="col-grow col-sm-auto"
        label="작성중 저장"
        :loading="saving && savingAs === 'draft'"
        :disable="saving"
        @click="save('draft')"
      />
      <q-btn
        unelevated
        color="primary"
        class="col-grow col-sm-auto"
        label="발행"
        :loading="saving && savingAs === 'published'"
        :disable="saving"
        @click="save('published')"
      />
      <q-btn flat class="col-grow col-sm-auto" label="취소" :to="isEdit ? `/posts/${route.params.id}` : '/'" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useWikiStore } from '@/stores/wiki'
import { renderMarkdown } from '@/utils/markdown'
import CategorySelect from '@/components/CategorySelect.vue'
import EditorJsEditor from '@/components/EditorJsEditor.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const EMPTY_EDITORJS = JSON.stringify({ blocks: [] })

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const wiki = useWikiStore()

const isEdit = computed(() => Boolean(route.params.id))
const title = ref('')
const visibility = ref('public')
const status = ref('draft')
const categoryId = ref(null)
const editorType = ref('editorjs')
const previousEditorType = ref('editorjs')
const drafts = ref({ editorjs: EMPTY_EDITORJS, markdown: '' })
const editorKey = ref(0)
const showPreview = ref($q.screen.gt.sm)
const saving = ref(false)
const savingAs = ref('')
const error = ref('')

const visibilityOptions = [
  { label: '전체 공개', value: 'public' },
  { label: '비공개 (작성자만)', value: 'private' }
]
const editorOptions = [
  { label: 'Editor.js (기본)', value: 'editorjs' },
  { label: 'Markdown 코드 에디터', value: 'markdown' }
]
const previewHtml = computed(() => renderMarkdown(drafts.value.markdown))

onMounted(async () => {
  await wiki.loadCategories()
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/posts/${route.params.id}`)
      const post = data.post
      title.value = post.title
      visibility.value = post.visibility
      status.value = post.status || 'published'
      categoryId.value = post.categoryId
      editorType.value = post.editorType
      previousEditorType.value = post.editorType
      if (post.editorType === 'markdown') drafts.value.markdown = post.content || ''
      else drafts.value.editorjs = post.content || EMPTY_EDITORJS
      editorKey.value += 1
    } catch (err) {
      error.value = getErrorMessage(err)
    }
  }
})

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
      visibility: visibility.value,
      status: nextStatus,
      categoryId: categoryId.value,
      editorType: editorType.value,
      content: editorType.value === 'markdown' ? drafts.value.markdown : drafts.value.editorjs
    }
    const { data } = isEdit.value
      ? await api.patch(`/posts/${route.params.id}`, payload)
      : await api.post('/posts', payload)
    status.value = nextStatus
    $q.notify({ type: 'positive', message: nextStatus === 'published' ? '발행했습니다.' : '작성중으로 저장했습니다.' })
    router.push(`/posts/${data.post.id}`)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
    savingAs.value = ''
  }
}
</script>
