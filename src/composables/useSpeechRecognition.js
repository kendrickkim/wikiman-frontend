import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getLocale } from '@/i18n'
import {
  isWikimanNativeApp,
  notifyWikimanNativeApp,
  onWikimanNativeEvent
} from '@/utils/nativeApp'

function recognitionConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition({ onTranscript, onError } = {}) {
  const native = isWikimanNativeApp()
  const supported = ref(Boolean(recognitionConstructor()) || native)
  const listening = ref(false)
  let recognition = null
  let usingNative = false
  let offNative = () => {}

  function stopBrowser() {
    if (!recognition) return
    listening.value = false
    recognition.stop()
  }

  function stop() {
    if (usingNative) {
      usingNative = false
      listening.value = false
      notifyWikimanNativeApp('speech:stop')
      return
    }
    stopBrowser()
  }

  function startNative() {
    usingNative = notifyWikimanNativeApp('speech:start')
    if (!usingNative) {
      listening.value = false
      onError?.('start-failed')
      return
    }
    listening.value = true
  }

  function start() {
    const Recognition = recognitionConstructor()
    supported.value = Boolean(Recognition) || native
    if (listening.value) return

    if (!Recognition) {
      if (native) startNative()
      return
    }

    recognition = new Recognition()
    recognition.lang = getLocale()
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (!result.isFinal) continue
        const transcript = String(result[0]?.transcript || '').trim()
        if (transcript) onTranscript?.(transcript)
      }
    }
    recognition.onerror = (event) => {
      listening.value = false
      const code = event.error || 'unknown'
      if (native && ['not-allowed', 'service-not-allowed', 'audio-capture'].includes(code)) {
        startNative()
        return
      }
      onError?.(code)
    }
    recognition.onend = () => {
      if (usingNative) return
      listening.value = false
      recognition = null
    }

    try {
      recognition.start()
      listening.value = true
    } catch {
      listening.value = false
      recognition = null
      if (native) {
        startNative()
        return
      }
      onError?.('start-failed')
    }
  }

  function toggle() {
    if (listening.value) stop()
    else start()
  }

  onMounted(() => {
    offNative = onWikimanNativeEvent((detail) => {
      if (!detail || typeof detail !== 'object') return
      if (detail.type === 'speech:transcript') {
        const text = String(detail.text || '').trim()
        if (text) onTranscript?.(text)
        return
      }
      if (detail.type === 'speech:started') {
        usingNative = true
        listening.value = true
        return
      }
      if (detail.type === 'speech:stopped') {
        usingNative = false
        listening.value = false
        return
      }
      if (detail.type === 'speech:error') {
        usingNative = false
        listening.value = false
        onError?.(detail.code || 'unknown')
      }
    })
  })

  onBeforeUnmount(() => {
    offNative()
    stop()
  })

  return {
    supported,
    listening,
    start,
    stop,
    toggle
  }
}
