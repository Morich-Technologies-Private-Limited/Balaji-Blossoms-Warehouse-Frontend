import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { StoreProvider } from "./context/StoreContext";
import RouterWrapper from "./RouterWrapper";


createRoot(document.getElementById("root")).render(
  <StrictMode>
  <StoreProvider>
      <RouterWrapper basename={'/smss'}>
        <App />
      </RouterWrapper>
    </StoreProvider>
  </StrictMode>
);
