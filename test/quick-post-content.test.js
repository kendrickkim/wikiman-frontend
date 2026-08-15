import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyQuickPostContent, hasQuickPostContent } from '../src/utils/quickPostContent.js'

test('간단 포스트 빈 본문 판별', () => {
  assert.equal(hasQuickPostContent('', 'textarea'), false)
  assert.equal(hasQuickPostContent('   ', 'textarea'), false)
  assert.equal(hasQuickPostContent('<p><br></p>', 'ckeditor'), false)
  assert.equal(hasQuickPostContent('<p>안녕</p>', 'ckeditor'), true)
  assert.equal(hasQuickPostContent(emptyQuickPostContent('editorjs'), 'editorjs'), false)
  assert.equal(hasQuickPostContent(JSON.stringify({
    blocks: [{ type: 'paragraph', data: { text: '메모' } }]
  }), 'editorjs'), true)
})
