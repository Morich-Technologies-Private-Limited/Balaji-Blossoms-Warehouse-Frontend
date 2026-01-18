export const Logout = (navigate) => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  
  sessionStorage.removeItem("storeId");
  sessionStorage.removeItem("STORE_LIST");
  sessionStorage.removeItem("STORE_LIST_TIME");

  navigate("/login", { replace: true });
};
