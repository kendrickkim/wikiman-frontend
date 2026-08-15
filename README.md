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

빌드된 `index.html`의 기본 `og:*`는 사이트 공통 값입니다. 글별 제목·설명·이미지는 프론트 JS가 아니라 **백엔드 호스트(`HOST_PORT`, 기본 `:80`)** 가 URL(`/posts/123`)을 보고 HTML에 넣습니다. 크롤러는 JS를 실행하지 않으므로, 프록시는 HTML을 정적 빌드로 주지 말고 백엔드 호스트로 넘겨야 합니다.

권장 배포: `npm run build:backend` → 백엔드 `npm start` → 프록시는 **`:80`(호스트)** 로 전달.

### Nginx Proxy Manager

1. **Proxy Hosts → Details**
   - Forward Hostname / IP: 백엔드가 돌아가는 호스트
   - Forward Port: **`80`** (호스트. API만 `:85`로 두면 OG가 바뀌지 않음)
   - Cache Assets: 끔 권장
2. **(선택) Custom Locations**
   - `/api`만 API 포트(`85`)로 보낼 수 있음. 그 외(`/`, `/posts/...`)는 Details의 `:80`으로 유지
3. **Advanced → Custom Nginx Configuration**에 아래를 추가합니다.

```nginx
# HTML·글 URL은 캐시하지 않음 (크롤러가 낡은 OG를 받지 않게)
proxy_cache_bypass $http_upgrade;
proxy_no_cache 1;

# 절대 URL(og:url, og:image)용
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host  $host;
proxy_set_header Host $host;
```

하지 말 것:

- `try_files … /index.html`로 SPA 폴백을 프록시에서 처리하기
- `root` / `alias`로 `dist/pwa`를 OpenResty가 직접 서빙하기

백엔드 `.env`에 `PUBLIC_URL=https://your.domain`을 두면 canonical·이미지 절대 URL이 안정적입니다.

확인:

```bash
curl -sI https://your.domain/posts/123
# X-Powered-By: Express → 백엔드 호스트까지 도달

curl -s https://your.domain/posts/123 | findstr /i "og:title"
# 글 제목 한 줄만 (사이트 기본 제목과 중복되면 안 됨)
```

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
- 모바일 간단 포스트: 설정에서 켜면 모바일 홈 상단에 접을 수 있는 간단 입력창이 보인다. 목록은 사이드 메뉴의 간단 포스트.
- 작성중·발행, 공개·비공개
- 글 작성·사이트 관리는 작성자만 가능
