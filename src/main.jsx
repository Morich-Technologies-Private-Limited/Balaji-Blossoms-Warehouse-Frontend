import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  useInRouterContext,
} from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { StoreProvider } from "./context/StoreContext";

function RouterWrapper({ children }) {
  const inRouter = useInRouterContext();
  return inRouter ? children : <BrowserRouter basename="/smss/">{children}</BrowserRouter>;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoreProvider>
      <RouterWrapper>
        <App />
      </RouterWrapper>
    </StoreProvider>
  </StrictMode>
);
