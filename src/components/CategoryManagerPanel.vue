<template>
  <div ref="panelRoot" class="row q-col-gutter-md">
    <div class="col-12 col-md-5">
      <div class="category-manager-tree" :style="paneStyle">
        <q-tree
          :nodes="treeNodes"
          node-key="id"
          selected-color="primary"
          v-model:selected="selectedId"
          tick-strategy="strict"
          v-model:ticked="tickedIds"
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
    </div>

    <div class="col-12 col-md-7">
      <div class="category-manager-form" :style="paneStyle">
      <template v-if="tickedIds.length">
        <div class="wiki-half">
          <div class="category-manager-bulk">
            <div class="row items-center">
              <div class="text-subtitle2 col">체크한 카테고리 {{ tickedIds.length }}개</div>
              <q-btn flat dense no-caps label="선택 해제" :disable="bulkWorking" @click="tickedIds = []" />
            </div>
            <CategoryTreeSelect
              v-model="bulkParentId"
              label="이동할 상위 카테고리"
              dense
              :blocked-ids="bulkBlockedIds"
              :disable="bulkWorking"
              class="q-mt-sm"
            />
            <div class="wiki-btn-row q-mt-sm">
              <q-btn
                color="primary"
                unelevated
                no-caps
                label="한번에 이동"
                :loading="bulkWorking"
                @click="bulkMove"
              />
              <q-btn
                color="negative"
                outline
                no-caps
                label="한번에 삭제"
                :disable="bulkWorking"
                @click="bulkRemove"
              />
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              삭제하면 각 카테고리의 하위 카테고리와 글은 상위 카테고리로 옮겨집니다.
            </div>
          </div>
        </div>
        <q-separator class="q-my-lg" />
      </template>

      <div class="wiki-half">
        <q-form @submit.prevent="createCategory">
          <div class="text-subtitle2">새 카테고리</div>
          <q-input v-model="createName" dense outlined label="이름" class="q-mt-sm" />
          <CategoryTreeSelect
            v-model="createParentId"
            label="상위 카테고리"
            dense
            class="q-mt-sm"
          />
          <div class="q-mt-sm">
            <div class="text-body2 q-mb-xs">공개 범위</div>
            <q-btn-toggle
              v-model="createVisibility"
              unelevated
              no-caps
              toggle-color="primary"
              class="wiki-visibility-toggle"
              :options="visibilityOptions"
            />
          </div>
          <q-btn type="submit" color="primary" label="추가" unelevated class="q-mt-md" />
        </q-form>
      </div>

      <q-separator class="q-my-lg" />

      <template v-if="selected">
        <div class="wiki-split">
          <div>
            <div class="text-subtitle2">선택한 카테고리 수정/삭제</div>
            <q-input v-model="editName" dense outlined label="이름" class="q-mt-sm" />
            <div class="q-mt-sm">
              <div class="text-body2 q-mb-xs">공개 범위</div>
              <q-btn-toggle
                v-model="editVisibility"
                unelevated
                no-caps
                toggle-color="primary"
                class="wiki-visibility-toggle"
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
          </div>

          <div>
            <div class="text-subtitle2">카테고리 이동</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              현재 위치: {{ currentLocationLabel }}
            </div>
            <CategoryTreeSelect
              v-model="editParentId"
              label="이동할 상위 카테고리"
              dense
              :blocked-ids="selectedBlockedIds"
              class="q-mt-sm"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              다른 카테고리의 하위로 옮기거나, 최상위로 이동할 수 있습니다.
            </div>
            <q-btn
              class="q-mt-sm"
              color="primary"
              unelevated
              label="이동"
              :disable="!canMove"
              @click="moveCategory"
            />
          </div>
        </div>

        <q-separator class="q-my-lg" />

        <div class="text-subtitle2">글 일괄 이동</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          이 카테고리에 속한 글을 다른 카테고리(또는 미분류)로 옮깁니다.
          현재 {{ postMoveCount }}개.
        </div>
        <CategoryTreeSelect
          v-model="postTargetCategoryId"
          label="이동할 카테고리"
          dense
          root-label="미분류"
          empty-icon="folder_off"
          :empty-value="null"
          class="q-mt-sm"
        />
        <q-toggle
          v-model="postIncludeDescendants"
          class="q-mt-sm"
          dense
          color="primary"
          label="하위 카테고리의 글도 함께 이동"
        />
        <div class="q-mt-md">
          <q-btn
            color="primary"
            outline
            unelevated
            no-caps
            label="글 이동"
            :loading="postMoving"
            :disable="!canMovePosts"
            @click="movePosts"
          />
        </div>
      </template>
      <div v-else class="text-grey-7">{{ $q.screen.lt.md ? '위에서 카테고리를 선택하세요.' : '왼쪽에서 카테고리를 선택하세요.' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useWikiStore } from '@/stores/wiki'
import CategoryTreeSelect from './CategoryTreeSelect.vue'

const emit = defineEmits(['saved'])

const $q = useQuasar()
const wiki = useWikiStore()
const selectedId = ref(null)
const tickedIds = ref([])
const bulkParentId = ref(0)
const bulkWorking = ref(false)
const createName = ref('')
const createParentId = ref(0)
const createVisibility = ref('public')
const editName = ref('')
const editParentId = ref(0)
const editVisibility = ref('public')
const postTargetCategoryId = ref(null)
const postIncludeDescendants = ref(false)
const postMoving = ref(false)
const postStats = ref({ direct: 0, withDescendants: 0 })
const panelRoot = ref(null)
const paneMaxHeight = ref('')
const paneStyle = computed(() => (
  paneMaxHeight.value ? { maxHeight: paneMaxHeight.value } : null
))

const visibilityOptions = [
  { label: '공개', value: 'public' },
  { label: '비공개', value: 'private' }
]

const selected = computed(() => wiki.categories.find((c) => c.id === Number(selectedId.value)) || null)
const treeNodes = computed(() => wiki.tree)

function descendantIdSet(categoryId) {
  const children = new Map()
  for (const category of wiki.categories) {
    const key = category.parent_id ?? 0
    if (!children.has(key)) children.set(key, [])
    children.get(key).push(category.id)
  }
  const ids = new Set()
  const stack = [Number(categoryId)]
  while (stack.length) {
    const current = stack.pop()
    if (!Number.isFinite(current) || ids.has(current)) continue
    ids.add(current)
    for (const child of children.get(current) || []) stack.push(child)
  }
  return ids
}

const selectedBlockedIds = computed(() => (
  selected.value ? descendantIdSet(selected.value.id) : new Set()
))

const bulkBlockedIds = computed(() => {
  // 선택한 카테고리 자신과 그 하위로는 이동할 수 없습니다(순환 방지)
  const blocked = new Set()
  for (const id of tickedIds.value) {
    for (const item of descendantIdSet(id)) blocked.add(item)
  }
  return blocked
})

const currentLocationLabel = computed(() => {
  if (!selected.value) return ''
  if (selected.value.parent_id == null) return '최상위'
  const parent = wiki.categories.find((category) => category.id === selected.value.parent_id)
  return parent ? `${parent.name} 하위` : '최상위'
})

const canMove = computed(() => {
  if (!selected.value) return false
  const current = selected.value.parent_id ?? 0
  return Number(editParentId.value || 0) !== Number(current)
})

const postMoveCount = computed(() => (
  postIncludeDescendants.value
    ? postStats.value.withDescendants
    : postStats.value.direct
))

const canMovePosts = computed(() => {
  if (!selected.value || postMoving.value) return false
  if (postMoveCount.value <= 0) return false
  const target = postTargetCategoryId.value
  if (target == null) return true
  return Number(target) !== Number(selected.value.id) || postIncludeDescendants.value
})

watch(selected, (value) => {
  editName.value = value?.name || ''
  editParentId.value = value?.parent_id ?? 0
  editVisibility.value = value?.visibility === 'private' ? 'private' : 'public'
  postTargetCategoryId.value = null
  postIncludeDescendants.value = false
  postStats.value = { direct: 0, withDescendants: 0 }
  if (value) loadPostStats(value.id)
})

async function loadPostStats(categoryId) {
  try {
    const { data } = await api.get(`/categories/${categoryId}/post-stats`)
    postStats.value = {
      direct: Number(data.direct) || 0,
      withDescendants: Number(data.withDescendants) || 0
    }
  } catch {
    postStats.value = { direct: 0, withDescendants: 0 }
  }
}

function toParentId(value) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

let paneObserver = null

function fitPaneHeight() {
  const el = panelRoot.value
  if (!el) {
    paneMaxHeight.value = ''
    return
  }
  if (!$q.screen.gt.sm) {
    paneMaxHeight.value = ''
    return
  }
  const top = el.getBoundingClientRect().top
  const bottomSpace = 72
  const height = Math.floor(window.innerHeight - top - bottomSpace)
  paneMaxHeight.value = `${Math.max(200, height)}px`
}

onMounted(() => {
  fitPaneHeight()
  paneObserver = new ResizeObserver(() => fitPaneHeight())
  if (panelRoot.value) paneObserver.observe(panelRoot.value)
  window.addEventListener('resize', fitPaneHeight)
})

onBeforeUnmount(() => {
  paneObserver?.disconnect()
  paneObserver = null
  window.removeEventListener('resize', fitPaneHeight)
})

watch(() => $q.screen.gt.sm, fitPaneHeight)
watch(() => wiki.categories.length, fitPaneHeight)
watch(selectedId, fitPaneHeight)
watch(() => tickedIds.value.length, fitPaneHeight)

watch(bulkBlockedIds, (blocked) => {
  if (blocked.has(Number(bulkParentId.value))) bulkParentId.value = 0
})

async function notifyError(err) {
  $q.notify({ type: 'negative', message: getErrorMessage(err) })
}

async function reload() {
  await wiki.ensureLoaded({ force: true })
  emit('saved')
}

async function createCategory() {
  if (!createName.value.trim()) return
  try {
    await api.post('/categories', {
      name: createName.value.trim(),
      parentId: toParentId(createParentId.value),
      visibility: createVisibility.value
    })
    createName.value = ''
    createParentId.value = 0
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
      visibility: editVisibility.value
    })
    await reload()
    $q.notify({ type: 'positive', message: '카테고리를 저장했습니다.' })
  } catch (err) {
    notifyError(err)
  }
}

