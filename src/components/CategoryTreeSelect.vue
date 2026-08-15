<template>
  <q-field
    :model-value="selectedKey"
    class="category-tree-select"
    :label="label || undefined"
    :dense="dense"
    :disable="disable"
    outlined
    stack-label
  >
    <template #prepend>
      <q-icon :name="hasSelection ? 'folder' : emptyIcon" size="18px" />
    </template>
    <template #control>
      <div
        class="self-center full-width no-outline ellipsis"
        :class="{ 'text-grey-7': !hasSelection && !selectedLabel }"
        tabindex="0"
        role="button"
      >
        {{ displayLabel }}
      </div>
    </template>
    <template #append>
      <q-icon name="arrow_drop_down" />
    </template>

    <q-menu v-if="!disable" v-model="open" fit cover anchor="bottom left" self="top left">
      <div class="category-tree-select__menu">
        <q-input
          v-model="filter"
          dense
          outlined
          clearable
          placeholder="카테고리 검색"
          class="q-mb-xs"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-list dense>
          <q-item
            v-close-popup
            clickable
            :active="!hasSelection"
            active-class="text-primary"
            @click="pickEmpty"
          >
            <q-item-section avatar>
              <q-icon :name="emptyIcon" size="18px" />
            </q-item-section>
            <q-item-section>{{ rootLabel }}</q-item-section>
          </q-item>
        </q-list>

        <q-separator class="q-my-xs" />

        <div class="category-tree-select__tree">
          <q-tree
            v-if="nodes.length"
            :nodes="nodes"
            node-key="id"
            :filter="filter || undefined"
            :selected="selectedKey"
            selected-color="primary"
            default-expand-all
            @update:selected="onSelect"
          >
            <template #default-header="prop">
              <div class="row items-center no-wrap full-width">
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
          <div v-else class="text-grey-7 q-pa-sm">선택할 수 있는 카테고리가 없습니다.</div>
        </div>
      </div>
    </q-menu>
  </q-field>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useWikiStore } from '@/stores/wiki'
import { findCategoryPath, pruneCategoryTree } from '@/utils/categories'

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  label: { type: String, default: '' },
  blockedIds: { type: [Array, Set], default: () => [] },
  dense: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
  rootLabel: { type: String, default: '최상위' },
  emptyValue: { default: 0 },
  emptyIcon: { type: String, default: 'home' }
})
const emit = defineEmits(['update:modelValue'])

const wiki = useWikiStore()
const open = ref(false)
const filter = ref('')

const nodes = computed(() => pruneCategoryTree(wiki.tree, props.blockedIds))

const hasSelection = computed(() => {
  const id = Number(props.modelValue)
  return Number.isFinite(id) && id > 0
})

const selectedKey = computed(() => (hasSelection.value ? Number(props.modelValue) : null))

const selectedLabel = computed(() => {
  if (!hasSelection.value) return ''
  const names = findCategoryPath(wiki.categories, Number(props.modelValue))
  return names.length ? names.join(' › ') : ''
})

const displayLabel = computed(() => selectedLabel.value || props.rootLabel)

watch(open, (value) => {
  if (!value) filter.value = ''
})

function pickEmpty() {
  emit('update:modelValue', props.emptyValue)
  open.value = false
}

function pick(id) {
  emit('update:modelValue', Number(id) || props.emptyValue)
  open.value = false
}

function onSelect(key) {
  if (key == null) return
  pick(key)
}
</script>

<style scoped>
.category-tree-select {
  cursor: pointer;
}

.category-tree-select__menu {
  min-width: 280px;
  max-width: min(420px, 92vw);
  padding: 8px;
}

.category-tree-select__tree {
  max-height: 280px;
  overflow: auto;
  overscroll-behavior: contain;
}
</style>
