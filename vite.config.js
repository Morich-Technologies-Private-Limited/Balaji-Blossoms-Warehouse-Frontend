import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  base: "/smss/",

  build: {
    target: "esnext",
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
        "./AppWithProvider": "./src/AppWithProvider.jsx",
      },

      shared: {
        react: { singleton: true, requiredVersion: false },
        "react-dom": { singleton: true, requiredVersion: false },
        scheduler: { singleton: true, requiredVersion: false },
      },
    }),
  ],
});
