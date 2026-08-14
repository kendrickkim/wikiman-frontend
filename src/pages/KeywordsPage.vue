<template>
  <q-page class="wiki-page wiki-page--article">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">
        키워드
      </div>

      <q-input
        v-model="filter"
        outlined
        dense
        clearable
        debounce="200"
        placeholder="키워드 찾기"
        class="q-mb-md"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>
      <q-banner v-else-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>
      <q-card v-else-if="!filteredItems.length" flat bordered class="q-pa-lg text-center text-grey-7">
        표시할 키워드가 없습니다.
      </q-card>
      <div v-else class="keyword-list">
        <q-btn
          v-for="item in filteredItems"
          :key="item.name"
          outline
          no-caps
          color="primary"
          class="keyword-list__item"
          @click="openKeyword(item.name)"
        >
          <span class="ellipsis">{{ item.name }}</span>
          <q-badge rounded color="primary" class="q-ml-sm">{{ item.count }}</q-badge>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'

const router = useRouter()
const { isDesktop } = useLayout()
const items = ref([])
const filter = ref('')
const loading = ref(false)
const error = ref('')

const filteredItems = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  if (!needle) return items.value
  return items.value.filter((item) => item.name.toLowerCase().includes(needle))
})

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/posts/keywords')
    items.value = Array.isArray(data.keywordItems)
      ? data.keywordItems
      : (data.keywords || []).map((name) => ({ name, count: 0 }))
  } catch (err) {
    error.value = getErrorMessage(err, '키워드를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
})

function openKeyword(keyword) {
  router.push(`/keyword/${encodeURIComponent(keyword)}`)
}
</script>

<style scoped>
.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword-list__item {
  max-width: 100%;
}
</style>
