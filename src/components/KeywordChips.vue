<template>
  <div v-if="keywords.length" class="wiki-keywords" :class="{ 'wiki-keywords--nowrap': !wrap }">
    <q-badge
      v-for="keyword in keywords"
      :key="keyword"
      outline
      color="primary"
      class="cursor-pointer"
      @click.stop.prevent="search(keyword)"
    >
      {{ keyword }}
    </q-badge>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  keywords: { type: Array, default: () => [] },
  wrap: { type: Boolean, default: true }
})

const router = useRouter()

function search(keyword) {
  router.push(`/keyword/${encodeURIComponent(keyword)}`)
}
</script>
