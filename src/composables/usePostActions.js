import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { displayTitle } from '@/utils/title'

export function usePostActions() {
  const $q = useQuasar()
  const router = useRouter()

  function removePost(post, { redirect = true } = {}) {
    return new Promise((resolve) => {
      $q.dialog({
        title: '휴지통으로 이동',
        message: `"${displayTitle(post.title)}"을(를) 휴지통으로 이동할까요?`,
        persistent: true,
        cancel: { label: '취소', flat: true },
        ok: { label: '휴지통으로', color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          await api.delete(`/posts/${post.id}`)
          $q.notify({ type: 'positive', message: '휴지통으로 이동했습니다.' })
          if (redirect) router.push('/')
          resolve(true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  function restorePost(post, { redirect = false } = {}) {
    return new Promise((resolve) => {
      $q.dialog({
        title: '글 복원',
        message: `"${displayTitle(post.title)}"을(를) 복원할까요?`,
        persistent: true,
        cancel: { label: '취소', flat: true },
        ok: { label: '복원', color: 'primary', unelevated: true }
      }).onOk(async () => {
        try {
          const { data } = await api.post(`/posts/${post.id}/restore`)
          $q.notify({ type: 'positive', message: '복원했습니다.' })
          if (redirect) router.push(`/posts/${post.id}`)
          resolve(data.post || true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  function purgePost(post) {
    return new Promise((resolve) => {
      $q.dialog({
        title: '완전히 삭제',
        message: `"${displayTitle(post.title)}"을(를) 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
        persistent: true,
        cancel: { label: '취소', flat: true },
        ok: { label: '삭제', color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          await api.delete(`/posts/${post.id}/permanent`)
          $q.notify({ type: 'positive', message: '완전히 삭제했습니다.' })
          resolve(true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  return { removePost, restorePost, purgePost }
}
