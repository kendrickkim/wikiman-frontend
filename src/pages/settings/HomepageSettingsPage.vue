<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">홈페이지 글 순서</div>
        <div class="text-grey-7 text-caption q-mt-xs">
          홈에 표시되는 글의 순서를 바꿉니다. 글 편집에서 「홈페이지로 사용」을 켠 글만 여기에 나타납니다.
        </div>
      </q-card-section>
      <q-card-section>
        <div v-if="loading" class="flex flex-center q-pa-md">
          <q-spinner color="primary" />
        </div>
        <q-card v-else-if="!items.length" flat bordered class="q-pa-md text-grey-7 text-center">
          홈페이지로 지정된 글이 없습니다.
        </q-card>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="(item, index) in items" :key="item.id">
            <q-item-section>
              <q-item-label>{{ displayTitle(item.title) }}</q-item-label>
              <q-item-label caption>순서 {{ index + 1 }} · #{{ item.id }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row no-wrap q-gutter-xs">
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_upward"
                  :disable="saving || index === 0"
                  @click="move(index, -1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_downward"
                  :disable="saving || index === items.length - 1"
                  @click="move(index, 1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="close"
                  :disable="saving"
                  @click="removeAt(index)"
                >
                  <q-tooltip>홈에서 제거</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import { displayTitle } from '@/utils/title'

const $q = useQuasar()
const settings = useSettingsStore()
const items = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/posts/homepage')
    items.value = (data.posts || []).map((post) => ({
      id: post.id,
      title: post.title
    }))
  } catch (err) {
    error.value = getErrorMessage(err, '홈페이지 글 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function persist(nextItems) {
  saving.value = true
  error.value = ''
  const previous = items.value
  items.value = nextItems
  try {
    const { data } = await api.put('/posts/homepage/order', {
      postIds: nextItems.map((item) => item.id)
    })
    settings.homePostIds = data.homePostIds || []
    settings.hasHomepage = data.hasHomepage === true || settings.homePostIds.length > 0
    $q.notify({ type: 'positive', message: '홈페이지 순서를 저장했습니다.' })
  } catch (err) {
    items.value = previous
    error.value = getErrorMessage(err, '순서를 저장하지 못했습니다.')
  } finally {
    saving.value = false
  }
}

function move(index, delta) {
  const next = [...items.value]
  const target = index + delta
  if (target < 0 || target >= next.length) return
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  persist(next)
}

function removeAt(index) {
  const next = items.value.filter((_, i) => i !== index)
  persist(next)
}

onMounted(load)
</script>
