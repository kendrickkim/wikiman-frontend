import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchGithubReleaseNotes,
  githubReleaseNotes
} from '../src/utils/githubRelease.js'

test('GitHub 릴리스 본문을 변경 내역으로 읽는다', () => {
  assert.equal(githubReleaseNotes(null), '')
  assert.equal(githubReleaseNotes({ body: '  ## 변경 사항\n- 업데이트  ' }), '## 변경 사항\n- 업데이트')
})

test('최신 릴리스 API에서 변경 내역을 가져온다', async () => {
  const notes = await fetchGithubReleaseNotes(async () => ({
    ok: true,
    json: async () => ({ tag_name: 'v0.1.6', body: '임시 테스트 릴리스' })
  }))
  assert.equal(notes, '임시 테스트 릴리스')
})
