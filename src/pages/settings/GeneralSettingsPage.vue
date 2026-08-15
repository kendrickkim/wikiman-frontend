<template>
  <div class="q-gutter-md">
    <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ t('settings.general') }}</div>
          <div class="text-grey-7 text-caption q-mt-xs">{{ t('settings.generalDescription') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.siteTitle"
            outlined
            :label="t('settings.siteTitle')"
            :hint="t('settings.siteTitleHint')"
            maxlength="80"
          />

          <q-select
            v-model="form.siteLanguage"
            outlined
            emit-value
            map-options
            :label="t('settings.language.label')"
            :hint="t('settings.language.hint')"
            :options="languageOptions"
          />

          <div>
            <div class="text-body2 q-mb-sm">{{ t('settings.favicon') }}</div>
            <div class="row items-center no-wrap q-gutter-sm">
              <img
                class="wiki-favicon-preview"
                :src="form.favicon || '/icons/favicon.svg'"
                :alt="t('settings.faviconPreview')"
              >
              <q-btn
                outline
                no-caps
                color="primary"
                icon="upload"
                :label="t('settings.chooseImage')"
                :loading="uploadingFavicon"
                @click="pickFavicon"
              />
              <q-btn
                flat
                no-caps
                :label="t('common.reset')"
                :disable="uploadingFavicon || resettingFavicon || !form.favicon"
                :loading="resettingFavicon"
                @click="resetFavicon"
              />
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('settings.faviconHint') }}</div>
            <input
              ref="faviconInput"
              type="file"
              accept=".png,.ico,.svg,.webp,.jpg,.jpeg,.gif,image/png,image/x-icon,image/svg+xml,image/webp,image/jpeg,image/gif"
              style="display: none"
              @change="onFaviconPick"
            >
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('settings.theme') }}</div>
            <q-btn-toggle
              v-model="form.theme"
              unelevated
              no-caps
              toggle-color="primary"
              :options="themeOptions"
            />
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('settings.fontScale') }}</div>
            <q-select
              v-model="form.fontScale"
              outlined
              dense
              emit-value
              map-options
              :options="fontScaleOptions"
              style="max-width: 220px"
            />
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('settings.fontScaleHint') }}</div>
          </div>

          <div>
            <q-toggle
              v-model="form.codeLineNumbers"
              :label="t('settings.codeLineNumbers')"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ t('settings.codeLineNumbersHint') }}
            </div>
          </div>

          <div class="wiki-split">
            <div>
              <div class="text-body2 q-mb-sm">{{ t('settings.categoryTree') }}</div>
              <q-btn-toggle
                v-model="form.categoryTreeExpand"
                unelevated
                no-caps
                toggle-color="primary"
                :spread="!isDesktop"
                :options="treeExpandOptions"
              />
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('settings.categoryTreeHint') }}</div>
            </div>
            <div>
              <div class="text-body2 q-mb-sm">{{ t('settings.categoryTreeSide') }}</div>
              <q-btn-toggle
                v-model="form.categoryTreeSide"
                unelevated
                no-caps
                toggle-color="primary"
                :spread="!isDesktop"
                :options="treeSideOptions"
              />
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('settings.categoryTreeSideHint') }}</div>
              <q-toggle
                v-model="form.rightMenuDefaultOpen"
                class="q-mt-sm"
                :label="t('settings.rightMenuDefaultOpen')"
                color="primary"
                :disable="form.categoryTreeSide !== 'right'"
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ t('settings.rightMenuDefaultOpenHint') }}
              </div>
            </div>
          </div>

          <div>
            <div class="wiki-split">
              <div>
                <div class="text-body2 q-mb-sm">{{ t('settings.defaultEditorDesktop') }}</div>
                <q-select
                  v-model="form.defaultEditor"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="editorOptions"
                />
              </div>
              <div>
                <div class="text-body2 q-mb-sm">{{ t('settings.defaultEditorMobile') }}</div>
                <q-select
                  v-model="form.defaultEditorMobile"
                  outlined
                  dense
                  emit-value
                  map-options
                  :options="editorOptions"
                />
              </div>
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ t('settings.defaultEditorHint') }}</div>
          </div>

          <q-input
            v-model="form.plantumlServer"
            outlined
            :label="t('settings.plantumlServer')"
            :hint="t('settings.plantumlServerHint')"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" :label="t('settings.saveSettings')" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { editorOptions as makeEditorOptions } from '@/utils/editors'
