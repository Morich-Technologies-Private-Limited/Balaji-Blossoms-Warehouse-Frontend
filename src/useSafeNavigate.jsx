import { useNavigate } from "react-router-dom";

export function useSafeNavigate(appBase = "/smss") {
  const navigate = useNavigate();
  const isFederated = window.__IS_FEDERATED__ === true;

  return (to, options) => {
    // Standalone → normal navigation
    if (!isFederated) {
      navigate(to, options);
      return;
    }

    // Federated → prefix absolute paths
    if (typeof to === "string" && to.startsWith("/")) {
      navigate(`${appBase}${to}`, options);
    } else {
      navigate(to, options);
    }
  };
}
