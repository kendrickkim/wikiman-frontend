# Wikiman Frontend

Vue 3 · Quasar 2 · Pinia · Vue Router · JavaScript. Node 22.22+.

개발: 백엔드(`:3001`)를 띄운 뒤 `npm run dev` (`:9000`). `/api`는 백엔드로 프록시됩니다.

## 구조

- `src/pages/` — 목록·상세·작성·설정·휴지통·로그인
- `src/layouts/MainLayout.vue` — 사이드바 카테고리, 검색, 사이트 제목
- `src/stores/` — `auth`, `wiki`, `settings`
- `src/composables/useLayout.js` — 데스크톱은 `$q.screen.gt.sm` (1024px)
- `src/utils/api.js` — axios. `src/utils/title.js` — `displayTitle()`

작성자만 글 작성·수정·설정. `auth.canWrite`. 휴지통은 로그인 필요.

## UI

- 문구는 한국어. 빈 제목은 `displayTitle()`로 `(제목 없음)`.
- 데스크톱 본문 최대 너비 `wiki-main--wide` (1380px).
- 다크모드는 사이트 설정 `theme`. Editor.js 툴바(`+` 등)는 `body.body--dark` 스타일을 유지합니다.
- `/`는 홈페이지로 지정된 글을 보여 줍니다. 목록은 `/?view=list`. 카테고리 트리의 **홈** / **전체 글**을 구분합니다.
- 글 작성·수정: Editor.js 기본, Markdown·HTML 선택. 카테고리 선택 옆에서 카테고리 관리.
- 액션 버튼(저장·발행·취소·삭제) 높이를 `wiki-edit-actions`로 맞춥니다.

## 하지 말 것

- TypeScript / Options API로 전환.
- Quasar 레이아웃을 다른 UI 라이브러리로 교체.
- 백엔드 코드를 이 저장소에 넣기. API 변경은 `../backend`.
- 사용자가 요청하지 않은 커밋·푸시.
