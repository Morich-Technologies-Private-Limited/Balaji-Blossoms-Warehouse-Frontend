// src/RouterWrapper.jsx
import React from "react";
import { BrowserRouter, useInRouterContext } from "react-router-dom";

export default function RouterWrapper({ children, basename }) {
  const inRouter = useInRouterContext();

  // Already inside a router (federated): render children as is
  if (inRouter) return children;

  // Standalone: wrap in BrowserRouter
  return <BrowserRouter basename={basename}>{children}</BrowserRouter>;
}
