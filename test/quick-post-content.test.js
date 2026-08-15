import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendQuickPostSpeech,
  emptyQuickPostContent,
  hasQuickPostContent
} from '../src/utils/quickPostContent.js'

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

test('음성 인식 결과를 에디터 형식에 맞게 추가한다', () => {
  assert.equal(appendQuickPostSpeech('기존', 'textarea', '새 문장'), '기존 새 문장')
  assert.equal(
    appendQuickPostSpeech('<p>기존</p>', 'ckeditor', '<새 문장>'),
    '<p>기존</p>\n<p>&lt;새 문장&gt;</p>'
  )

  const editorJs = JSON.parse(appendQuickPostSpeech('{"blocks":[]}', 'editorjs', '새 문장'))
  assert.deepEqual(editorJs.blocks, [
    { type: 'paragraph', data: { text: '새 문장' } }
  ])
})
