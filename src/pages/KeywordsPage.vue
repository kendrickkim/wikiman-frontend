<template>
  <q-page class="wiki-page wiki-page--article">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">{{ t('nav.keywords') }}</div>

      <q-input
        v-model="filter"
        outlined
        dense
        clearable
        debounce="200"
        :placeholder="t('remaining.k070')"
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
      <q-card v-else-if="!filteredItems.length" flat bordered class="q-pa-lg text-center text-grey-7">{{ t('remaining.k072') }}</q-card>
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
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useWikiStore } from '@/stores/wiki'

const router = useRouter()
const { isDesktop } = useLayout()
const wiki = useWikiStore()
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
    await wiki.ensureKeywords({ force: true })
    items.value = wiki.keywords
  } catch (err) {
    error.value = getErrorMessage(err, t('remaining.k071'))
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
