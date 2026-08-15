<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">간단 포스트</div>
          <div class="text-grey-7 text-caption q-mt-xs">
            모바일에서 빠르게 메모를 저장하는 간단 포스트 기능을 설정합니다.
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-lg">
          <div>
            <q-toggle
              v-model="mobileQuickPostEnabled"
              label="모바일에서 간단 입력 화면 사용"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              켜면 모바일 홈 상단에 접을 수 있는 간단 입력창이 표시됩니다.
            </div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">포스트 이동 시 에디터</div>
            <q-select
              v-model="promoteEditor"
              outlined
              emit-value
              map-options
              :options="promoteEditorOptions"
              style="max-width: 360px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              일반 포스트로 옮길 때 사용할 작성 방식입니다.
            </div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">포스트 이동 후 원본 처리</div>
            <q-select
              v-model="promoteSourceMode"
              outlined
              emit-value
              map-options
              :options="promoteSourceOptions"
              style="max-width: 360px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              간단 포스트를 일반 포스트로 옮긴 뒤 원본을 어떻게 처리할지 정합니다.
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
import { EDITOR_OPTIONS } from '@/utils/editors'

const $q = useQuasar()
const settings = useSettingsStore()
const mobileQuickPostEnabled = ref(settings.mobileQuickPostEnabled)
const promoteEditor = ref(settings.quickPostPromoteEditor)
const promoteSourceMode = ref(settings.quickPostPromoteSourceMode)
const saving = ref(false)
const error = ref('')
const promoteEditorOptions = [
  { label: '이동할 때마다 선택', value: 'ask' },
  ...EDITOR_OPTIONS
]
const promoteSourceOptions = [
  { label: '이동할 때마다 선택', value: 'ask' },
  { label: '이동 후 삭제', value: 'delete' },
  { label: '원본 유지', value: 'keep' }
]

onMounted(async () => {
  await settings.ensureLoaded()
  mobileQuickPostEnabled.value = settings.mobileQuickPostEnabled
  promoteEditor.value = settings.quickPostPromoteEditor
  promoteSourceMode.value = settings.quickPostPromoteSourceMode
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await settings.save({
      mobileQuickPostEnabled: mobileQuickPostEnabled.value,
      quickPostPromoteEditor: promoteEditor.value,
      quickPostPromoteSourceMode: promoteSourceMode.value
    })
    mobileQuickPostEnabled.value = settings.mobileQuickPostEnabled
    promoteEditor.value = settings.quickPostPromoteEditor
    promoteSourceMode.value = settings.quickPostPromoteSourceMode
    $q.notify({ type: 'positive', message: '간단 포스트 설정을 저장했습니다.' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>
