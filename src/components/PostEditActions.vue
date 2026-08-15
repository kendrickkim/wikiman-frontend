<template>
  <div :class="mobile ? 'wiki-edit-actions wiki-edit-actions--mobile' : 'wiki-edit-actions'">
    <q-btn
      outline
      no-caps
      color="primary"
      label="초안 저장"
      :dense="mobile"
      :size="mobile ? 'sm' : undefined"
      :loading="saving && savingAs === 'draft'"
      :disable="saving"
      @click="emit('save', 'draft')"
    />
    <q-btn
      unelevated
      no-caps
      color="primary"
      label="발행"
      :dense="mobile"
      :size="mobile ? 'sm' : undefined"
      :loading="saving && savingAs === 'published'"
      :disable="saving"
      @click="emit('save', 'published')"
    />
    <q-btn
      outline
      no-caps
      label="취소"
      :dense="mobile"
      :size="mobile ? 'sm' : undefined"
      :disable="saving"
      @click="emit('cancel')"
    />
    <q-btn
      v-if="isEdit"
      outline
      no-caps
      color="negative"
      label="삭제"
      :dense="mobile"
      :size="mobile ? 'sm' : undefined"
      :disable="saving"
      @click="emit('remove')"
    />
  </div>
</template>

<script setup>
defineProps({
  mobile: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  savingAs: { type: String, default: '' },
  isEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'cancel', 'remove'])
</script>
