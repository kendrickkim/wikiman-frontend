import test from 'node:test'
import assert from 'node:assert/strict'
import { convertEditorContent, hasEditorContent } from '../src/utils/editorConvert.js'

test('같은 형식 에디터끼리는 본문을 그대로 옮긴다', () => {
  assert.equal(convertEditorContent('<p>안녕</p>', 'ckeditor', 'summernote'), '<p>안녕</p>')
  assert.equal(convertEditorContent('# 제목', 'markdown', 'tui'), '# 제목')
})

test('마크다운을 HTML 에디터로 바꾸면 HTML로 변환된다', () => {
  const html = convertEditorContent('# 제목\n\n본문', 'markdown', 'ckeditor')
  assert.match(html, /<h1[^>]*>제목<\/h1>/)
  assert.match(html, /<p>본문<\/p>/)
})

test('HTML을 마크다운 에디터로 바꾸면 HTML을 유지한다', () => {
  assert.equal(convertEditorContent('<p>안녕</p>', 'ckeditor', 'markdown'), '<p>안녕</p>')
})

test('HTML을 텍스트 에디터로 바꾸면 본문 텍스트가 남는다', () => {
  const text = convertEditorContent('<h2>제목</h2><p>첫째<br>둘째</p>', 'ckeditor', 'textarea')
  assert.equal(text, '제목\n첫째\n둘째')
})

test('Editor.js 블록을 HTML로 옮긴다', () => {
  const content = JSON.stringify({
    blocks: [
      { type: 'header', data: { text: '제목', level: 2 } },
      { type: 'paragraph', data: { text: '본문' } },
      { type: 'list', data: { style: 'unordered', items: ['하나', '둘'] } },
      { type: 'code', data: { code: 'const a = 1' } }
    ]
  })
  const html = convertEditorContent(content, 'editorjs', 'html')
  assert.match(html, /<h2>제목<\/h2>/)
  assert.match(html, /<p>본문<\/p>/)
  assert.match(html, /<ul><li>하나<\/li><li>둘<\/li><\/ul>/)
  assert.match(html, /<pre><code>const a = 1<\/code><\/pre>/)
})

test('텍스트를 Editor.js로 바꾸면 문단 블록이 생긴다', () => {
  const json = convertEditorContent('첫 문단\n\n둘째 문단', 'textarea', 'editorjs')
  const blocks = JSON.parse(json).blocks
  assert.equal(blocks.length, 2)
  assert.equal(blocks[0].type, 'paragraph')
  assert.equal(blocks[0].data.text, '첫 문단')
  assert.equal(blocks[1].data.text, '둘째 문단')
})

test('빈 본문은 대상 형식의 빈 값으로 바뀐다', () => {
  assert.equal(convertEditorContent('', 'ckeditor', 'markdown'), '')
  assert.equal(convertEditorContent('   ', 'textarea', 'editorjs'), '{"blocks":[]}')
  assert.equal(convertEditorContent('{"blocks":[]}', 'editorjs', 'html'), '')
})

test('본문 유무 판별은 에디터 형식을 따른다', () => {
  assert.equal(hasEditorContent('<p><br></p>', 'ckeditor'), false)
  assert.equal(hasEditorContent('<p>안녕</p>', 'ckeditor'), true)
  assert.equal(hasEditorContent('{"blocks":[]}', 'editorjs'), false)
})
