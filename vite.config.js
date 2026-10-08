import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

// VITE_BASE_PATH (env): sub path the app is served from, e.g. /smss. Empty / not set = served from the root.
const resolveBase = (basePath = "") => {
  const trimmed = basePath.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    base: resolveBase(env.VITE_BASE_PATH),
    build: {
      target: "esnext",
      minify: true,
      cssCodeSplit: false,
    },
    plugins: [
      react(),
      federation({
        name: "smss",
        filename: "remoteEntry.js",
        exposes: {
          "./AppWithProvider": "./src/federated.jsx",
        },
        shared: {
          react: { singleton: true, eager: true },
          "react-dom": { singleton: true, eager: true },
          "react-router-dom": { singleton: true, eager: true },
          scheduler: { singleton: true, eager: true },
          recharts: { singleton: true },  // ADD THIS
        },
      }),
    ],
  };
});
