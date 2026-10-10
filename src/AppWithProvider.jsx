import React from "react";

import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import FeedbackModal from "./component/common/FeedbackModal";
import { installAxiosLoader } from "./component/utils/feedback";

// save calls (POST/PUT/PATCH/DELETE) show the waiting modal until their response arrives; GETs load in background
installAxiosLoader();

export default function AppWithProvider() {
  return (
    <>
      <StoreProvider>
        <App />
      </StoreProvider>
      <FeedbackModal />
    </>
  );
}
