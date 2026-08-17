import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isWikimanNativeApp,
  notifyWikimanNativeApp,
  onWikimanNativeEvent
} from '../src/utils/nativeApp.js'

test('브라우저에서는 네이티브 앱 브리지를 쓰지 않는다', () => {
  assert.equal(isWikimanNativeApp(), false)
  assert.equal(notifyWikimanNativeApp('goHome'), false)
  const off = onWikimanNativeEvent(() => {})
  assert.equal(typeof off, 'function')
  off()
})
