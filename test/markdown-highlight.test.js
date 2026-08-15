import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../src/utils/markdown.js'
import { sanitizeHtml } from '../src/utils/sanitize.js'

function fence(lang, body) {
  return ['```' + lang, body, '```'].join('\n')
}

test('언어 지정 코드 블록에 highlight.js 클래스를 붙인다', () => {
  const html = renderMarkdown(fence('js', 'const x = 1'))
  assert.match(html, /hljs/)
  assert.match(html, /language-javascript/)
  assert.match(html, /hljs-keyword/)
  assert.match(html, /hljs-number/)
})

test('sanitizer가 hljs 클래스를 유지한다', () => {
  const raw = renderMarkdown(fence('python', 'def hello():\n  return 1'))
  const clean = sanitizeHtml(raw)
  assert.match(clean, /hljs/)
  assert.match(clean, /language-python/)
  assert.equal(clean.includes('<script'), false)
})

test('plantuml 펜스는 하이라이트하지 않는다', () => {
  const html = renderMarkdown(fence('plantuml', '@startuml\nA -> B\n@enduml'))
  assert.match(html, /plantuml-block/)
  assert.equal(html.includes('language-plantuml'), false)
})

test('코드 블록에 복사 버튼을 붙이고 sanitizer가 유지한다', () => {
  const raw = renderMarkdown(fence('js', 'const x = 1'))
  assert.match(raw, /wiki-code-block/)
  assert.match(raw, /wiki-code-copy/)
  const clean = sanitizeHtml(raw)
  assert.match(clean, /<button type="button" class="wiki-code-copy"/)
  assert.match(clean, />복사</)
})

test('코드 라인 번호 옵션이 켜지면 줄 번호를 붙인다', () => {
  const off = renderMarkdown(fence('js', 'const a = 1\nconst b = 2'))
  assert.equal(off.includes('wiki-code--lined'), false)
  assert.equal(off.includes('wiki-code-line__num'), false)

  const on = renderMarkdown(fence('js', 'const a = 1\nconst b = 2'), { codeLineNumbers: true })
  assert.match(on, /wiki-code--lined/)
  assert.match(on, /wiki-code-line__num">1</)
  assert.match(on, /wiki-code-line__num">2</)
  const clean = sanitizeHtml(on)
  assert.match(clean, /wiki-code-line__num">1</)
  assert.match(clean, /wiki-code-line__content/)
})

test('HTML table 태그를 렌더하고 sanitizer가 유지한다', () => {
  const source = [
    '표 예시',
    '',
    '<table>',
    '<thead><tr><th>이름</th><th>값</th></tr></thead>',
    '<tbody><tr><td>a</td><td>1</td></tr></tbody>',
    '</table>'
  ].join('\n')
  const raw = renderMarkdown(source)
  const clean = sanitizeHtml(raw)
  assert.match(clean, /<table>/)
  assert.match(clean, /<th>/)
  assert.match(clean, /<td>/)
  assert.equal(clean.includes('<script'), false)
})
