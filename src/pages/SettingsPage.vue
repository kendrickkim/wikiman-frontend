<template>
  <q-page class="wiki-page">
    <div class="wiki-main">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">사이트 관리</div>

      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

      <q-form @submit.prevent="save">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium">일반</div>
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

      <q-card id="categories" flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">카테고리</div>
          <div class="text-grey-7 text-caption q-mt-xs">추가, 이름 변경, 이동, 삭제를 여기서 할 수 있습니다.</div>
        </q-card-section>
        <q-card-section>
          <CategoryManagerPanel />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { useWikiStore } from '@/stores/wiki'
import CategoryManagerPanel from '@/components/CategoryManagerPanel.vue'
import { EDITOR_OPTIONS } from '@/utils/editors'

const $q = useQuasar()
const { isDesktop } = useLayout()
const settings = useSettingsStore()
const wiki = useWikiStore()
const saving = ref(false)
const error = ref('')
const form = reactive({
  siteTitle: settings.siteTitle,
  theme: settings.theme,
  plantumlServer: settings.plantumlServer,
  defaultEditor: settings.defaultEditor
})

const themeOptions = [
  { label: '밝은', value: 'light', icon: 'light_mode' },
  { label: '어두운', value: 'dark', icon: 'dark_mode' }
]
const editorOptions = EDITOR_OPTIONS

onMounted(async () => {
  await Promise.all([settings.load(), wiki.loadCategories()])
  form.siteTitle = settings.siteTitle
  form.theme = settings.theme
  form.plantumlServer = settings.plantumlServer
  form.defaultEditor = settings.defaultEditor
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await settings.save({
      siteTitle: form.siteTitle,
      theme: form.theme,
      plantumlServer: form.plantumlServer,
      defaultEditor: form.defaultEditor
    })
    $q.notify({ type: 'positive', message: '설정을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>
