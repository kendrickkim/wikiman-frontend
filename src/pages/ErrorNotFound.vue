<template>
  <div class="fullscreen bg-blue-grey-2 text-dark flex flex-center">
    <div class="text-center">
      <div class="text-h4">404</div>
      <div class="q-mt-sm">{{ t('remaining.k069') }}</div>
      <q-btn class="q-mt-md" unelevated color="primary" to="/" :label="t('remaining.k068')" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>
