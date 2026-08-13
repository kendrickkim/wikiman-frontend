# Wikiman Frontend

개인 위키 UI. Vue 3 + Quasar.

백엔드는 별도 저장소입니다. API 기본 주소는 `http://localhost:3001` 입니다.

## 요구 사항

- Node.js 22.22 이상

## 개발

백엔드를 먼저 띄운 뒤:

```bash
npm install
npm run dev
```

브라우저는 `http://localhost:9000` 을 엽니다. `/api` 요청은 백엔드로 프록시됩니다.

## 빌드

```bash
npm run build
```

결과는 `dist/spa` 입니다. 백엔드가 사이트를 호스팅하려면 이 폴더 내용을 백엔드의 `public/` 에 복사하세요.

백엔드 저장소가 이 폴더와 형제로 있으면:

```bash
npm run build:backend
```

`BACKEND_PUBLIC` 환경 변수로 복사 위치를 지정할 수 있습니다.

## 동작

- 왼쪽 카테고리 트리, 오른쪽 글 목록, 검색
- Editor.js 기본, Markdown(PlantUML) 선택
- 작성중/발행, 공개/비공개
- 글 작성은 작성자 한 명만 가능
