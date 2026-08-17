[한국어](README-kr.md)

# Wikiman Frontend

The Vue 3 and Quasar user interface for [Wikiman](https://github.com/kendrickkim/wikiman).

It provides the wiki, blog, editor, search, Quick Posts, and site-admin screens.
It needs either the [Node backend](https://github.com/kendrickkim/wikiman-backend)
or the [PHP backend](https://github.com/kendrickkim/wikiman-backend-php).

## Start developing

Requirements:

- Node.js 22.22 or newer
- A Wikiman backend running at `http://localhost:85`

```bash
npm install
npm run dev
```

Open `http://localhost:9000`. The development server proxies `/api` to the
backend.

To test the PWA development mode:

```bash
npm run dev:pwa
```

## Build and deploy

Choose the command for the backend you use:

```bash
# Build the PWA and copy it to the Node backend
npm run build:backend

# Build the PWA and copy it to the PHP backend
npm run build:php
```

`build:php` preserves the PHP frontend controller, installer, and `.htaccess`
files already present in `wikiman-backend-php/public/`.

Build without copying:

```bash
npm run build       # dist/spa/
npm run build:pwa   # dist/pwa/
```

PWA installation and offline behavior require HTTPS, except on localhost.
The service worker deliberately does not cache `/api`.

### Reverse proxy

Post-specific Open Graph tags are added by the backend. Forward page requests
to the Node host (`HOST_PORT`, default `80`) or the PHP `public/index.php`.
Serving a static `index.html` as the proxy fallback prevents those tags from
being generated.

See the deployment section of the backend you use:

- [Node backend](https://github.com/kendrickkim/wikiman-backend#frontend-hosting-pwa)
- [PHP backend](https://github.com/kendrickkim/wikiman-backend-php)

## Checks

```bash
npm run lint
npm test
npm run check   # lint + test + PWA build
```

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the SPA development server |
| `npm run dev:pwa` | Start in PWA development mode |
| `npm run build:backend` | Build and copy to the Node backend |
| `npm run build:php` | Build and copy to the PHP backend |
| `npm run icons:pwa` | Regenerate icons from `public/icons/favicon.svg` |

## Product areas

- Category tree, post list, search, and keywords
- Wiki home page or chronological blog mode
- Text, CKEditor, Summernote, TUI, Editor.js, Markdown, and HTML editors
- Draft/published and public/private posts
- Markdown code highlighting, line numbers, copy buttons, and PlantUML
- Mobile Quick Posts and promotion to full posts
- Site administration and Korean/English UI

Writing and site administration require a writer account.

## Related repositories

- [Wikiman hub](https://github.com/kendrickkim/wikiman)
- [Node backend](https://github.com/kendrickkim/wikiman-backend)
- [PHP backend](https://github.com/kendrickkim/wikiman-backend-php)
- [Android·iOS app](https://github.com/kendrickkim/wikiman-flutter)
