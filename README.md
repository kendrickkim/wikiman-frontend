[한국어](README-kr.md)

# Wikiman Frontend

Personal wiki UI built with Vue 3, Quasar, and Pinia.

The backend lives in a separate repository. During development the API defaults to `http://localhost:85`.

## Requirements

- Node.js 22.22 or newer

## Install

```bash
npm install
```

## Development

Start the backend first, then:

```bash
npm run dev
```

- App: `http://localhost:9000`
- `/api` is proxied to the backend

PWA development mode:

```bash
npm run dev:pwa
```

## Build

| Command | Output | Description |
| --- | --- | --- |
| `npm run build` | `dist/spa/` | SPA build |
| `npm run build:pwa` | `dist/pwa/` | **PWA** build (service worker + manifest) |
| `npm run build:backend` | `../backend/public/` | PWA build copied into the backend `public/` folder |

Recommended deploy flow:

```bash
npm run build:backend
```

Override the copy destination:

```bash
# Windows PowerShell example
$env:BACKEND_PUBLIC="D:\path\to\backend\public"
npm run build:backend
```

Build PWA only, then copy manually:

```bash
npm run build:pwa
# copy dist/pwa into backend/public
```

### PWA notes

- Output: `dist/pwa/` (`index.html`, `manifest.json`, `sw.js`, …)
- `/api` is not cached by the service worker (`NetworkOnly`)
- Install/offline behavior needs **HTTPS** (or localhost)
- History routing must fall back to `index.html` on the **backend host**. Do not use Nginx `try_files … /index.html` as a static SPA fallback in front of Node.

## Nginx proxy (Open Graph)

Per-post Open Graph tags are injected by the backend host (`HOST_PORT`, default `:80`). See the [backend README](../backend/README.md) Nginx section for the recommended proxy setup.

### Icons

Regenerate PWA / Apple / MS icons from `public/icons/favicon.svg`:

```bash
npm run icons:pwa
```

Examples: `icon-*.png`, `apple-icon-*.png`, `apple-touch-icon.png`, `ms-icon-144x144.png`

## Checks

```bash
npm run lint    # syntax check
npm test        # unit tests
npm run check   # lint + test + PWA build
```

## npm scripts

| Script | Description |
| --- | --- |
| `dev` | SPA dev server (`:9000`) |
| `dev:pwa` | PWA dev server |
| `build` | SPA production build |
| `build:pwa` | PWA production build |
| `build:backend` | PWA build → backend `public/` |
| `icons:pwa` | Generate icon PNGs from favicon.svg |
| `lint` / `test` / `check` | Checks |

## Feature overview

- Site language: Site admin → General → Korean / English (US) (`src/i18n/koKr.js`, `usEn.js`), including translated backend error codes
- Category tree, post list/search, keywords
- Home: curated homepage posts, or blog mode (recent published full-text feed). Optional pinned homepage posts above the feed
- Editors: Textarea / CKEditor / Summernote / TUI / Editor.js / Markdown / HTML (content carried over when switching)
- Markdown: highlighting, line numbers, code copy, PlantUML
- Mobile quick posts when enabled in settings
- Draft / published, public / private; publish from the draft view
- Writing and site admin are writer-only
- Site admin: General, Categories, Homepage, Blog, Quick posts, Attachments, Data

