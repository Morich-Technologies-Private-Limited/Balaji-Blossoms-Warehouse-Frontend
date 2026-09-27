import axios from "axios";
import {
  SUPERVISOR_LOGIN_URL,
  SELF_SUPERVISOR_PROFILE_URL,
  SELF_SUPERVISOR_INVENTORY_URL,
  SELF_SUPERVISOR_USAGE_URL,
  SELF_SUPERVISOR_TRANSFER_HISTORY_URL,
} from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

// All API calls available to a logged-in supervisor (own data only, resolved from the token)

const SUPERVISOR_HOME = "/supervisor/stock";

const authHeaders = () => {
  const { token } = getSessionData();
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const handleError = (error, fallbackMessage) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error("API Error:", error.response.data);
      const data = error.response.data;
      const details = Array.isArray(data?.errorList) && data.errorList.length ? `: ${data.errorList.join(", ")}` : "";
      throw new Error((data?.message || fallbackMessage) + details);
    } else if (error.request) {
      console.error("No response from server");
      throw new Error("Server not responding. Please try again later.");
    }
  }
  console.error("Unexpected Error:", error);
  throw new Error(error.message || "Something went wrong");
};

const get = async (url, fallbackMessage) => {
  try {
    return await axios.get(url, { headers: authHeaders() });
  } catch (error) {
    handleError(error, fallbackMessage);
  }
};

/* ============ Login (phone number + password) ============ */

export const supervisorLoginApi = async (phoneNumber, password) => {
  try {
    const response = await axios.post(SUPERVISOR_LOGIN_URL, null, {
      params: { phoneNumber, password },
    });

    const data = response.data;

    if (data.status === "SUCCESS" && data.payload) {
      const supervisor = data.payload;

      sessionStorage.setItem("user", JSON.stringify({
        userId: supervisor.userId,
        supervisorId: supervisor.supervisorId,
        name: supervisor.name,
        userRole: supervisor.userRole,
        storeName: supervisor.storeName,
      }));

      sessionStorage.setItem("token", supervisor.token);
      sessionStorage.setItem("storeId", supervisor.storeId);
      sessionStorage.setItem("role", supervisor.userRole);

      return { success: true, navLink: SUPERVISOR_HOME };
    }

    return { success: false, message: data.message || "Login failed" };
  } catch (error) {
    console.error("Supervisor login error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Network error occurred",
    };
  }
};

/* ============ Own data ============ */

export const fetchMyProfile = () =>
  get(SELF_SUPERVISOR_PROFILE_URL, "Failed to fetch profile");

export const fetchMyInventory = () =>
  get(SELF_SUPERVISOR_INVENTORY_URL, "Failed to fetch stock");

export const fetchMyUsage = () =>
  get(SELF_SUPERVISOR_USAGE_URL, "Failed to fetch usage history");

export const fetchMyTransferHistory = () =>
  get(SELF_SUPERVISOR_TRANSFER_HISTORY_URL, "Failed to fetch received stock");

// usage: { remark, usageList: [{ supervisorInventoryId, quantity, usageMetadata }] }
export const logMyUsage = async (usage) => {
  try {
    return await axios.post(SELF_SUPERVISOR_USAGE_URL, usage, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to log usage");
  }
};
