<template>
  <q-page class="wiki-page flex flex-center">
    <q-card flat bordered class="wiki-auth-card">
      <q-card-section>
        <div class="text-h5 text-weight-medium">{{ t('auth.login') }}</div>
        <div class="text-grey-7 q-mt-xs">{{ t('extra.loginDescription', { siteTitle: settings.siteTitle }) }}</div>
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="submit">
          <q-input v-model="username" outlined dense :label="t('auth.username')" autocomplete="username" />
          <q-input v-model="password" outlined dense type="password" :label="t('auth.password')" autocomplete="current-password" />
          <div class="text-negative" v-if="error">{{ error }}</div>
          <q-btn type="submit" color="primary" unelevated class="full-width" :label="t('auth.login')" :loading="loading" />
        </q-form>
        <div v-if="auth.canRegister" class="q-mt-md text-center">{{ t('auth.noAccount') }}<router-link to="/register">{{ t('auth.registerTitle') }}</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { getErrorMessage } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const settings = useSettingsStore()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  auth.loadStatus()
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>
