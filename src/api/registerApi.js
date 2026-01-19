import axios from "axios";
import { REGISTER_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const registerApi = async (userData) => {
  try {

    const { token } = getSessionData();
    const response = await axios.post(REGISTER_URL, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    const httpStatus = error.response?.status;
    const apiError = error.response?.data;
      return {
        status: apiError?.status || (httpStatus >= 500 ? "ERROR" : "FAILED"),
        payload: null,
        message:
          apiError?.message ||
          (httpStatus
            ? `Request failed with status ${httpStatus}`
            : "Network error or server not reachable"),
        errorList: apiError?.errorList || [],
      };
  }
};
