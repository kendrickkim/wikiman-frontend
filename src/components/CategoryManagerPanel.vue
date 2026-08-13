<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-md-5">
      <q-tree
        :nodes="treeNodes"
        node-key="id"
        selected-color="primary"
        v-model:selected="selectedId"
        default-expand-all
        class="wiki-category-tree"
      >
        <template #default-header="prop">
          <div class="row items-center no-wrap full-width wiki-category-tree__row">
            <div class="ellipsis col">{{ prop.node.name || prop.node.label }}</div>
            <q-badge
              v-if="prop.node.visibility === 'private'"
              dense
              color="grey-7"
              class="q-ml-sm"
            >
              비공개
            </q-badge>
          </div>
        </template>
      </q-tree>
      <div v-if="!treeNodes.length" class="text-grey-7 q-mt-sm">아직 카테고리가 없습니다.</div>
    </div>

    <div class="col-12 col-md-7">
      <q-form class="q-gutter-sm" @submit.prevent="createCategory">
        <div class="text-subtitle2">새 카테고리</div>
        <q-input v-model="createName" dense outlined label="이름" />
        <q-select
          v-model="createParentId"
          :options="parentOptions"
          emit-value
          map-options
          dense
          outlined
          label="상위 카테고리"
          clearable
        />
        <div>
          <div class="text-body2 q-mb-xs">공개 범위</div>
          <q-btn-toggle
            v-model="createVisibility"
            unelevated
            no-caps
            dense
            toggle-color="primary"
            :options="visibilityOptions"
          />
        </div>
        <q-btn type="submit" color="primary" label="추가" unelevated />
      </q-form>

      <q-separator class="q-my-lg" />

      <template v-if="selected">
        <div class="text-subtitle2">선택한 카테고리</div>
        <q-input v-model="editName" dense outlined label="이름" class="q-mt-sm" />
        <q-select
          v-model="editParentId"
          :options="moveOptions"
          emit-value
          map-options
          dense
          outlined
          label="상위 카테고리"
          clearable
          class="q-mt-sm"
        />
        <div class="q-mt-sm">
          <div class="text-body2 q-mb-xs">공개 범위</div>
          <q-btn-toggle
            v-model="editVisibility"
            unelevated
            no-caps
            dense
            toggle-color="primary"
            :options="visibilityOptions"
          />
          <div class="text-caption text-grey-7 q-mt-xs">
            비공개 카테고리의 글은 로그인한 사용자만 목록·본문을 볼 수 있습니다.
          </div>
        </div>
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn color="primary" outline label="저장" @click="saveCategory" />
          <q-btn color="negative" flat label="삭제" @click="removeCategory" />
        </div>
      </template>
      <div v-else class="text-grey-7">{{ $q.screen.lt.md ? '위에서 카테고리를 선택하세요.' : '왼쪽에서 카테고리를 선택하세요.' }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useWikiStore } from '@/stores/wiki'

const emit = defineEmits(['saved'])

const $q = useQuasar()
const wiki = useWikiStore()
const selectedId = ref(null)
const createName = ref('')
const createParentId = ref(null)
const createVisibility = ref('public')
const editName = ref('')
const editParentId = ref(null)
const editVisibility = ref('public')

const visibilityOptions = [
  { label: '공개', value: 'public' },
  { label: '비공개', value: 'private' }
]

const selected = computed(() => wiki.categories.find((c) => c.id === Number(selectedId.value)) || null)
const treeNodes = computed(() => wiki.tree)
const parentOptions = computed(() => [
  { label: '없음 (최상위)', value: null },
  ...wiki.flatOptions.map((c) => ({ label: c.label, value: c.id }))
])
const moveOptions = computed(() => parentOptions.value.filter((opt) => opt.value !== selectedId.value))

watch(selected, (value) => {
  editName.value = value?.name || ''
  editParentId.value = value?.parent_id ?? null
  editVisibility.value = value?.visibility === 'private' ? 'private' : 'public'
})

async function notifyError(err) {
  $q.notify({ type: 'negative', message: getErrorMessage(err) })
}

async function reload() {
  await wiki.loadCategories()
  emit('saved')
}

async function createCategory() {
  if (!createName.value.trim()) return
  try {
    await api.post('/categories', {
      name: createName.value.trim(),
      parentId: createParentId.value,
      visibility: createVisibility.value
    })
    createName.value = ''
    createVisibility.value = 'public'
    await reload()
    $q.notify({ type: 'positive', message: '카테고리를 추가했습니다.' })
  } catch (err) {
    notifyError(err)
  }
}

async function saveCategory() {
  if (!selected.value) return
  try {
    await api.patch(`/categories/${selected.value.id}`, {
      name: editName.value.trim(),
      parentId: editParentId.value,
      visibility: editVisibility.value
    })
    await reload()
    $q.notify({ type: 'positive', message: '카테고리를 저장했습니다.' })
  } catch (err) {
    notifyError(err)
  }
}

function removeCategory() {
  if (!selected.value) return
  $q.dialog({
    title: '카테고리 삭제',
    message: `"${selected.value.name}"를 삭제할까요? 하위 카테고리와 글은 상위 카테고리로 옮겨집니다.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/categories/${selected.value.id}`)
      selectedId.value = null
      await reload()
      $q.notify({ type: 'positive', message: '카테고리를 삭제했습니다.' })
    } catch (err) {
      notifyError(err)
    }
  })
}
</script>
