import { LOGIN_URL } from "../constants/apiConstants";
import axios from "axios";

const getNavLinkByRole = (userRole) => {
  const navLinks = {
    ADMIN: "/admin",
    MAIN_STORE_MANAGER: "/mainstore",
    SUB_STORE_MANAGER: "/substore",
    SUB_STORE_SUPERVISOR: "/sales/substore",
    SHOP_MANAGER: "/shop",
  };

  return navLinks[userRole] || "/dashboard";
};

export const loginApi = async (userId, password) => {
  try {
    console.log(userId);
    console.log(password);
    const response = await axios.get(LOGIN_URL, {
      params: {userId,password},
    });


    const data = response.data;

    if (data.status === "SUCCESS" && data.payload) {
      const user = data.payload;

      sessionStorage.setItem("user", JSON.stringify({
        userId: user.userId,
        name: user.name,
        userRole: user.userRole,
      }));

      sessionStorage.setItem("token", user.token);
      sessionStorage.setItem("storeId", user.storeId);

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
