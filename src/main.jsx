import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppWithProvider from "./AppWithProvider";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/smss">
      <AppWithProvider />
    </BrowserRouter>
  </StrictMode>
);
