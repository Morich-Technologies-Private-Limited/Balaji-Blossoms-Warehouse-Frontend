import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'ssms',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
      },
      shared: ['react', 'react-dom', 'react-router-dom', 'bootstrap']
    })
  ],
  server: {
    port: 5001,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  base: '/smss/'
})