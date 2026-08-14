<template>
  <q-page class="wiki-page">
    <div class="wiki-main wiki-main--wide">
      <div :class="isDesktop ? 'text-h4 text-weight-bold q-mb-lg' : 'text-h6 q-mb-md'">사이트 관리</div>
      <router-view />
    </div>
  </q-page>
</template>

<script setup>
import { useLayout } from '@/composables/useLayout'

const { isDesktop } = useLayout()
</script>
