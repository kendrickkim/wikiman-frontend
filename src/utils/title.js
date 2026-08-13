export function displayTitle(title) {
  const value = String(title || '').trim()
  return value || '(제목 없음)'
}
