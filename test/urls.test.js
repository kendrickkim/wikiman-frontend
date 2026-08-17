import test from 'node:test'
import assert from 'node:assert/strict'
import { toThumbnailUrl } from '../src/utils/urls.js'

test('supported internal file URLs get a thumbnail query', () => {
  assert.equal(toThumbnailUrl('/api/files/photo.jpg'), '/api/files/photo.jpg?thumb=1')
  assert.equal(
    toThumbnailUrl('/api/posts/42/files/photo.jpg?download=0#preview'),
    '/api/posts/42/files/photo.jpg?download=0&thumb=1#preview'
  )
  assert.equal(
    toThumbnailUrl('/api/files/photo.jpg?download=0&thumb=1#preview'),
    '/api/files/photo.jpg?download=0&thumb=1#preview'
  )
  assert.equal(
    toThumbnailUrl('/api/files/photo.jpg?thumb=0&download=1'),
    '/api/files/photo.jpg?thumb=1&download=1'
  )
})

test('unrelated, external, data, and blob URLs are unchanged', () => {
  const urls = [
    '/api/uploads/photo.jpg',
    '/api/posts/42',
    'https://cdn.example.com/photo.jpg',
    'data:image/png;base64,abc',
    'blob:https://wiki.example/id'
  ]
  for (const url of urls) assert.equal(toThumbnailUrl(url), url)
})

test('same-origin absolute file URLs are thumbnailed when origin is detectable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location')
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { origin: 'https://wiki.example' }
  })

  try {
    assert.equal(
      toThumbnailUrl('https://wiki.example/api/files/a.png?size=2#image'),
      'https://wiki.example/api/files/a.png?size=2&thumb=1#image'
    )
    assert.equal(
      toThumbnailUrl('https://other.example/api/files/a.png'),
      'https://other.example/api/files/a.png'
    )
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor)
    else delete globalThis.location
  }
})
