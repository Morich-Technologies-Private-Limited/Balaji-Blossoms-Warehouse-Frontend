import axios from "axios";
import { EXPORT_TRANSFER_HISTORY_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const exportTransferHistory = async (storeId, selectedIds) => {
  try {
    const { token } = getSessionData();
    
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      EXPORT_TRANSFER_HISTORY_URL,
      selectedIds, 
      {
        params: { storeId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

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
    };
  }
};
