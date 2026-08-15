import { onBeforeUnmount, ref } from 'vue'
import { getLocale } from '@/i18n'

function recognitionConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition({ onTranscript, onError } = {}) {
  const supported = ref(Boolean(recognitionConstructor()))
  const listening = ref(false)
  let recognition = null

  function stop() {
    if (!recognition) return
    listening.value = false
    recognition.stop()
  }

  function start() {
    const Recognition = recognitionConstructor()
    supported.value = Boolean(Recognition)
    if (!Recognition || listening.value) return

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
      onError?.(event.error || 'unknown')
    }
    recognition.onend = () => {
      listening.value = false
      recognition = null
    }

    try {
      recognition.start()
      listening.value = true
    } catch {
      listening.value = false
      recognition = null
      onError?.('start-failed')
    }
  }

  function toggle() {
    if (listening.value) stop()
    else start()
  }

  onBeforeUnmount(stop)

  return {
    supported,
    listening,
    start,
    stop,
    toggle
  }
}
