import { computed } from 'vue'
import { useQuasar } from 'quasar'

export function useLayout() {
  const $q = useQuasar()
  const isDesktop = computed(() => $q.screen.gt.sm)
  const isMobile = computed(() => !$q.screen.gt.sm)
  return { $q, isDesktop, isMobile }
}
