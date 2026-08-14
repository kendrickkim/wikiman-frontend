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
- history 라우팅이므로 서버는 모든 경로를 `index.html`로 돌려줘야 합니다 (백엔드 호스팅이 처리)

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

- 카테고리 트리, 글 목록·검색, 키워드
- 에디터: 텍스트 / CKEditor / Summernote / TUI Editor / Editor.js / Markdown / HTML
- 작성중·발행, 공개·비공개
- 글 작성·사이트 관리는 작성자만 가능
