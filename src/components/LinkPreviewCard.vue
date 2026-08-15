<template>
  <a
    v-if="preview"
    class="wiki-link-card"
    :href="preview.url"
    target="_blank"
    rel="noopener noreferrer"
  >
    <div v-if="preview.image" class="wiki-link-card__image">
      <img :src="preview.image" alt="" loading="lazy" @error="onImageError">
    </div>
    <div class="wiki-link-card__body">
      <div class="wiki-link-card__site">{{ preview.siteName || host }}</div>
      <div class="wiki-link-card__title">{{ preview.title || preview.url }}</div>
      <div v-if="preview.description" class="wiki-link-card__desc">{{ preview.description }}</div>
    </div>
  </a>
  <div v-else-if="loading" class="wiki-link-card wiki-link-card--loading text-grey-7">
    링크 정보를 불러오는 중…
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/utils/api'

const props = defineProps({
  url: { type: String, required: true }
})

const emit = defineEmits(['resolved'])

const preview = ref(null)
const loading = ref(false)
const failed = ref(false)

const host = computed(() => {
  try {
    return new URL(props.url).hostname
  } catch {
    return props.url
  }
})

async function load() {
  preview.value = null
  failed.value = false
  if (!props.url) return
  loading.value = true
  try {
    const { data } = await api.get('/link-preview', { params: { url: props.url } })
    preview.value = data.preview || null
    if (!preview.value) failed.value = true
    else emit('resolved', props.url, preview.value.url || props.url)
  } catch {
    failed.value = true
    preview.value = null
  } finally {
    loading.value = false
  }
}

function onImageError(event) {
  event.target.style.display = 'none'
}

watch(() => props.url, () => {
  load()
})

onMounted(load)
</script>
