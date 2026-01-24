import axios from "axios";
import { EXPORT_STORE_INVENTORY_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const exportStoreInventory = async (storeId) => {
  try {
    console.log("Export Inventory API");
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(EXPORT_STORE_INVENTORY_URL, {
      params: { storeId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob', // Important for file download
    });

    return response;

  } catch (error) {
    const httpStatus = error.response?.status || 500;
    const apiError = error.response?.data;

    return {
      data: {
        status: apiError?.status || "ERROR",
        payload: null,
        message:
          apiError?.message ||
          (error.response
            ? `Request failed with status ${httpStatus}`
            : "Network error or server not reachable"),
        errorList: apiError?.errorList || [],
      },
      status: httpStatus,
      statusText: error.response?.statusText || "Error",
      headers: error.response?.headers || {},
      config: error.config || {},
    };
  }
};