import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { displayTitle } from '@/utils/title'
import { useWikiStore } from '@/stores/wiki'

export function usePostActions() {
  const $q = useQuasar()
  const router = useRouter()
  const wiki = useWikiStore()

  function refreshKeywords() {
    wiki.invalidateKeywords()
    return wiki.ensureKeywords({ force: true })
  }

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
          await refreshKeywords()
          $q.notify({ type: 'positive', message: '휴지통으로 이동했습니다.' })
          if (redirect) {
            if (window.history.state?.back != null) router.back()
            else router.push('/')
          }
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
          await refreshKeywords()
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
          await refreshKeywords()
          $q.notify({ type: 'positive', message: '완전히 삭제했습니다.' })
          resolve(true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  function emptyTrash(count) {
    const n = Number(count) || 0
    return new Promise((resolve) => {
      $q.dialog({
        title: '휴지통 비우기',
        message: n > 0
          ? `휴지통의 글 ${n}개를 모두 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
          : '휴지통의 글을 모두 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.',
        persistent: true,
        cancel: { label: '취소', flat: true },
        ok: { label: '비우기', color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          const { data } = await api.delete('/posts/trash')
          await refreshKeywords()
          const deleted = Number(data?.deleted) || 0
          $q.notify({
            type: 'positive',
            message: deleted > 0 ? `휴지통에서 ${deleted}개를 삭제했습니다.` : '휴지통이 비어 있습니다.'
          })
          resolve(true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  return { removePost, restorePost, purgePost, emptyTrash }
}
