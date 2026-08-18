export const GITHUB_LATEST_RELEASE_URL =
  'https://api.github.com/repos/kendrickkim/wikiman-flutter/releases/latest'

export function githubReleaseNotes(raw) {
  if (!raw || typeof raw !== 'object') return ''
  return String(raw.body || '').trim()
}

export async function fetchGithubReleaseNotes(fetcher = fetch) {
  const response = await fetcher(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!response.ok) throw new Error('GitHub 릴리스를 확인하지 못했습니다.')
  return githubReleaseNotes(await response.json())
}
