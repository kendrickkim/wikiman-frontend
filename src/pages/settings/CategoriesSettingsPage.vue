<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">카테고리</div>
      <div class="text-grey-7 text-caption q-mt-xs">추가, 이름 변경, 이동, 삭제를 여기서 할 수 있습니다.</div>
    </q-card-section>
    <q-card-section>
      <CategoryManagerPanel />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { onMounted } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import CategoryManagerPanel from '@/components/CategoryManagerPanel.vue'

const wiki = useWikiStore()

onMounted(() => {
  wiki.loadCategories()
})
</script>