async function moveCategory() {
  if (!selected.value || !canMove.value) return
  const parentId = toParentId(editParentId.value)
  const targetLabel = parentId
    ? wiki.categories.find((category) => category.id === parentId)?.name || '선택한 카테고리'
    : '최상위'
  try {
    await api.patch(`/categories/${selected.value.id}`, { parentId })
    await reload()
    $q.notify({
      type: 'positive',
      message: parentId ? `"${targetLabel}" 아래로 이동했습니다.` : '최상위로 이동했습니다.'
    })
  } catch (err) {
    notifyError(err)
  }
}

function movePosts() {
  if (!selected.value || !canMovePosts.value) return
  const targetId = postTargetCategoryId.value == null ? null : Number(postTargetCategoryId.value)
  const targetLabel = targetId
    ? wiki.categories.find((category) => category.id === targetId)?.name || '선택한 카테고리'
    : '미분류'
  const scope = postIncludeDescendants.value ? '하위 카테고리 포함' : '이 카테고리만'
  $q.dialog({
    title: '글 일괄 이동',
    message: `"${selected.value.name}"의 글 ${postMoveCount.value}개(${scope})를 "${targetLabel}"(으)로 옮길까요?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    postMoving.value = true
    try {
      const { data } = await api.post(`/categories/${selected.value.id}/reassign-posts`, {
        targetCategoryId: targetId,
        includeDescendants: postIncludeDescendants.value
      })
      await loadPostStats(selected.value.id)
      emit('saved')
      $q.notify({
        type: 'positive',
        message: `${data.moved || 0}개 글을 "${targetLabel}"(으)로 옮겼습니다.`
      })
    } catch (err) {
      notifyError(err)
    } finally {
      postMoving.value = false
    }
  })
}

function tickedCategoryIds() {
  const known = new Set(wiki.categories.map((category) => category.id))
  return tickedIds.value.map(Number).filter((id) => known.has(id))
}

async function bulkMove() {
  const ids = tickedCategoryIds()
  if (!ids.length) return
  const parentId = toParentId(bulkParentId.value)
  if (parentId && bulkBlockedIds.value.has(parentId)) {
    $q.notify({ type: 'negative', message: '선택한 카테고리의 하위로는 이동할 수 없습니다.' })
    return
  }
  const targetLabel = parentId
    ? wiki.categories.find((category) => category.id === parentId)?.name || '선택한 카테고리'
    : '최상위'
  bulkWorking.value = true
  let moved = 0
  try {
    for (const id of ids) {
      await api.patch(`/categories/${id}`, { parentId })
      moved += 1
    }
    tickedIds.value = []
    bulkParentId.value = 0
    await reload()
    $q.notify({
      type: 'positive',
      message: parentId
        ? `${moved}개 카테고리를 "${targetLabel}" 아래로 이동했습니다.`
        : `${moved}개 카테고리를 최상위로 이동했습니다.`
    })
  } catch (err) {
    await reload()
    $q.notify({ type: 'negative', message: `${moved}개 이동 후 실패했습니다. ${getErrorMessage(err)}` })
  } finally {
    bulkWorking.value = false
  }
}

function bulkRemove() {
  const ids = tickedCategoryIds()
  if (!ids.length) return
  $q.dialog({
    title: '카테고리 일괄 삭제',
    message: `선택한 ${ids.length}개 카테고리를 삭제할까요? 각 카테고리의 하위 카테고리와 글은 상위 카테고리로 옮겨집니다.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    bulkWorking.value = true
    let removed = 0
    try {
      for (const id of ids) {
        await api.delete(`/categories/${id}`)
        removed += 1
      }
      if (ids.includes(Number(selectedId.value))) selectedId.value = null
      tickedIds.value = []
      await reload()
      $q.notify({ type: 'positive', message: `${removed}개 카테고리를 삭제했습니다.` })
    } catch (err) {
      await reload()
      $q.notify({ type: 'negative', message: `${removed}개 삭제 후 실패했습니다. ${getErrorMessage(err)}` })
    } finally {
      bulkWorking.value = false
    }
  })
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

<style scoped>
.category-manager-tree {
  max-height: 50vh;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.category-manager-form {
  overflow: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.category-manager-bulk {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #bfd4f0;
  background: #eef4fb;
}

.body--dark .category-manager-tree {
  border-color: #3a4149;
}

.body--dark .category-manager-bulk {
  border-color: #3d5570;
  background: #243142;
}

.wiki-visibility-toggle :deep(.q-btn) {
  min-height: 36px;
  padding: 6px 14px;
  margin-right: 6px;
}

.wiki-visibility-toggle :deep(.q-btn:last-child) {
  margin-right: 0;
}

.wiki-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.wiki-half {
  width: 100%;
}

.wiki-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 1024px) {
  .wiki-split {
    grid-template-columns: 1fr 1fr;
  }

  .wiki-half {
    width: 50%;
    max-width: 50%;
  }
}
</style>
