import axios from "axios";
import {
  PRODUCT_EXPIRY_LIST_URL,
  PRODUCT_EXPIRY_ADD_URL,
  PRODUCT_EXPIRY_UPDATE_URL,
  PRODUCT_EXPIRY_DELETE_URL,
  PRODUCT_EXPIRY_PACKING_AVAILABILITY_URL,
  EXPIRY_REMINDER_LIST_URL,
  EXPIRY_REMINDER_RESOLVE_URL,
  EXPIRY_REMINDER_DISMISS_URL,
} from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

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

// storeId is only honoured by the backend for ADMIN; everyone else gets their own store
const withStore = (params, storeId) => (storeId ? { ...params, storeId } : params);

// productId is optional - without it all expiry notes of the store are returned
export const fetchProductExpiry = async (productId, storeId) => {
  try {
    return await axios.get(PRODUCT_EXPIRY_LIST_URL, {
      params: withStore(productId ? { productId } : {}, storeId),
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to fetch expiry list");
  }
};

// Packings of a product with store stock and max quantity that can still go on expiry notes
export const fetchExpiryPackingAvailability = async (productId, storeId) => {
  try {
    return await axios.get(PRODUCT_EXPIRY_PACKING_AVAILABILITY_URL, {
      params: withStore({ productId }, storeId),
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to fetch packing availability");
  }
};

export const addProductExpiry = async (expiry, storeId) => {
  try {
    return await axios.post(PRODUCT_EXPIRY_ADD_URL, expiry, { params: withStore({}, storeId), headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to add expiry");
  }
};

export const updateProductExpiry = async (expiry, storeId) => {
  try {
    return await axios.put(PRODUCT_EXPIRY_UPDATE_URL, expiry, { params: withStore({}, storeId), headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to update expiry");
  }
};

/* ============ Reminders: in entry lines saved without expiry / rack ============ */

export const fetchExpiryReminders = async (storeId) => {
  try {
    return await axios.get(EXPIRY_REMINDER_LIST_URL, { params: withStore({}, storeId), headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to fetch reminders");
  }
};

// details: { expiryDate, rackId, quantity, quantityUnit } (MISSING_RACK only needs rackId)
export const resolveExpiryReminder = async (reminderId, details, storeId) => {
  try {
    return await axios.post(EXPIRY_REMINDER_RESOLVE_URL, details, { params: withStore({ reminderId }, storeId), headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to save details");
  }
};

export const dismissExpiryReminder = async (reminderId, storeId) => {
  try {
    return await axios.post(EXPIRY_REMINDER_DISMISS_URL, null, { params: withStore({ reminderId }, storeId), headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to dismiss reminder");
  }
};

export const deleteProductExpiry = async (expiryId, storeId) => {
  try {
    return await axios.delete(PRODUCT_EXPIRY_DELETE_URL, {
      params: withStore({ expiryId }, storeId),
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to delete expiry");
  }
};
