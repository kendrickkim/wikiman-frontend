<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="width: 560px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6">링크 추가</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn-toggle
          v-model="linkType"
          class="q-mb-md"
          unelevated
          toggle-color="primary"
          :options="linkTypeOptions"
        />

        <q-select
          v-if="linkType === 'post'"
          v-model="postId"
          outlined
          emit-value
          map-options
          use-input
          input-debounce="150"
          label="연결할 글"
          :loading="loading"
          :options="filteredOptions"
          option-value="id"
          option-label="label"
          @filter="filterPosts"
        />
        <q-input
          v-else
          v-model="url"
          outlined
          label="URL"
          placeholder="https://example.com 또는 /posts/1"
          maxlength="500"
        />

        <q-input
          v-model="label"
          outlined
          class="q-mt-md"
          label="표시할 텍스트"
          maxlength="200"
          @keyup.enter="submit"
        />
        <div v-if="error" class="text-negative text-caption q-mt-sm">{{ error }}</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps label="취소" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="추가"
          :disable="!canSubmit"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { api, getErrorMessage } from '@/utils/api'
import { displayTitle } from '@/utils/title'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialLabel: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const linkTypeOptions = [
  { label: '위키 글', value: 'post' },
  { label: 'URL', value: 'url' }
]
const linkType = ref('post')
const postId = ref(null)
const url = ref('')
const label = ref('')
const options = ref([])
const filteredOptions = ref([])
const loading = ref(false)
const error = ref('')

const selectedPost = computed(() => options.value.find((item) => item.id === Number(postId.value)))
const href = computed(() => (
  linkType.value === 'post' ? (postId.value ? `/posts/${postId.value}` : '') : url.value.trim()
))
const validHref = computed(() => {
  if (!href.value) return false
  if (href.value.startsWith('/') && !href.value.startsWith('//') && !href.value.includes('\\')) return true
  try {
    const parsed = new URL(href.value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
})
const resolvedLabel = computed(() => (
  label.value.trim() || (linkType.value === 'post' ? selectedPost.value?.title : url.value.trim()) || ''
))
const canSubmit = computed(() => Boolean(validHref.value && resolvedLabel.value))

function postOption(post) {
  const suffix = [
    post.status === 'draft' ? '작성중' : '',
    post.visibility === 'private' ? '비공개' : ''
  ].filter(Boolean).join(' · ')
  const title = displayTitle(post.title)
  return {
    id: Number(post.id),
    title,
    label: suffix ? `${title} (${suffix})` : title
  }
}

async function loadPosts() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/settings/top-menu')
    options.value = (data.posts || []).map(postOption)
    filteredOptions.value = options.value
  } catch (err) {
    error.value = getErrorMessage(err, '글 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

function filterPosts(value, update) {
  update(() => {
    const needle = String(value || '').trim().toLowerCase()
    filteredOptions.value = needle
      ? options.value.filter((item) => item.label.toLowerCase().includes(needle))
      : options.value
  })
}

function submit() {
  if (!canSubmit.value) return
  emit('submit', { href: href.value, label: resolvedLabel.value })
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  linkType.value = 'post'
  postId.value = null
  url.value = ''
  label.value = props.initialLabel || ''
  error.value = ''
  loadPosts()
})
</script>
