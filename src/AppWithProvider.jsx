import React from "react";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import { BrowserRouter } from "react-router-dom";

export default function AppWithProvider({ basename = "/smss" }) {
  return (
    <StoreProvider>
      <BrowserRouter basename="/smss">
        <App />
      </BrowserRouter>
    </StoreProvider>
  );
}
