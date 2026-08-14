# Wikiman Frontend

Vue 3 · Quasar 2 · Pinia · Vue Router · JavaScript. Node 22.22+.

개발: 백엔드 API(`:85`)를 띄운 뒤 `npm run dev` (`:9000`). `/api`는 백엔드로 프록시됩니다.

## 구조

- `src/pages/` — 목록·상세·작성·휴지통·로그인. 사이트 관리는 `src/pages/settings/`
- `src/layouts/MainLayout.vue` — 사이드바 카테고리, 검색, 사이트 제목
- `src/stores/` — `auth`, `wiki`, `settings`
- `src/composables/useLayout.js` — 데스크톱은 `$q.screen.gt.sm` (1024px)
- `src/utils/api.js` — axios. `src/utils/title.js` — `displayTitle()`

작성자만 글 작성·수정·설정. `auth.canWrite`. 휴지통은 작성자만.

## UI

- 문구는 한국어. 빈 제목은 `displayTitle()`로 `(제목 없음)`.
- 데스크톱 본문 최대 너비 `wiki-main--wide` (1380px).
- 다크모드는 사이트 설정 `theme`. Editor.js 툴바(`+` 등), CKEditor, Summernote는 `body.body--dark` 스타일을 유지합니다.
- `/`는 홈페이지로 지정된 글을 보여 줍니다. 전체 글 목록은 `/list`. 카테고리 트리의 **홈** / **전체 글**을 구분합니다. 카테고리 목록은 `/category/{id}`(미분류는 `/category/uncategorized`).
- 글 목록은 페이지 단위(기본 10개, 10/20/50/100 선택). 페이지는 `?page=`.
- 왼쪽 **키워드** 메뉴는 `/keywords`. 키워드 선택 결과는 `/keyword/{키워드}`로 정확히 일치하는 키워드의 글만 표시합니다.
- 카테고리는 공개/비공개. 비공개 카테고리(및 상위가 비공개인 하위)의 글은 로그인 후에만 목록·본문 조회.
- 왼쪽 카테고리 트리 기본 펼침은 사이트 관리 → 일반의 `categoryTreeExpand`(`expanded`|`collapsed`|`root`).
- 글 작성·수정: CKEditor 기본, Summernote·Editor.js·Markdown·HTML 선택. 카테고리 선택 옆에서 카테고리 관리.
- Markdown 코드 펜스(````js` 등)는 highlight.js로 언어별 하이라이트합니다. `plantuml`/`puml`은 기존처럼 다이어그램으로 렌더합니다.
- 액션 버튼(저장·발행·취소·삭제) 높이를 `wiki-edit-actions`로 맞춥니다.
- 사이트 관리(`/settings`)는 일반·카테고리·홈페이지·첨부파일·백업/복구 메뉴로 나뉩니다.
- 글자 스케일은 사이트 관리 → 일반에서 선택(60~120%, 기본 100). `--wiki-font-scale`은 `html` 변수로 두고, 실제 크기는 `.wiki-content`와 편집 영역에만 적용합니다.
- 사이트 관리에서 파비콘을 바꿀 수 있습니다. **기본값으로 되돌리기**는 바로 저장됩니다.
- 첨부 파일 최대 용량(MB)과 미연결 파일 정리는 사이트 관리 → 첨부파일에서 합니다.
- 백업/복구는 `.wkmbak` 파일로 합니다. 복구 전 파일 검사 후 확인 대화상자로 덮어씁니다.

## PWA

- 개발: `npm run dev:pwa`
- 빌드: `npm run build:pwa` → `dist/pwa/`
- 백엔드 배포: `npm run build:backend` (PWA 빌드 후 `backend/public/`에 복사)
- 아이콘 재생성: `npm run icons:pwa` (`public/icons/favicon.svg` 기준)

## 하지 말 것

- TypeScript / Options API로 전환.
- Quasar 레이아웃을 다른 UI 라이브러리로 교체.
- 백엔드 코드를 이 저장소에 넣기. API 변경은 `../backend`.
- 사용자가 요청하지 않은 커밋·푸시.
