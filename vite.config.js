import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mission Control: Discipline Bot',
        short_name: 'Mission Control',
        description: 'The ultimate discipline and productivity enforcer.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: 'https://api.dicebear.com/7.x/shapes/svg?seed=missioncontrol', // placeholder
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'https://api.dicebear.com/7.x/shapes/svg?seed=missioncontrol',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