import { useI18n } from '@/i18n'

const $q = useQuasar()
const { isDesktop } = useLayout()
const settings = useSettingsStore()
const { t } = useI18n()
const saving = ref(false)
const uploadingFavicon = ref(false)
const resettingFavicon = ref(false)
const faviconInput = ref(null)
const error = ref('')
const form = reactive({
  siteTitle: settings.siteTitle,
  siteLanguage: settings.siteLanguage,
  theme: settings.theme,
  plantumlServer: settings.plantumlServer,
  defaultEditor: settings.defaultEditor,
  defaultEditorMobile: settings.defaultEditorMobile,
  favicon: settings.favicon,
  categoryTreeExpand: settings.categoryTreeExpand,
  categoryTreeSide: settings.categoryTreeSide,
  rightMenuDefaultOpen: settings.rightMenuDefaultOpen,
  fontScale: settings.fontScale,
  codeLineNumbers: settings.codeLineNumbers
})

const languageOptions = computed(() => [
  { label: t('settings.language.korean'), value: 'ko-KR' },
  { label: t('settings.language.englishUs'), value: 'en-US' }
])
const themeOptions = computed(() => [
  { label: t('settings.themeLight'), value: 'light', icon: 'light_mode' },
  { label: t('settings.themeDark'), value: 'dark', icon: 'dark_mode' }
])
const treeExpandOptions = computed(() => [
  { label: t('settings.treeExpanded'), value: 'expanded' },
  { label: t('settings.treeCollapsed'), value: 'collapsed' },
  { label: t('settings.treeRoot'), value: 'root' }
])
const treeSideOptions = computed(() => [
  { label: t('settings.left'), value: 'left' },
  { label: t('settings.right'), value: 'right' }
])
const fontScaleOptions = computed(() => [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120].map((value) => ({
  label: value === 100 ? t('settings.fontScaleDefault', { value }) : `${value}%`,
  value
})))
const editorOptions = computed(() => makeEditorOptions())

onMounted(async () => {
  await settings.ensureLoaded()
  form.siteTitle = settings.siteTitle
  form.siteLanguage = settings.siteLanguage
  form.theme = settings.theme
  form.plantumlServer = settings.plantumlServer
  form.defaultEditor = settings.defaultEditor
  form.defaultEditorMobile = settings.defaultEditorMobile
  form.favicon = settings.favicon
  form.categoryTreeExpand = settings.categoryTreeExpand
  form.categoryTreeSide = settings.categoryTreeSide
  form.rightMenuDefaultOpen = settings.rightMenuDefaultOpen
  form.fontScale = settings.fontScale
  form.codeLineNumbers = settings.codeLineNumbers
})

function pickFavicon() {
  faviconInput.value?.click()
}

async function onFaviconPick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: t('settings.faviconTooLarge') })
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
    error.value = getErrorMessage(err, t('settings.faviconUploadFailed'))
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
    $q.notify({ type: 'positive', message: t('settings.faviconReset') })
  } catch (err) {
    error.value = getErrorMessage(err, t('settings.faviconResetFailed'))
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
      siteLanguage: form.siteLanguage,
      theme: form.theme,
      plantumlServer: form.plantumlServer,
      defaultEditor: form.defaultEditor,
      defaultEditorMobile: form.defaultEditorMobile,
      favicon: form.favicon,
      categoryTreeExpand: form.categoryTreeExpand,
      categoryTreeSide: form.categoryTreeSide,
      rightMenuDefaultOpen: form.rightMenuDefaultOpen,
      fontScale: form.fontScale,
      codeLineNumbers: form.codeLineNumbers
    })
    form.rightMenuDefaultOpen = settings.rightMenuDefaultOpen
    form.codeLineNumbers = settings.codeLineNumbers
    form.siteLanguage = settings.siteLanguage
    $q.notify({ type: 'positive', message: t('settings.saved') })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.wiki-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 1024px) {
  .wiki-split {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
