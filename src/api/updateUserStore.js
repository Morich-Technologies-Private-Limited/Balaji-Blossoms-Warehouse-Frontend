import axios from "axios";
import { UPDATE_USER_STORE_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const updateUserStore = async (userId, storeId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      UPDATE_USER_STORE_URL,
      null, // ❗ no request body
      {
        params: {
          userId: userId,
          storeId: storeId,
        },
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
