import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeHtml } from '../src/utils/sanitize.js'
import { formatBytes, formatDate } from '../src/utils/format.js'

test('HTML sanitizer는 script을 제거한다', () => {
  const clean = sanitizeHtml('<p>안녕<script>alert(1)</script></p>')
  assert.equal(clean.includes('<script'), false)
  assert.equal(clean.includes('안녕'), true)
})

test('formatDate와 formatBytes가 동작한다', () => {
  assert.equal(formatDate('2026-08-14T07:00:00'), '2026-08-14 07:00')
  assert.equal(formatBytes(2048), '2.0 KB')
})
