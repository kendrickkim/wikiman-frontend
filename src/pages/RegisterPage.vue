<template>
  <q-page class="wiki-page flex flex-center">
    <q-card flat bordered class="wiki-auth-card">
      <q-card-section>
        <div class="text-h5 text-weight-medium">회원가입</div>
        <div class="text-grey-7 q-mt-xs">처음 가입한 계정이 작성자가 됩니다.</div>
      </q-card-section>
      <q-card-section>
        <div v-if="!auth.canRegister" class="text-grey-7">
          작성자 계정이 이미 있습니다. 글 작성은 한 명만 가능합니다.
          <div class="q-mt-md text-center">
            <router-link to="/login">로그인</router-link>
          </div>
        </div>
        <template v-else>
          <q-form class="q-gutter-md" @submit.prevent="submit">
            <q-input v-model="username" outlined dense label="아이디 (영문, 숫자, 밑줄)" autocomplete="username" />
            <q-input v-model="password" outlined dense type="password" label="비밀번호 (6자 이상)" autocomplete="new-password" />
            <div class="text-negative" v-if="error">{{ error }}</div>
            <q-btn type="submit" color="primary" unelevated class="full-width" label="가입하기" :loading="loading" />
          </q-form>
          <div class="q-mt-md text-center">
            이미 계정이 있으면 <router-link to="/login">로그인</router-link>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
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
