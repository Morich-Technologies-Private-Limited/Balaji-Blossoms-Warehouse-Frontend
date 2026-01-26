import React from "react";
import { BrowserRouter, useInRouterContext } from "react-router-dom";

export default function RouterWrapper({ children, basename }) {
  const inRouter = useInRouterContext();
  if (inRouter) return children; // Already in Central router
  return <BrowserRouter basename={basename}>{children}</BrowserRouter>; // Standalone
}
