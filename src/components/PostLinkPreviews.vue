<template>
  <div v-if="visibleUrls.length" class="wiki-link-cards" :class="extraClass">
    <LinkPreviewCard
      v-for="url in visibleUrls"
      :key="url"
      :url="url"
      @resolved="onResolved"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { extractUrls, normalizeUrlKey } from '@/utils/urls'
import LinkPreviewCard from '@/components/LinkPreviewCard.vue'

const props = defineProps({
  content: { type: String, default: '' },
  maxLinks: { type: Number, default: 12 },
  extraClass: { type: String, default: '' }
})

const sourceUrls = computed(() => extractUrls(props.content, { limit: props.maxLinks }))
const resolvedKeys = reactive(new Map())
const hidden = ref(new Set())

const visibleUrls = computed(() => sourceUrls.value.filter((url) => !hidden.value.has(url)))

watch(sourceUrls, (urls) => {
  resolvedKeys.clear()
  hidden.value = new Set()
  for (const url of urls) resolvedKeys.set(url, normalizeUrlKey(url))
}, { immediate: true })

function onResolved(sourceUrl, finalUrl) {
  const key = normalizeUrlKey(finalUrl || sourceUrl)
  if (!key) return
  resolvedKeys.set(sourceUrl, key)

  const nextHidden = new Set()
  const seen = new Set()
  for (const url of sourceUrls.value) {
    const resolved = resolvedKeys.get(url) || normalizeUrlKey(url)
    if (!resolved) continue
    if (seen.has(resolved)) nextHidden.add(url)
    else seen.add(resolved)
  }
  hidden.value = nextHidden
}
</script>
