import axios from "axios";
import { FIND_ALL_STORE_USER_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const fetchStoresWithUserApi = async () => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(FIND_ALL_STORE_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response; // return only data (recommended)

  }  catch (error) {
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
