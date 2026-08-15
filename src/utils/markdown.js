import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import plantumlEncoder from 'plantuml-encoder'

import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import go from 'highlight.js/lib/languages/go'
import graphql from 'highlight.js/lib/languages/graphql'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import less from 'highlight.js/lib/languages/less'
import lua from 'highlight.js/lib/languages/lua'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import nginx from 'highlight.js/lib/languages/nginx'
import objectivec from 'highlight.js/lib/languages/objectivec'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import rust from 'highlight.js/lib/languages/rust'
import scss from 'highlight.js/lib/languages/scss'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import swift from 'highlight.js/lib/languages/swift'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

const registered = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  dockerfile,
  go,
  graphql,
  java,
  javascript,
  json,
  kotlin,
  less,
  lua,
  makefile,
  markdown,
  nginx,
  objectivec,
  php,
  plaintext,
  powershell,
  python,
  ruby,
  rust,
  scss,
  shell,
  sql,
  swift,
  typescript,
  xml,
  yaml
}

for (const [name, lang] of Object.entries(registered)) {
  hljs.registerLanguage(name, lang)
}

const ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  zsh: 'bash',
  html: 'xml',
  htm: 'xml',
  vue: 'xml',
  yml: 'yaml',
  md: 'markdown',
  ps1: 'powershell',
  cs: 'csharp',
  'c++': 'cpp',
  'c#': 'csharp',
  objc: 'objectivec',
  text: 'plaintext',
  txt: 'plaintext'
}

function resolveLanguage(language) {
  const raw = String(language || '').trim().toLowerCase()
  if (!raw || raw === 'plantuml' || raw === 'puml') return ''
  return ALIASES[raw] || raw
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightCode(code, language) {
  const lang = resolveLanguage(language)
  if (lang && hljs.getLanguage(lang)) {
    try {
      return {
        lang,
        html: hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      }
    } catch {
      // fall through
    }
  }
  return { lang: '', html: escapeHtml(code) }
}

function wrapCodeLines(html) {
  const normalized = String(html || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  if (!lines.length) lines.push('')
  return lines.map((line, index) => (
    `<span class="wiki-code-line">`
    + `<span class="wiki-code-line__num">${index + 1}</span>`
    + `<span class="wiki-code-line__content">${line || ' '}</span>`
    + `</span>`
  )).join('')
}

function renderCodeFence(code, language, { codeLineNumbers = false } = {}) {
  const info = String(language || '').trim().toLowerCase().split(/\s+/)[0]
  if (info === 'plantuml' || info === 'puml') return ''
  const { lang, html } = highlightCode(code, info)
  const className = lang
    ? `hljs language-${escapeHtml(lang)}`
    : 'hljs'
  const body = codeLineNumbers ? wrapCodeLines(html) : html
  const preClass = codeLineNumbers ? 'hljs wiki-code--lined' : 'hljs'
  return (
    `<div class="wiki-code-block">`
    + `<button type="button" class="wiki-code-copy" title="복사">복사</button>`
    + `<pre class="${preClass}"><code class="${className}">${body}</code></pre>`
    + `</div>`
  )
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight(code, language) {
    return renderCodeFence(code, language)
  }
})

md.renderer.rules.fence = (tokens, idx, options, env) => {
  const token = tokens[idx]
  const info = (token.info || '').trim().toLowerCase().split(/\s+/)[0]
  if (info === 'plantuml' || info === 'puml') {
    const encoded = plantumlEncoder.encode(token.content || '')
    return `<div class="plantuml-block"><img src="/api/plantuml/${encoded}" alt="PlantUML" /></div>`
  }
  return renderCodeFence(token.content || '', info, {
    codeLineNumbers: env?.codeLineNumbers === true
  })
}

export function renderMarkdown(source, { codeLineNumbers = false } = {}) {
  return md.render(source || '', { codeLineNumbers: codeLineNumbers === true })
}
