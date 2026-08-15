<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">블로그</div>
          <div class="text-grey-7 text-caption q-mt-xs">
            홈페이지를 최근 발행 글 본문 피드로 표시하는 블로그 모드를 설정합니다.
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-lg">
          <div>
            <q-toggle
              v-model="blogShowHomepage"
              label="홈페이지로 설정한 글 표시"
              color="primary"
              :disable="!blogMode"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              켜면 블로그 피드 맨 위에 홈페이지로 지정한 글을 먼저 보여 줍니다.
            </div>
          </div>

          <div>
            <q-toggle
              v-model="blogMode"
              label="블로그 모드"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              켜면 홈페이지에 지정 글 대신 최근 발행 글의 본문을 순서대로 표시합니다.
            </div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">한 페이지에 표시할 포스트 수</div>
            <q-input
              v-model.number="blogPostsPerPage"
              type="number"
              outlined
              dense
              :disable="!blogMode"
              :min="1"
              :max="100"
              style="max-width: 220px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              블로그 모드 홈에서 한 번에 보여줄 글 개수입니다. 1~100.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" label="설정 저장" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'

const $q = useQuasar()
const settings = useSettingsStore()
const blogMode = ref(settings.blogMode)
const blogShowHomepage = ref(settings.blogShowHomepage)
const blogPostsPerPage = ref(settings.blogPostsPerPage)
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  await settings.ensureLoaded()
  blogMode.value = settings.blogMode
  blogShowHomepage.value = settings.blogShowHomepage
  blogPostsPerPage.value = settings.blogPostsPerPage
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await settings.save({
      blogMode: blogMode.value,
      blogShowHomepage: blogShowHomepage.value,
      blogPostsPerPage: blogPostsPerPage.value
    })
    blogMode.value = settings.blogMode
    blogShowHomepage.value = settings.blogShowHomepage
    blogPostsPerPage.value = settings.blogPostsPerPage
    $q.notify({ type: 'positive', message: '블로그 설정을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>
