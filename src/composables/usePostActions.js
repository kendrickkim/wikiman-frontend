import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api, getErrorMessage } from '@/utils/api'
import { displayTitle } from '@/utils/title'
import { useWikiStore } from '@/stores/wiki'
import { useI18n } from '@/i18n'

export function usePostActions() {
  const $q = useQuasar()
  const router = useRouter()
  const wiki = useWikiStore()
  const { t } = useI18n()

  function refreshKeywords() {
    wiki.invalidateKeywords()
    return wiki.ensureKeywords({ force: true })
  }

  function publishPost(post) {
    if (!post?.id || post.status === 'published') return Promise.resolve(false)
    return new Promise((resolve) => {
      $q.dialog({
        title: t('posts.publishDialogTitle'),
        message: t('posts.publishDialogMessage', { title: displayTitle(post.title) }),
        persistent: true,
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('posts.publish'), color: 'primary', unelevated: true }
      }).onOk(async () => {
        try {
          const { data } = await api.patch(`/posts/${post.id}`, { status: 'published' })
          await refreshKeywords()
          $q.notify({ type: 'positive', message: t('status.publishedNotice') })
          resolve(data.post || true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  function removePost(post, { redirect = true } = {}) {
    return new Promise((resolve) => {
      $q.dialog({
        title: t('posts.moveTrashTitle'),
        message: t('posts.moveTrashMessage', { title: displayTitle(post.title) }),
        persistent: true,
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('posts.moveToTrash'), color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          await api.delete(`/posts/${post.id}`)
          await refreshKeywords()
          $q.notify({ type: 'positive', message: t('posts.movedToTrash') })
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
        title: t('posts.restoreTitle'),
        message: t('posts.restoreMessage', { title: displayTitle(post.title) }),
        persistent: true,
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('common.restore'), color: 'primary', unelevated: true }
      }).onOk(async () => {
        try {
          const { data } = await api.post(`/posts/${post.id}/restore`)
          await refreshKeywords()
          $q.notify({ type: 'positive', message: t('posts.restored') })
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
        title: t('posts.purgeTitle'),
        message: t('posts.purgeMessage', { title: displayTitle(post.title) }),
        persistent: true,
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('common.delete'), color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          await api.delete(`/posts/${post.id}/permanent`)
          await refreshKeywords()
          $q.notify({ type: 'positive', message: t('posts.purged') })
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
        title: t('posts.emptyTrashTitle'),
        message: n > 0
          ? t('posts.emptyTrashCountMessage', { count: n })
          : t('posts.emptyTrashMessage'),
        persistent: true,
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('posts.emptyTrash'), color: 'negative', unelevated: true }
      }).onOk(async () => {
        try {
          const { data } = await api.delete('/posts/trash')
          await refreshKeywords()
          const deleted = Number(data?.deleted) || 0
          $q.notify({
            type: 'positive',
            message: deleted > 0 ? t('posts.trashDeleted', { count: deleted }) : t('posts.trashEmpty')
          })
          resolve(true)
        } catch (err) {
          $q.notify({ type: 'negative', message: getErrorMessage(err) })
          resolve(false)
        }
      }).onCancel(() => resolve(false))
    })
  }

  return { publishPost, removePost, restorePost, purgePost, emptyTrash }
}
