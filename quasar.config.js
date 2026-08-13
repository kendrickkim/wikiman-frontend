import { defineConfig } from '#q-app'

export default defineConfig(() => {
  return {
    boot: ['axios'],
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
    animations: []
  }
})
