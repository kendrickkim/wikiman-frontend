<template>
  <div class="wiki-quick-body">
    <div v-if="text" class="wiki-content wiki-plaintext">{{ text }}</div>
    <QuickPostImages :content="content" :max-images="maxImages" :extra-class="text ? 'q-mt-sm' : ''" />
    <PostLinkPreviews :content="content" :max-links="maxLinks" extra-class="q-mt-md" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { quickPostPlainText } from '@/utils/quickPostContent'
import PostLinkPreviews from '@/components/PostLinkPreviews.vue'
import QuickPostImages from '@/components/QuickPostImages.vue'

const props = defineProps({
  content: { type: String, default: '' },
  maxLinks: { type: Number, default: 5 },
  maxImages: { type: Number, default: 6 }
})

const text = computed(() => quickPostPlainText(props.content))
</script>
