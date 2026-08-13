<template>
  <q-card v-if="editable || files.length" flat bordered :class="cardClass">
    <q-card-section>
      <div class="row items-center no-wrap q-mb-xs">
        <div class="text-subtitle2">첨부 파일</div>
        <q-space />
        <q-btn
          v-if="editable"
          unelevated
          no-caps
          color="primary"
          icon="attach_file"
          label="파일 추가"
          :loading="uploading"
          :disable="uploading || files.length >= maxFiles"
          @click="pick"
        />
      </div>
      <div v-if="editable" class="text-caption text-grey-7 q-mb-sm">
        여러 파일을 한 번에 올릴 수 있습니다. 파일당 최대 {{ maxMb }}MB.
      </div>
      <input
        ref="inputEl"
        type="file"
        multiple
        style="display: none"
        @change="onPick"
      >
      <div v-if="!files.length" class="text-grey-7 text-caption">첨부된 파일이 없습니다.</div>
      <q-list v-else separator>
        <q-item v-for="file in files" :key="file.storedName" dense>
          <q-item-section avatar>
            <q-icon name="insert_drive_file" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="ellipsis">{{ file.originalName }}</q-item-label>
            <q-item-label caption>{{ formatSize(file.size) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row no-wrap">
              <q-btn
                flat
                round
                dense
                icon="download"
                :href="file.downloadUrl || file.url"
                :download="file.originalName"
                tag="a"
                target="_blank"
                rel="noopener"
              >
                <q-tooltip>내려받기</q-tooltip>
              </q-btn>
              <q-btn
                v-if="editable"
                flat
                round
                dense
                icon="close"
                @click="removeFile(file)"
              >
                <q-tooltip>제거</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api, getErrorMessage } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'

const MAX_FILES = 50

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
  cardClass: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const settings = useSettingsStore()
const inputEl = ref(null)
const uploading = ref(false)
const maxFiles = MAX_FILES

const maxMb = computed(() => {
  const n = Number(settings.maxAttachmentMb)
  return Number.isFinite(n) && n > 0 ? n : 20
})
const maxBytes = computed(() => maxMb.value * 1024 * 1024)

const files = computed({
  get() {
    return props.modelValue || []
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

function formatSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function pick() {
  inputEl.value?.click()
}

function removeFile(file) {
  files.value = files.value.filter((item) => item.storedName !== file.storedName)
}

async function onPick(event) {
  const picked = Array.from(event.target.files || [])
  event.target.value = ''
  if (!picked.length) return

  const remaining = MAX_FILES - files.value.length
  if (remaining <= 0) {
    $q.notify({ type: 'warning', message: `첨부 파일은 최대 ${MAX_FILES}개입니다.` })
    return
  }

  const accepted = []
  for (const file of picked.slice(0, remaining)) {
    if (file.size > maxBytes.value) {
      $q.notify({ type: 'negative', message: `${file.name}은(는) ${maxMb.value}MB를 넘습니다.` })
      continue
    }
    accepted.push(file)
  }
  if (!accepted.length) return

  uploading.value = true
  try {
    const form = new FormData()
    for (const file of accepted) form.append('files', file)
    const { data } = await api.post('/uploads/files', form, { timeout: 120000 })
    const uploaded = Array.isArray(data.files) ? data.files : []
    const existing = new Set(files.value.map((item) => item.storedName))
    files.value = [
      ...files.value,
      ...uploaded.filter((item) => item.storedName && !existing.has(item.storedName))
    ]
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, '파일 업로드에 실패했습니다.') })
  } finally {
    uploading.value = false
  }
}
</script>
