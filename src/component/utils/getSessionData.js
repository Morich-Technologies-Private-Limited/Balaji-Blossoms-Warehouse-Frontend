export const getSessionData = () => {
  const user = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");
  const storeId = sessionStorage.getItem("storeId");
  const role = sessionStorage.getItem("role");

  return {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    storeId: storeId || null,
    role: role || null,
    isAuthenticated: !!token,
  };
};
