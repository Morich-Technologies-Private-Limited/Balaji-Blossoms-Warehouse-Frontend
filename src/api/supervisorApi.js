import axios from "axios";
import {
  SUPERVISOR_LIST_URL,
  SUPERVISOR_ADD_URL,
  SUPERVISOR_TRANSFER_HISTORY_URL,
  SUPERVISOR_CREATE_LOGIN_URL,
  SUPERVISOR_LOGIN_STATUS_URL,
  SUPERVISOR_INVENTORY_URL,
  SUPERVISOR_USAGE_URL,
  SUPERVISOR_BY_STORE_URL,
  MAIN_TO_SUPERVISOR_TRANSFER_URL,
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

const get = async (url, params, fallbackMessage) => {
  try {
    return await axios.get(url, { params, headers: authHeaders() });
  } catch (error) {
    handleError(error, fallbackMessage);
  }
};

const post = async (url, body, fallbackMessage, params = {}) => {
  try {
    return await axios.post(url, body, { params, headers: authHeaders() });
  } catch (error) {
    handleError(error, fallbackMessage);
  }
};

// storeId is only honoured by the backend for ADMIN; managers always get their own store
const withStore = (params, storeId) => (storeId ? { ...params, storeId } : params);

/* ============ Sub store manager / admin: supervisors of a store ============ */

export const fetchSupervisors = (storeId) =>
  get(SUPERVISOR_LIST_URL, withStore({}, storeId), "Failed to fetch supervisors");

// supervisor: { name, phoneNumber, password? } - password enables login (supervisor logs in with phone number)
export const addSupervisor = (supervisor, storeId) =>
  post(SUPERVISOR_ADD_URL, supervisor, "Failed to add supervisor", withStore({}, storeId));

// Enables login for a supervisor, or resets the password when login already exists
export const saveSupervisorLogin = (supervisorId, password, storeId) =>
  post(SUPERVISOR_CREATE_LOGIN_URL, { supervisorId, password }, "Failed to save supervisor login", withStore({}, storeId));

export const updateSupervisorLoginStatus = async (supervisorId, status, storeId) => {
  try {
    return await axios.patch(SUPERVISOR_LOGIN_STATUS_URL, null, {
      params: withStore({ supervisorId, status }, storeId),
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to update supervisor login status");
  }
};

export const fetchSupervisorInventory = (supervisorId, storeId) =>
  get(SUPERVISOR_INVENTORY_URL, withStore({ supervisorId }, storeId), "Failed to fetch supervisor inventory");

export const fetchSupervisorUsage = (supervisorId, storeId) =>
  get(SUPERVISOR_USAGE_URL, withStore(supervisorId ? { supervisorId } : {}, storeId), "Failed to fetch supervisor usage");

export const fetchSupervisorTransferHistory = (supervisorId, storeId) =>
  get(SUPERVISOR_TRANSFER_HISTORY_URL, withStore(supervisorId ? { supervisorId } : {}, storeId), "Failed to fetch supervisor transfer history");

/* ============ Main store: direct transfer to a sub store supervisor ============ */

export const fetchSupervisorsByStore = (storeId) =>
  get(SUPERVISOR_BY_STORE_URL, { storeId }, "Failed to fetch supervisors of the store");

// Creates OUT main store -> IN sub store -> OUT sub store to supervisor in one step
export const sendMainStoreToSupervisor = (transferDto) =>
  post(MAIN_TO_SUPERVISOR_TRANSFER_URL, transferDto, "Failed to transfer stock to supervisor");

// Calls made by a logged-in supervisor are in src/supervisor/supervisorPortalApi.js
