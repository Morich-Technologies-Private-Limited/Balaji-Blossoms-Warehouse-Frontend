import axios from "axios";
import {
  INVENTORY_CORRECTION_STATUS_URL,
  INVENTORY_CORRECTION_WINDOW_URL,
  INVENTORY_CORRECTION_WINDOW_CLOSE_URL,
  INVENTORY_CORRECTION_APPLY_URL,
  INVENTORY_CORRECTION_LOGS_URL,
} from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

// All inventory correction API calls

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

// Store view: { state, startAt, endAt, storeAllowed, canCorrect, ... }
export const fetchCorrectionStatus = async () => {
  try {
    return await axios.get(INVENTORY_CORRECTION_STATUS_URL, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to fetch correction status");
  }
};

/* ============ Admin: correction window ============ */

// { state, startAt, endAt, allowedStoreIds, allowedStoreNames, updatedBy, updatedAt }
export const fetchCorrectionWindow = async () => {
  try {
    return await axios.get(INVENTORY_CORRECTION_WINDOW_URL, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to fetch correction window");
  }
};

// window: { startAt, endAt, allowedStoreIds }
export const saveCorrectionWindow = async (window) => {
  try {
    return await axios.put(INVENTORY_CORRECTION_WINDOW_URL, window, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to save correction window");
  }
};

// Ends the current window immediately
export const closeCorrectionWindow = async () => {
  try {
    return await axios.post(INVENTORY_CORRECTION_WINDOW_CLOSE_URL, null, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to close correction window");
  }
};

// Store manager: { remark, corrections: [{ inventoryId, newQuantity }] }
export const applyInventoryCorrections = async (correction) => {
  try {
    return await axios.post(INVENTORY_CORRECTION_APPLY_URL, correction, { headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to apply corrections");
  }
};

// storeId is only honoured for admin; managers always get own store
export const fetchCorrectionLogs = async (storeId) => {
  try {
    return await axios.get(INVENTORY_CORRECTION_LOGS_URL, {
      params: storeId ? { storeId } : {},
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to fetch correction history");
  }
};
