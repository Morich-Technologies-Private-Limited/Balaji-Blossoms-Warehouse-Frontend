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

// Dev mode mock users
const DEV_USERS = {
  ADMIN: {
    userId: "admin@dev.com",
    name: "Admin User",
    userRole: "ADMIN",
    token: "dev-token-admin-12345",
    storeId: "STORE001"
  },
  MAIN_STORE_MANAGER: {
    userId: "mainstore@dev.com",
    name: "Main Store Manager",
    userRole: "MAIN_STORE_MANAGER",
    token: "dev-token-mainstore-12345",
    storeId: "STORE001"
  },
  SUB_STORE_MANAGER: {
    userId: "substore@dev.com",
    name: "Sub Store Manager",
    userRole: "SUB_STORE_MANAGER",
    token: "dev-token-substore-12345",
    storeId: "SUBSTORE001"
  },
  SUB_STORE_SUPERVISOR: {
    userId: "supervisor@dev.com",
    name: "Sub Store Supervisor",
    userRole: "SUB_STORE_SUPERVISOR",
    token: "dev-token-supervisor-12345",
    storeId: "SUBSTORE001"
  },
  SHOP_MANAGER: {
    userId: "shop@dev.com",
    name: "Shop Manager",
    userRole: "SHOP_MANAGER",
    token: "dev-token-shop-12345",
    storeId: "SHOP001"
  }
};

// Dev mode login function
export const devModeLogin = (role) => {
  const user = DEV_USERS[role];
  
  console.log("Development")

  if (!user) {
    throw new Error("Invalid role selected");
  }

  // Store in sessionStorage
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
};

// Production login API
export const loginApi = async (userId, password) => {
  try {
    const response = await axios.get(LOGIN_URL, {
      params: {userId, password},
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
      sessionStorage.setItem("storeId", data.storeId);

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