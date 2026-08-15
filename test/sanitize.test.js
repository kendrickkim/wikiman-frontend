import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeHtml } from '../src/utils/sanitize.js'
import { formatBytes, formatDate } from '../src/utils/format.js'
import { internalRouteForUrl } from '../src/utils/urls.js'

test('HTML sanitizer는 script을 제거한다', () => {
  const clean = sanitizeHtml('<p>안녕<script>alert(1)</script></p>')
  assert.equal(clean.includes('<script'), false)
  assert.equal(clean.includes('안녕'), true)
})

test('formatDate와 formatBytes가 동작한다', () => {
  assert.equal(formatDate('2026-08-14T07:00:00'), '2026-08-14 07:00')
  assert.equal(formatBytes(2048), '2.0 KB')
})

test('같은 Wikiman 주소는 내부 라우트로 변환한다', () => {
  const origin = 'https://wiki.example.com'
  assert.equal(
    internalRouteForUrl('https://wiki.example.com/posts/12?page=2#body', origin),
    '/posts/12?page=2#body'
  )
  assert.equal(internalRouteForUrl('/category/3', origin), '/category/3')
  assert.equal(internalRouteForUrl('https://other.example.com/posts/12', origin), '')
  assert.equal(internalRouteForUrl('javascript:alert(1)', origin), '')
})
