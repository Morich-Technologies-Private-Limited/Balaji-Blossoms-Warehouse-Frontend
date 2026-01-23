import axios from "axios";
import { GENERATE_OTP_URL } from "../constants/apiConstants";

export const forgotPassowordOtpGenerationApi = async (userId) => {
  try {

    const response = await axios.get(GENERATE_OTP_URL,{
      params: {userId},
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
