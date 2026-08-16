import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendQuickPostSpeech,
  emptyQuickPostContent,
  extractQuickPostImages,
  hasQuickPostContent,
  quickPostPlainText
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

test('본문에서 이미지 주소를 모은다', () => {
  assert.deepEqual(
    extractQuickPostImages('메모\n![사진](/api/uploads/a.png)\n<img src="/api/uploads/b.jpg?v=2">'),
    ['/api/uploads/a.png', '/api/uploads/b.jpg?v=2']
  )
  assert.deepEqual(
    extractQuickPostImages('https://example.com/photo.WEBP 참고'),
    ['https://example.com/photo.WEBP']
  )
  assert.deepEqual(
    extractQuickPostImages(JSON.stringify({
      blocks: [{ type: 'image', data: { file: { url: '/api/uploads/c.gif' } } }]
    })),
    ['/api/uploads/c.gif']
  )
  assert.deepEqual(extractQuickPostImages('<img src="javascript:alert(1)">'), [])
  assert.deepEqual(extractQuickPostImages('https://example.com/page 참고'), [])
  assert.equal(extractQuickPostImages('![a](/1.png) ![b](/2.png) ![c](/3.png)', { limit: 2 }).length, 2)
})

test('이미지 마크업을 걷어낸 본문만 남긴다', () => {
  assert.equal(quickPostPlainText('메모\n\n![사진](/api/uploads/a.png)'), '메모')
  assert.equal(quickPostPlainText('<p>메모</p><img src="/api/uploads/a.png">'), '<p>메모</p>')
  assert.equal(quickPostPlainText('/api/uploads/a.png 만 있음'), '만 있음')
  assert.equal(quickPostPlainText('https://example.com/page 는 남는다'), 'https://example.com/page 는 남는다')
  assert.equal(
    quickPostPlainText(JSON.stringify({
      blocks: [
        { type: 'paragraph', data: { text: '메모' } },
        { type: 'image', data: { file: { url: '/api/uploads/a.png' } } }
      ]
    })),
    '메모'
  )
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
