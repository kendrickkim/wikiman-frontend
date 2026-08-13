import { defineBoot } from '#q-app'
import { api } from '@/utils/api'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api
})
