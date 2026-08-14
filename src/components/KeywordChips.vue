<template>
  <div v-if="keywords.length" class="wiki-keywords" :class="{ 'wiki-keywords--nowrap': !wrap }">
    <q-btn
      v-for="keyword in keywords"
      :key="keyword"
      :to="`/keyword/${encodeURIComponent(keyword)}`"
      outline
      dense
      no-caps
      color="primary"
      size="sm"
      :label="keyword"
      class="wiki-keyword-chip"
      @click.stop
    />
  </div>
</template>

<script setup>
defineProps({
  keywords: { type: Array, default: () => [] },
  wrap: { type: Boolean, default: true }
})
</script>
