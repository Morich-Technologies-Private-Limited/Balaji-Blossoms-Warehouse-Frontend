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
        "./AppWithProvider": "./src/federated.jsx", // only federated entry
      },
      shared: {
        react: { singleton: true, eager: true },
        "react-dom": { singleton: true, eager: true },
        "react-router-dom": { singleton: true, eager: true },
        scheduler: { singleton: true, eager: true },
      },
    }),
  ],
});
