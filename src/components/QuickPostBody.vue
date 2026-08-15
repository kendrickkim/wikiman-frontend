<template>
  <div class="wiki-quick-body">
    <div class="wiki-content wiki-plaintext">{{ content }}</div>
    <div v-if="urls.length" class="wiki-link-cards q-mt-md">
      <LinkPreviewCard v-for="url in urls" :key="url" :url="url" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { extractUrls } from '@/utils/urls'
import LinkPreviewCard from '@/components/LinkPreviewCard.vue'

const props = defineProps({
  content: { type: String, default: '' },
  maxLinks: { type: Number, default: 5 }
})

const urls = computed(() => extractUrls(props.content, { limit: props.maxLinks }))
</script>
