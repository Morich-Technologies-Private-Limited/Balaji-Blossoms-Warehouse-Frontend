// src/RouterWrapper.jsx
import React from "react";
import { BrowserRouter, useInRouterContext } from "react-router-dom";
import { APP_BASE_PATH } from "./constants/basePath";

export default function RouterWrapper({ children, basename = APP_BASE_PATH || '/' }) {
   const isFederated = window.__IS_FEDERATED__ === true;

  // Already inside a router (federated): render children as is
  if (isFederated) return children;

  // Standalone: wrap in BrowserRouter with basename
  return <BrowserRouter basename={basename}>{children}</BrowserRouter>;
}
