import axios from "axios";
import { CREATE_GRAPH_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const createProductGraph = async (productId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

      const response = await axios.get(CREATE_GRAPH_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          productId: productId, // or just productId (ES6 shorthand)
        },
      });

    return response;
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
