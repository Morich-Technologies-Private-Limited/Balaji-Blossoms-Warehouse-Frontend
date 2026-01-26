import React from "react";

import App from "./App";
import { StoreProvider } from "./context/StoreContext";

export default function AppWithProvider() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
