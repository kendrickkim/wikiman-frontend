import MarkdownIt from 'markdown-it'
import plantumlEncoder from 'plantuml-encoder'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

const defaultFence = md.renderer.rules.fence || ((tokens, idx, options, env, slf) => slf.renderToken(tokens, idx, options))

md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const token = tokens[idx]
  const info = (token.info || '').trim().toLowerCase()
  if (info === 'plantuml' || info === 'puml') {
    const encoded = plantumlEncoder.encode(token.content || '')
    return `<div class="plantuml-block"><img src="/api/plantuml/${encoded}" alt="PlantUML" /></div>`
  }
  return defaultFence(tokens, idx, options, env, slf)
}

export function renderMarkdown(source) {
  return md.render(source || '')
}
