<template>
  <div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md">{{ error }}</q-banner>

    <q-form @submit.prevent="save">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ t('blog.title') }}</div>
          <div class="text-grey-7 text-caption q-mt-xs">
            {{ t('blog.description') }}
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-lg">
          <div>
            <q-toggle
              v-model="blogMode"
              :label="t('blog.mode')"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ t('blog.modeHint') }}
            </div>
          </div>

          <div>
            <q-toggle
              v-model="blogShowHomepage"
              :label="t('blog.showHomepage')"
              color="primary"
              :disable="!blogMode"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ t('blog.showHomepageHint') }}
            </div>
          </div>

          <div>
            <div class="text-body2 q-mb-sm">{{ t('blog.postsPerPage') }}</div>
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
              {{ t('blog.postsPerPageHint') }}
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn type="submit" unelevated color="primary" :label="t('settings.saveSettings')" :loading="saving" />
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
import { useI18n } from '@/i18n'

const $q = useQuasar()
const settings = useSettingsStore()
const { t } = useI18n()
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
    $q.notify({ type: 'positive', message: t('blog.saved') })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

