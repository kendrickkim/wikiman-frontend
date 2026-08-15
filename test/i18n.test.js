import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  DEFAULT_SITE_LANGUAGE,
  flattenKeys,
  setLocale,
  t
} from '../src/i18n/index.js'
import koKr from '../src/i18n/koKr.js'
import usEn from '../src/i18n/usEn.js'
import { getErrorMessage } from '../src/utils/api.js'

afterEach(() => {
  setLocale(DEFAULT_SITE_LANGUAGE)
})

test('Korean and English catalogs have the same keys', () => {
  assert.deepEqual(
    flattenKeys(koKr).sort(),
    flattenKeys(usEn).sort()
  )
})

test('messages interpolate named parameters', () => {
  setLocale('en-US')
  assert.equal(
    t('posts.pagination', { start: 1, end: 10, total: 42 }),
    '1–10 of 42'
  )
})

test('missing localized messages fall back to Korean', () => {
  const englishSave = usEn.common.save
  delete usEn.common.save

  try {
    setLocale('en-US')
    assert.equal(t('common.save'), '저장')
  } finally {
    usEn.common.save = englishSave
  }
})

test('API error codes are translated in Korean and English', () => {
  const err = { response: { data: { error: 'POST_NOT_FOUND' } } }

  assert.equal(getErrorMessage(err), '글을 찾을 수 없습니다.')
  setLocale('en-US')
  assert.equal(getErrorMessage(err), 'Post not found.')
})

test('API error translation interpolates response params', () => {
  const err = {
    response: {
      data: {
        error: 'TOP_MENU_MAX_ITEMS',
        params: { max: 12 }
      }
    }
  }

  assert.equal(getErrorMessage(err), '상단 메뉴는 최대 12개까지 추가할 수 있습니다.')
  setLocale('en-US')
  assert.equal(getErrorMessage(err), 'Top menu can have at most 12 items.')
})

test('unknown API error codes use a generic or caller fallback message', () => {
  const err = { response: { data: { error: 'UNKNOWN_ERROR_CODE' } } }

  assert.equal(getErrorMessage(err), '요청에 실패했습니다.')
  assert.equal(getErrorMessage(err, '작업을 완료하지 못했습니다.'), '작업을 완료하지 못했습니다.')
  assert.notEqual(getErrorMessage(err), 'UNKNOWN_ERROR_CODE')
})

test('legacy server error messages pass through unchanged', () => {
  const err = { response: { data: { error: '기존 서버 오류 메시지' } } }

  assert.equal(getErrorMessage(err), '기존 서버 오류 메시지')
})
