import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { StoreProvider } from "./context/StoreContext";
import FeedbackModal from "./component/common/FeedbackModal";
import { installAxiosLoader } from "./component/utils/feedback";

// save calls (POST/PUT/PATCH/DELETE) show the waiting modal until their response arrives; GETs load in background
installAxiosLoader();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
    <FeedbackModal />
  </StrictMode>
);
