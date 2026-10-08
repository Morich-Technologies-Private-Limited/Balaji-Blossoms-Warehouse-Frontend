import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppWithProvider from "./AppWithProvider";
import { APP_BASE_PATH } from "./constants/basePath";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={APP_BASE_PATH || "/"}>
      <AppWithProvider />
    </BrowserRouter>
  </StrictMode>
);
