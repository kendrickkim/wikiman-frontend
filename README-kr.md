[English](README.md)

# Wikiman Frontend

[Wikiman](https://github.com/kendrickkim/wikiman)의 Vue 3·Quasar 사용자 화면입니다.

위키와 블로그, 글 편집, 검색, 간단 포스트, 사이트 관리 화면을 제공합니다.
[Node 백엔드](https://github.com/kendrickkim/wikiman-backend) 또는
[PHP 백엔드](https://github.com/kendrickkim/wikiman-backend-php)가 필요합니다.

## 개발 시작

필요한 환경:

- Node.js 22.22 이상
- `http://localhost:85`에서 실행 중인 Wikiman 백엔드

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:9000`을 여세요. 개발 서버는 `/api` 요청을
백엔드로 전달합니다.

PWA 개발 모드를 확인하려면:

```bash
npm run dev:pwa
```

## 빌드와 배포

사용하는 백엔드에 맞는 명령을 선택하세요.

```bash
# PWA를 빌드해 Node 백엔드로 복사
npm run build:backend

# PWA를 빌드해 PHP 백엔드로 복사
npm run build:php
```

`build:php`는 `wikiman-backend-php/public/`에 있는 PHP 전면 컨트롤러,
설치 화면, `.htaccess`를 보존합니다.

복사하지 않고 빌드만 하려면:

```bash
npm run build       # dist/spa/
npm run build:pwa   # dist/pwa/
```

PWA 설치와 오프라인 동작은 localhost를 제외하면 HTTPS가 필요합니다.
서비스 워커는 `/api`를 캐시하지 않습니다.

### 리버스 프록시

글별 Open Graph 정보는 백엔드가 HTML에 추가합니다. 페이지 요청을 Node 호스트
(`HOST_PORT`, 기본값 `80`) 또는 PHP의 `public/index.php`로 전달하세요.
리버스 프록시가 정적 `index.html`을 직접 반환하면 글별 공유 정보가 생성되지 않습니다.

자세한 배포 방법은 사용하는 백엔드 문서를 참고하세요.

- [Node 백엔드](https://github.com/kendrickkim/wikiman-backend/blob/main/README-kr.md)
- [PHP 백엔드](https://github.com/kendrickkim/wikiman-backend-php)

## 검사

```bash
npm run lint
npm test
npm run check   # lint + test + PWA 빌드
```

## 자주 쓰는 명령

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | SPA 개발 서버 실행 |
| `npm run dev:pwa` | PWA 개발 모드 실행 |
| `npm run build:backend` | 빌드 후 Node 백엔드로 복사 |
| `npm run build:php` | 빌드 후 PHP 백엔드로 복사 |
| `npm run icons:pwa` | `public/icons/favicon.svg`에서 아이콘 재생성 |

## 제공하는 화면

- 카테고리 트리, 글 목록, 검색, 키워드
- 위키 홈페이지 또는 시간순 블로그 모드
- 텍스트, CKEditor, Summernote, TUI, Editor.js, Markdown, HTML 에디터
- 초안·발행 및 공개·비공개 글
- Markdown 코드 강조, 줄 번호, 복사 버튼, PlantUML
- 모바일 간단 포스트와 정식 글 전환
- 사이트 관리와 한국어·영어 UI

글 작성과 사이트 관리는 작성자 계정만 사용할 수 있습니다.

## 관련 저장소

- [Wikiman 허브](https://github.com/kendrickkim/wikiman)
- [Node 백엔드](https://github.com/kendrickkim/wikiman-backend)
- [PHP 백엔드](https://github.com/kendrickkim/wikiman-backend-php)
- [Android·iOS 앱](https://github.com/kendrickkim/wikiman-flutter)
