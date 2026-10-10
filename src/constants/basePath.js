// Sub path the app is served from ("" when served from the root).
// Comes from VITE_BASE_PATH (see vite.config.js), e.g. VITE_BASE_PATH=/smss -> "/smss"
export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, "");
