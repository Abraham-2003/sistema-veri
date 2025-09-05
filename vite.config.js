import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gestion de Vereficentros',
        short_name: 'Veri',
        description: 'Sistema de reportes para centros de verificación',
        theme_color: '#198754',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.webp',
            sizes: '192x192',
            type: 'webp'
          },
          {
            src: 'logo.webp',
            sizes: '512x512',
            type: 'webp'
          },
          {
            src: 'logo.webp',
            sizes: '180x180',
            type: 'webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
