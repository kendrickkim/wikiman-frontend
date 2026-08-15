import { t } from '../i18n/index.js'
export function buildCategoryTree(categories) {
  const byParent = new Map()
  for (const category of categories) {
    const key = category.parent_id ?? 0
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(category)
  }
  const build = (parentId) => (byParent.get(parentId) || []).map((category) => ({
    id: category.id,
    label: category.name,
    name: category.name,
    visibility: category.visibility === 'private' ? 'private' : 'public',
    parentId: category.parent_id,
    children: build(category.id)
  }))
  return build(0)
}

/** blockedIds에 든 노드와 그 하위를 트리에서 제외합니다. */
export function pruneCategoryTree(nodes, blockedIds) {
  const blocked = blockedIds instanceof Set ? blockedIds : new Set(blockedIds || [])
  const walk = (list) => (list || [])
    .filter((node) => !blocked.has(node.id))
    .map((node) => ({ ...node, children: walk(node.children) }))
  return walk(nodes)
}

export function findCategoryPath(categories, categoryId) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const names = []
  let current = byId.get(Number(categoryId))
  const seen = new Set()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    names.unshift(current.name)
    current = current.parent_id ? byId.get(current.parent_id) : null
  }
  return names
}

export function buildCategoryFlatOptions(categories) {
  const byParent = new Map()
  for (const category of categories) {
    const key = category.parent_id ?? 0
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(category)
  }
  const rows = []
  const walk = (parentId, depth) => {
    for (const category of byParent.get(parentId) || []) {
      const suffix = category.visibility === 'private' ? t('remaining.k158') : ''
      rows.push({
        id: category.id,
        name: category.name,
        parent_id: category.parent_id,
        visibility: category.visibility === 'private' ? 'private' : 'public',
        label: `${'— '.repeat(depth)}${category.name}${suffix}`
      })
      walk(category.id, depth + 1)
    }
  }
  walk(0, 0)
  return rows
}
