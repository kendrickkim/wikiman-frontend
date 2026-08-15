<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">상단 메뉴바</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          사이트 제목 바로 아래에 표시할 메뉴를 만듭니다. 글을 연결하거나 URL을 직접 입력할 수 있습니다.
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row items-center justify-between q-gutter-sm">
          <div>
            <div class="text-body2">상단 메뉴 표시</div>
            <div class="text-caption text-grey-7">끄면 메뉴 항목은 유지되고 화면에서만 숨깁니다.</div>
          </div>
          <q-toggle
            v-model="topMenuVisible"
            color="primary"
            :label="topMenuVisible ? '보이기' : '숨기기'"
            :disable="loading || togglingVisible"
            @update:model-value="saveVisibility"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="loading" class="flex flex-center q-pa-lg">
          <q-spinner color="primary" size="32px" />
        </div>

        <template v-else>
          <div class="row q-col-gutter-md items-start">
            <div class="col-12 col-md-3">
              <q-input
                v-model="newItem.label"
                outlined
                dense
                label="메뉴명"
                maxlength="30"
                counter
              />
            </div>
            <div class="col-12 col-md-2">
              <q-btn-toggle
                v-model="newItem.linkType"
                class="full-width wiki-link-type-toggle"
                unelevated
                toggle-color="primary"
                :options="linkTypeOptions"
              />
            </div>
            <div class="col-12 col-md-5">
              <q-select
                v-if="newItem.linkType === 'post'"
                v-model="newItem.postId"
                outlined
                dense
                emit-value
                map-options
                use-input
                fill-input
                hide-selected
                input-debounce="150"
                label="연결할 글"
                :options="filteredPostOptions"
                option-value="id"
                option-label="label"
                @filter="filterPosts"
              />
              <q-input
                v-else
                v-model="newItem.url"
                outlined
                dense
                label="URL"
                hint="예: /posts/1 또는 https://example.com"
                maxlength="500"
              />
            </div>
            <div class="col-12 col-md-2">
              <q-btn
                class="full-width"
                unelevated
                no-caps
                color="primary"
                icon="add"
                label="메뉴 추가"
                :disable="!canAdd || saving"
                @click="addItem"
              />
            </div>
          </div>

          <q-card
            v-if="!items.length"
            flat
            bordered
            class="q-pa-md q-mt-lg text-grey-7 text-center"
          >
            등록된 상단 메뉴가 없습니다.
          </q-card>

          <q-list v-else bordered separator class="rounded-borders q-mt-lg">
            <q-item v-for="(item, index) in items" :key="item.key">
              <q-item-section>
                <div class="row q-col-gutter-sm items-start">
                  <div class="col-12 col-md-3">
                    <q-input
                      v-model="item.label"
                      outlined
                      dense
                      label="메뉴명"
                      maxlength="30"
                    />
                  </div>
                  <div class="col-12 col-md-2">
                    <q-btn-toggle
                      v-model="item.linkType"
                      class="full-width wiki-link-type-toggle"
                      unelevated
                      toggle-color="primary"
                      :options="linkTypeOptions"
                    />
                  </div>
                  <div class="col-12 col-md-7">
                    <q-select
                      v-if="item.linkType === 'post'"
                      v-model="item.postId"
                      outlined
                      dense
                      emit-value
                      map-options
                      use-input
                      fill-input
                      hide-selected
                      input-debounce="150"
                      label="연결할 글"
                      :options="filteredPostOptions"
                      option-value="id"
                      option-label="label"
                      @filter="filterPosts"
                    />
                    <q-input
                      v-else
                      v-model="item.url"
                      outlined
                      dense
                      label="URL"
                      hint="예: /posts/1 또는 https://example.com"
                      maxlength="500"
                    />
                  </div>
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="column q-gutter-xs">
                  <q-btn
                    flat
                    round
                    dense
                    icon="arrow_upward"
                    aria-label="위로 이동"
                    :disable="saving || index === 0"
                    @click="move(index, -1)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="arrow_downward"
                    aria-label="아래로 이동"
                    :disable="saving || index === items.length - 1"
                    @click="move(index, 1)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    aria-label="메뉴 삭제"
                    :disable="saving"
                    @click="removeAt(index)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="메뉴 저장"
          :loading="saving"
          :disable="loading"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { displayTitle } from '@/utils/title'

const $q = useQuasar()
const settings = useSettingsStore()
const items = ref([])
const postOptions = ref([])
const filteredPostOptions = ref([])
const loading = ref(false)
const saving = ref(false)
const togglingVisible = ref(false)
const topMenuVisible = ref(true)
const error = ref('')
let nextKey = 1

