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
