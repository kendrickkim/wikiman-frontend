import { defineConfig } from '#q-app'

export default defineConfig(() => {
  return {
    boot: ['i18n'],
    css: ['app.scss'],
    extras: [
      'roboto-font',
      'material-icons'
    ],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari16'],
        node: 'node22'
      },
      vueRouterMode: 'history',
      publicPath: '/'
    },
    devServer: {
      open: false,
      port: 9000,
      proxy: {
        '/api': {
          target: 'http://localhost:85',
          changeOrigin: true
        }
      }
    },
    framework: {
      config: {
        brand: {
          primary: '#1f6feb',
          secondary: '#3d4a5c',
          accent: '#7c5cbf',
          dark: '#1b1f24',
          positive: '#2f9e44',
          negative: '#e03131',
          info: '#1971c2',
          warning: '#f08c00'
        }
      },
      plugins: ['Notify', 'Dialog', 'Dark']
    },
    animations: [],
    pwa: {
      workboxMode: 'GenerateSW',
      manifestFilename: 'manifest.json',
      extendPWAManifestJson (json) {
        json.name = 'Wikiman'
        json.short_name = 'Wikiman'
        json.description = 'Personal wiki'
        json.lang = 'ko'
        json.start_url = '/'
        json.scope = '/'
        json.display = 'standalone'
        json.orientation = 'any'
        json.background_color = '#ffffff'
        json.theme_color = '#1f6feb'
        delete json.display_override
      },
      extendPWAGenerateSWOptions (cfg) {
        cfg.navigateFallback = 'index.html'
        cfg.navigateFallbackDenylist = [/^\/api\//]
        cfg.runtimeCaching = [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly'
          }
        ]
      }
    }
  }
})