const linkTypeOptions = [
  { label: '글', value: 'post' },
  { label: 'URL', value: 'url' }
]

const newItem = reactive({
  label: '',
  linkType: 'post',
  postId: null,
  url: ''
})

function hasValidTarget(item) {
  if (item.linkType === 'post') {
    return Number(item.postId) > 0
  }
  return String(item.url || '').trim().length > 0
}

const canAdd = computed(() => {
  const label = newItem.label.trim()
  if (!label || label.length > 30 || items.value.length >= 20 || !hasValidTarget(newItem)) {
    return false
  }
  if (newItem.linkType === 'post') {
    const postId = Number(newItem.postId)
    return !items.value.some((item) => item.linkType === 'post' && Number(item.postId) === postId)
  }
  const url = newItem.url.trim()
  return !items.value.some((item) => item.linkType === 'url' && String(item.url || '').trim() === url)
})

function postOption(post) {
  const suffix = [
    post.status === 'draft' ? '작성중' : '',
    post.visibility === 'private' ? '비공개' : ''
  ].filter(Boolean).join(' · ')
  return {
    id: Number(post.id),
    label: suffix ? `${displayTitle(post.title)} (${suffix})` : displayTitle(post.title)
  }
}

function mapLoadedItem(item) {
  const postId = Number(item.postId)
  const url = String(item.url || '').trim()
  const isPost = Number.isInteger(postId) && postId > 0
  return {
    key: nextKey++,
    label: item.label,
    linkType: isPost ? 'post' : 'url',
    postId: isPost ? postId : null,
    url: isPost ? '' : url
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await settings.ensureLoaded()
    topMenuVisible.value = settings.topMenuVisible !== false
    const { data } = await api.get('/settings/top-menu')
    postOptions.value = (data.posts || []).map(postOption)
    filteredPostOptions.value = postOptions.value
    items.value = (data.items || []).map(mapLoadedItem)
  } catch (err) {
    error.value = getErrorMessage(err, '상단 메뉴 정보를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function saveVisibility(value) {
  togglingVisible.value = true
  error.value = ''
  try {
    await settings.save({ topMenuVisible: value === true })
    topMenuVisible.value = settings.topMenuVisible !== false
    $q.notify({
      type: 'positive',
      message: settings.topMenuVisible ? '상단 메뉴를 표시합니다.' : '상단 메뉴를 숨겼습니다.'
    })
  } catch (err) {
    topMenuVisible.value = settings.topMenuVisible !== false
    error.value = getErrorMessage(err, '상단 메뉴 표시 설정을 저장하지 못했습니다.')
  } finally {
    togglingVisible.value = false
  }
}

function filterPosts(value, update) {
  update(() => {
    const needle = String(value || '').trim().toLowerCase()
    filteredPostOptions.value = needle
      ? postOptions.value.filter((option) => option.label.toLowerCase().includes(needle))
      : postOptions.value
  })
}

function ensureMenuUrl(raw) {
  const url = String(raw || '').trim()
  if (!url) return ''
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function addItem() {
  if (!canAdd.value) return
  items.value.push({
    key: nextKey++,
    label: newItem.label.trim(),
    linkType: newItem.linkType,
    postId: newItem.linkType === 'post' ? Number(newItem.postId) : null,
    url: newItem.linkType === 'url' ? ensureMenuUrl(newItem.url) : ''
  })
  newItem.label = ''
  newItem.linkType = 'post'
  newItem.postId = null
  newItem.url = ''
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= items.value.length) return
  const [item] = items.value.splice(index, 1)
  items.value.splice(target, 0, item)
}

function removeAt(index) {
  items.value.splice(index, 1)
}

function toPayloadItem(item) {
  const label = item.label.trim()
  if (item.linkType === 'post') {
    return { label, postId: Number(item.postId) }
  }
  const url = ensureMenuUrl(item.url)
  item.url = url
  return { label, url }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload = items.value.map(toPayloadItem)
    const { data } = await api.put('/settings/top-menu', { items: payload })
    items.value = (data.items || []).map(mapLoadedItem)
    await settings.ensureLoaded({ force: true })
    $q.notify({ type: 'positive', message: '상단 메뉴를 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err, '상단 메뉴를 저장하지 못했습니다.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.wiki-link-type-toggle :deep(.q-btn) {
  padding-left: 14px;
  padding-right: 14px;
  min-height: 36px;
}
</style>
