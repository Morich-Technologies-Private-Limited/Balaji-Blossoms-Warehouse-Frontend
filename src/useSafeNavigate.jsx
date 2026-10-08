import { useNavigate } from "react-router-dom";
import { APP_BASE_PATH } from "./constants/basePath";

export function useSafeNavigate(appBase = APP_BASE_PATH) {
  const navigate = useNavigate();
  const isFederated = window.__IS_FEDERATED__ === true;

  console.log("useSafeNavigate - isFederated:", isFederated);

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
