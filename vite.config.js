import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  base: "/smss/",
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  plugins: [
    react(),
    federation({
      name: "smss",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.jsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        "react-dom": { singleton: true, requiredVersion: '^18.0.0' },
        "react-router-dom": { singleton: true },
      },
    }),
  ],
})