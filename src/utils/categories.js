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
      const suffix = category.visibility === 'private' ? ' (비공개)' : ''
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
