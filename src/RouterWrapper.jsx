import React from "react";
import {
  BrowserRouter,
  MemoryRouter,
  useInRouterContext,
} from "react-router-dom";

export default function RouterWrapper({ children, basename }) {
  const inRouter = useInRouterContext();

  // 👉 Running inside Central (federated)
  if (inRouter) {
    return (
      <MemoryRouter initialEntries={["/"]}>
        {children}
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter basename={basename}>
      {children}
    </BrowserRouter>
  );
}

