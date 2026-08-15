<template>
  <div class="wiki-quick-body">
    <div class="wiki-content wiki-plaintext">{{ content }}</div>
    <PostLinkPreviews :content="content" :max-links="maxLinks" extra-class="q-mt-md" />
  </div>
</template>

<script setup>
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'

defineProps({
  content: { type: String, default: '' },
  maxLinks: { type: Number, default: 5 }
})
</script>
