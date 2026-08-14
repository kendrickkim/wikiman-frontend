<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">일반</div>
          <div class="text-grey-7 text-caption q-mt-xs">사이트 기본 모습과 작성 환경을 설정합니다.</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.siteTitle"
            outlined
            label="사이트 제목"
            hint="상단 로고와 브라우저 탭에 표시됩니다."
            maxlength="80"
          />

          <div>
            <div class="text-body2 q-mb-sm">파비콘</div>
            <div class="row items-center no-wrap q-gutter-sm">
              <img
                class="wiki-favicon-preview"
                :src="form.favicon || '/icons/favicon.svg'"
                alt="파비콘 미리보기"
              >
              <q-btn
                outline
                no-caps
                color="primary"
                icon="upload"
                label="이미지 선택"
                :loading="uploadingFavicon"
                @click="pickFavicon"
              />
              <q-btn
                flat
                no-caps
                label="기본값으로 되돌리기"
                :disable="uploadingFavicon || resettingFavicon || !form.favicon"
                :loading="resettingFavicon"
                @click="resetFavicon"
              />
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">PNG, ICO, SVG, WebP, JPEG. 최대 2MB.</div>
            <input
              ref="faviconInput"
              type="file"
              accept=".png,.ico,.svg,.webp,.jpg,.jpeg,.gif,image/png,image/x-icon,image/svg+xml,image/webp,image/jpeg,image/gif"
              style="display: none"
              @change="onFaviconPick"
            >
          </div>

          <div>
            <div class="text-body2 q-mb-sm">테마</div>
            <q-btn-toggle
              v-model="form.theme"
              unelevated
              no-caps
              toggle-color="primary"
              :options="themeOptions"
            />
          </div>

          <div>
            <div class="text-body2 q-mb-sm">글자 스케일</div>
            <q-select
              v-model="form.fontScale"
              outlined
              dense
              emit-value
              map-options
              :options="fontScaleOptions"
              style="max-width: 220px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">기본값은 100%입니다. 모바일에서 글자가 크면 낮춰 보세요.</div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">카테고리 트리</div>
            <q-btn-toggle
              v-model="form.categoryTreeExpand"
              unelevated
              no-caps
              toggle-color="primary"
              :spread="!isDesktop"
              :options="treeExpandOptions"
            />
            <div class="text-caption text-grey-7 q-mt-xs">왼쪽 메뉴 카테고리의 기본 펼침 상태입니다.</div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">기본 작성 방식</div>
            <q-btn-toggle
              v-model="form.defaultEditor"
              unelevated
              no-caps
              toggle-color="primary"
              :spread="!isDesktop"
              :options="editorOptions"
            />
          </div>

          <q-input
            v-model="form.plantumlServer"
            outlined
            label="PlantUML 서버"
            hint="Markdown의 plantuml 코드 블록을 그릴 서버 주소입니다."
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" label="설정 저장" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { EDITOR_OPTIONS } from '@/utils/editors'

const $q = useQuasar()
const { isDesktop } = useLayout()
const settings = useSettingsStore()
const saving = ref(false)
const uploadingFavicon = ref(false)
const resettingFavicon = ref(false)
const faviconInput = ref(null)
const error = ref('')
const form = reactive({
  siteTitle: settings.siteTitle,
  theme: settings.theme,
  plantumlServer: settings.plantumlServer,
  defaultEditor: settings.defaultEditor,
  favicon: settings.favicon,
  categoryTreeExpand: settings.categoryTreeExpand,
  fontScale: settings.fontScale
})

const themeOptions = [
  { label: '밝은', value: 'light', icon: 'light_mode' },
  { label: '어두운', value: 'dark', icon: 'dark_mode' }
]
const treeExpandOptions = [
  { label: '모두 펼침', value: 'expanded' },
  { label: '모두 접힘', value: 'collapsed' },
  { label: '1단계만 펼침', value: 'root' }
]
const fontScaleOptions = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120].map((value) => ({
  label: value === 100 ? '100% (기본)' : `${value}%`,
  value
}))
const editorOptions = EDITOR_OPTIONS

onMounted(async () => {
  await settings.ensureLoaded()
  form.siteTitle = settings.siteTitle
  form.theme = settings.theme
  form.plantumlServer = settings.plantumlServer
  form.defaultEditor = settings.defaultEditor
  form.favicon = settings.favicon
  form.categoryTreeExpand = settings.categoryTreeExpand
  form.fontScale = settings.fontScale
})

function pickFavicon() {
  faviconInput.value?.click()
}

async function onFaviconPick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: '파비콘은 2MB를 넘을 수 없습니다.' })
    return
  }
  uploadingFavicon.value = true
  error.value = ''
  try {
    const data = new FormData()
    data.append('image', file)
    const { data: uploaded } = await api.post('/uploads/favicon', data)
    form.favicon = uploaded.url
  } catch (err) {
    error.value = getErrorMessage(err, '파비콘을 올리지 못했습니다.')
  } finally {
    uploadingFavicon.value = false
  }
}

async function resetFavicon() {
  if (!form.favicon || resettingFavicon.value) return
  resettingFavicon.value = true
  error.value = ''
  try {
    await settings.save({ favicon: '' })
    form.favicon = ''
    $q.notify({ type: 'positive', message: '파비콘을 기본값으로 되돌렸습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err, '파비콘을 되돌리지 못했습니다.')
  } finally {
    resettingFavicon.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await settings.save({
      siteTitle: form.siteTitle,
      theme: form.theme,
      plantumlServer: form.plantumlServer,
      defaultEditor: form.defaultEditor,
      favicon: form.favicon,
      categoryTreeExpand: form.categoryTreeExpand,
      fontScale: form.fontScale
    })
    $q.notify({ type: 'positive', message: '설정을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>
