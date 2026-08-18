import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isWikimanNativeAndroid,
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

test('안드로이드 앱 User-Agent만 네이티브 안드로이드로 본다', () => {
  const android = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 WikimanApp/1.0'
  const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) WikimanApp/1.0'
  assert.equal(isWikimanNativeApp(android), true)
  assert.equal(isWikimanNativeAndroid(android), true)
  assert.equal(isWikimanNativeAndroid(ios), false)
  assert.equal(isWikimanNativeAndroid('Mozilla/5.0 (Linux; Android 13) Chrome/120.0'), false)
})
