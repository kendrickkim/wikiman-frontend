<template>
  <div v-if="visibleImages.length" class="wiki-quick-images" :class="extraClass">
    <button
      v-for="src in visibleImages"
      :key="src"
      type="button"
      class="wiki-quick-image"
      @click="open(src)"
    >
      <img :src="toThumbnailUrl(src)" :alt="t('posts.attachedImage')" loading="lazy" @error="markFailed(src)" />
    </button>

    <q-dialog
      :model-value="viewerOpen"
      maximized
      transition-show="fade"
      transition-hide="fade"
      @update:model-value="onViewerModel"
    >
      <div class="wiki-quick-image-viewer column no-wrap" @click="dismiss()">
        <div class="row justify-end q-pa-sm">
          <q-btn
            flat
            round
            dense
            color="white"
            icon="close"
            :aria-label="t('common.close')"
            @click.stop="dismiss()"
          />
        </div>
        <div class="col flex flex-center q-px-md q-pb-md" @click.stop>
          <img
            v-if="activeSrc"
            class="wiki-quick-image-viewer__img"
            :src="activeSrc"
            :alt="t('posts.attachedImage')"
            @click.stop="dismiss()"
          />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import { extractQuickPostImages } from '@/utils/quickPostContent'
import { toThumbnailUrl } from '@/utils/urls'

const HISTORY_FLAG = 'wikiQuickImageViewer'

const props = defineProps({
  content: { type: String, default: '' },
  maxImages: { type: Number, default: 6 },
  extraClass: { type: String, default: '' }
})

const { t } = useI18n()

const failed = ref(new Set())
const viewerOpen = ref(false)
const activeSrc = ref('')
let historyPushed = false

const images = computed(() => extractQuickPostImages(props.content, { limit: props.maxImages }))
const visibleImages = computed(() => images.value.filter((src) => !failed.value.has(src)))

watch(images, () => {
  failed.value = new Set()
  if (activeSrc.value && !images.value.includes(activeSrc.value)) dismiss()
})

function open(src) {
  activeSrc.value = src
  viewerOpen.value = true
  if (historyPushed || typeof history === 'undefined') return
  history.pushState({ ...(history.state || {}), [HISTORY_FLAG]: true }, '')
  historyPushed = true
}

function dismiss({ fromPopstate = false } = {}) {
  const wasOpen = viewerOpen.value || Boolean(activeSrc.value)
  viewerOpen.value = false
  activeSrc.value = ''
  if (!wasOpen) return

  if (historyPushed && !fromPopstate) {
    historyPushed = false
    history.back()
    return
  }
  historyPushed = false
}

function onViewerModel(open) {
  if (open) {
    viewerOpen.value = true
    return
  }
  dismiss()
}

function onPopState() {
  if (viewerOpen.value || activeSrc.value) {
    dismiss({ fromPopstate: true })
  }
}

function markFailed(src) {
  const next = new Set(failed.value)
  next.add(src)
  failed.value = next
  if (activeSrc.value === src) dismiss()
}

onMounted(() => {
  window.addEventListener('popstate', onPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
  if (historyPushed) {
    historyPushed = false
    history.back()
  }
})
</script>
