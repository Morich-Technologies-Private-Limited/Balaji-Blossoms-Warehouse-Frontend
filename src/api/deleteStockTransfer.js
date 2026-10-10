import axios from "axios";
import { DELETE_STOCK_TRANSFER_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const deleteStockTransfer = async (transferId, reason) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const params = new URLSearchParams();
    params.append("transferId", transferId);
    params.append("reason", reason);

    const response = await axios.post(
      `${DELETE_STOCK_TRANSFER_URL}?${params.toString()}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      statusText: error.response?.statusText || "Error",
      headers: error.response?.headers || {},
      config: error.config || {},
    };
  }

};
