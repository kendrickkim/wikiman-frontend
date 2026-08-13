<template>
  <q-page class="wiki-page flex flex-center">
    <q-card flat bordered class="full-width" style="max-width: 420px;">
      <q-card-section>
        <div class="text-h6">로그인</div>
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="submit">
          <q-input v-model="username" outlined dense label="아이디" autocomplete="username" />
          <q-input v-model="password" outlined dense type="password" label="비밀번호" autocomplete="current-password" />
          <div class="text-negative" v-if="error">{{ error }}</div>
          <q-btn type="submit" color="primary" unelevated class="full-width" label="로그인" :loading="loading" />
        </q-form>
        <div v-if="auth.canRegister" class="q-mt-md text-center">
          계정이 없으면 <router-link to="/register">회원가입</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/api'

const route = useRoute()
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
    await auth.login(username.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>
