import axios from "axios";
import { VALIDATE_OTP_URL } from "../constants/apiConstants";

export const forgotPassowordOtpValidationApi = async (passwordData) => {
  try {

    const response = await axios.post(VALIDATE_OTP_URL, passwordData);
    return response;
  } catch (error) {
    console.log(error);
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
