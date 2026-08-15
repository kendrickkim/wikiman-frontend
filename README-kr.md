[English](README.md)

# Wikiman Frontend

개인 위키 UI. Vue 3 + Quasar + Pinia.

백엔드는 별도 저장소입니다. 개발 시 API 기본 주소는 `http://localhost:85` 입니다.

## 요구 사항

- Node.js 22.22 이상

## 설치

```bash
npm install
```

## 개발

백엔드를 먼저 띄운 뒤:

```bash
npm run dev
```

- 주소: `http://localhost:9000`
- `/api` 요청은 백엔드로 프록시됩니다.

PWA 모드로 개발하려면:

```bash
npm run dev:pwa
```

## 빌드

| 명령 | 결과 | 설명 |
| --- | --- | --- |
| `npm run build` | `dist/spa/` | 일반 SPA 빌드 |
| `npm run build:pwa` | `dist/pwa/` | **PWA** 빌드 (서비스 워커·매니페스트 포함) |
| `npm run build:backend` | `../backend/public/` | PWA 빌드 후 백엔드 `public/`에 복사 |

권장 배포 흐름:

```bash
npm run build:backend
```

복사 위치를 바꾸려면:

```bash
# Windows PowerShell 예
$env:BACKEND_PUBLIC="D:\path\to\backend\public"
npm run build:backend
```

PWA만 빌드한 뒤 수동 복사:

```bash
npm run build:pwa
# dist/pwa 내용을 백엔드 public/ 에 복사
```

### PWA 참고

- 결과물: `dist/pwa/` (`index.html`, `manifest.json`, `sw.js` 등)
- `/api`는 서비스 워커에서 캐시하지 않습니다 (`NetworkOnly`)
- 설치·오프라인 동작은 **HTTPS**(또는 localhost)에서 확인하세요
- history 라우팅이므로 서버는 모든 경로를 `index.html`로 돌려줘야 합니다 (**백엔드 호스트**가 처리). Nginx에서 `try_files … /index.html`로 직접 폴백하지 마세요.

## Nginx 프록시 (공유 메타 / Open Graph)

자세한 프록시 설정은 [backend README-kr](../backend/README-kr.md)의 Nginx 절을 보세요. 글별 Open Graph는 백엔드 호스트(`HOST_PORT`, 기본 `:80`)가 HTML에 넣습니다.

### 아이콘

`public/icons/favicon.svg`를 기준으로 PWA·Apple·MS 아이콘을 다시 만들 때:

```bash
npm run icons:pwa
```

생성 예: `icon-*.png`, `apple-icon-*.png`, `apple-touch-icon.png`, `ms-icon-144x144.png`

## 검사

```bash
npm run lint    # 문법 검사
npm test        # 단위 테스트
npm run check   # lint + test + PWA 빌드
```

## npm 스크립트 요약

| 스크립트 | 설명 |
| --- | --- |
| `dev` | SPA 개발 서버 (`:9000`) |
| `dev:pwa` | PWA 개발 서버 |
| `build` | SPA 프로덕션 빌드 |
| `build:pwa` | PWA 프로덕션 빌드 |
| `build:backend` | PWA 빌드 → 백엔드 `public/` 복사 |
| `icons:pwa` | favicon.svg에서 아이콘 PNG 생성 |
| `lint` / `test` / `check` | 검사 |

## 동작 개요

- 사이트 언어: 사이트 관리 → 일반에서 한국어 / English (US) 선택 (`src/i18n/koKr.js`, `usEn.js`), 백엔드 오류 코드도 선택 언어로 번역
- 카테고리 트리, 글 목록·검색, 키워드
- 홈: 홈페이지 지정 글, 또는 블로그 모드(최근 발행 본문 피드). 블로그에서 홈페이지 글 선표시 가능
- 에디터: 텍스트 / CKEditor / Summernote / TUI Editor / Editor.js / Markdown / HTML (전환 시 본문 이어받기)
- Markdown: 하이라이트·라인 번호·코드 복사, PlantUML
- 모바일 간단 포스트: 설정에서 켜면 모바일 홈 상단에 접을 수 있는 간단 입력창이 보인다. 목록은 사이드 메뉴의 간단 포스트.
- 초안·발행, 공개·비공개. 초안 보기에서 발행 가능
- 글 작성·사이트 관리는 작성자만 가능
- 사이트 관리: 일반·카테고리·홈페이지·블로그·간단 포스트·첨부파일·데이터관리

