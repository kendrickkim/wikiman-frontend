<template>
  <q-page class="wiki-page flex flex-center">
    <q-card flat bordered class="wiki-auth-card">
      <q-card-section>
        <div class="text-h5 text-weight-medium">{{ t('auth.registerTitle') }}</div>
        <div class="text-grey-7 q-mt-xs">{{ t('remaining.k096') }}</div>
      </q-card-section>
      <q-card-section>
        <div v-if="!auth.canRegister" class="text-grey-7">{{ t('remaining.k097') }}<div class="q-mt-md text-center">
            <router-link to="/login">{{ t('auth.login') }}</router-link>
          </div>
        </div>
        <template v-else>
          <q-form class="q-gutter-md" @submit.prevent="submit">
            <q-input v-model="username" outlined dense :label="t('remaining.k093')" autocomplete="username" />
            <q-input v-model="password" outlined dense type="password" :label="t('remaining.k094')" autocomplete="new-password" />
            <div class="text-negative" v-if="error">{{ error }}</div>
            <q-btn type="submit" color="primary" unelevated class="full-width" :label="t('remaining.k095')" :loading="loading" />
          </q-form>
          <div class="q-mt-md text-center">{{ t('remaining.k098') }}<router-link to="/login">{{ t('auth.login') }}</router-link>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/api'

const router = useRouter()
const auth = useAuthStore()
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
    await auth.register(username.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>
