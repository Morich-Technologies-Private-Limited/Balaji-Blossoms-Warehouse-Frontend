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
        "./App": "./src/App.jsx",               // optional, standalone use
        "./AppWithProvider": "./src/AppWithProvider.jsx", // central should use this
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        "react-router-dom": { singleton: true },
      },
    }),
  ],
});
