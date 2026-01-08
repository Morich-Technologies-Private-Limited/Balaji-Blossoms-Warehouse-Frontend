export const Logout = (navigate) => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("storeId");
  navigate("/login", { replace: true });
};
