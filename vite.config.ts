import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.yanus.bond',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: {
        name: 'yANUs - 동아리 그룹웨어',
        short_name: 'yANUs',
        description: '업무 채팅, 출퇴근, 파일 공유, AI 챗봇',
        theme_color: '#9680cc',
        background_color: '#111118',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/yanus-logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
