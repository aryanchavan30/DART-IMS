import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from "vite-plugin-pwa";
import mkcert from 'vite-plugin-mkcert'
const manifestForPlugIn = {
  registerType:'prompt',
  includeAssests:['favicon.ico', "apple-touc-icon.png", "masked-icon.svg"],
  manifest:{
    name:"Intern Management System",
    short_name:"IMS",
    description:"I am a simple vite app",
    icons:[{
      src: '/android-chrome-192x192.png',
      sizes:'192x192',
      type:'image/png',
      purpose:'favicon'
    },
    {
      src:'/android-chrome-512x512.png',
      sizes:'512x512',
      type:'image/png',
      purpose:'favicon'
    },
    {
      src: '/apple-touch-icon.png',
      sizes:'180x180',
      type:'image/png',
      purpose:'apple touch icon',
    },
    {
      src: '/maskable_icon.png',
      sizes:'512x512',
      type:'image/png',
      purpose:'any maskable',
    }
  ],
  theme_color:'#171717',
  background_color:'#f0e7db',
  display:"standalone",
  scope:'/',
  start_url:"/",
  orientation:'portrait'
  }
}
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), VitePWA({
        devOptions: {
          enabled: true // For making sure that the PWA is testable from the Local dev environment
        },
        registerType: 'autoUpdate',
        manifest: {
          name: "Intern Management System",
          short_name: "IMS",
          icons: [
            {
              "src": "/favicon.ico",
              "sizes": "64x64 32x32 24x24 16x16",
              "type": "image/x-icon"
            },
            {
              "src": "/favicon-16x16.png",
              "type": "image/png",
              "sizes": "16x16"
            },
            {
              "src": "/favicon-32x32.png",
              "type": "image/png",
              "sizes": "32x32"
            },
            {
              "src": "/pwa-192x192.png",
              "type": "image/png",
              "sizes": "192x192"
            },
            {
              "src": "/pwa-512x512.png",
              "type": "image/png",
              "sizes": "512x512",
              "purpose": "any maskable" // Icon format that ensures that your PWA icon looks great on all Android devices
            }
          ],
          theme_color: '#f21313',
        },
      }),],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
