import React from "react";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import RouterWrapper from "./RouterWrapper";

export default function AppWithProvider({ basename }) {
  return (
    <StoreProvider>
      <RouterWrapper>
        <App />
      </RouterWrapper>
    </StoreProvider>
  );
}