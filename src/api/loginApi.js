import { LOGIN_URL } from "../constants/apiConstants";
import axios from "axios";

const getNavLinkByRole = (userRole) => {
  const navLinks = {
    // must match an existing route in App.jsx (same as the sidebar "Home" links)
    ADMIN: "/admin",
    MAIN_STORE_MANAGER: "/mainstore/dashboard",
    SUB_STORE_MANAGER: "/substore/dashboard",
    SUPERVISOR: "/supervisor/stock",
    SUB_STORE_SUPERVISOR: "/sales/substore",
    SHOP_MANAGER: "/shop",
  };

  return navLinks[userRole] || "/dashboard";
};

export const loginApi = async (userId, password) => {
  try {
    const response = await axios.get(LOGIN_URL, {
      showLoader: true, // login is a GET but the user must wait for it
      params: {userId, password},
    });

    const data = response.data;

    if (data.status === "SUCCESS" && data.payload) {
      const user = data.payload;

      sessionStorage.setItem("user", JSON.stringify({
        userId: user.userId,
        name: user.name,
        userRole: user.userRole,
        contactNumber: user.contactNumber,
        storeId: user.storeId,
        storeName: user.storeName,
        storeType: user.storeType,
      }));

      sessionStorage.setItem("token", user.token);
      sessionStorage.setItem("storeId", data.payload.storeId);
      sessionStorage.setItem("role", data.payload.userRole);
  

      return {
        success: true,
        navLink: getNavLinkByRole(user.userRole),
      };
    } else {
      return {
        success: false,
        message: data.message || "Login failed",
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Network error occurred",
    };
  }
};
