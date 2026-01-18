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
    console.error("Register error:", error);
    return {
      status: "FAILED",
      message:
        error.response?.data?.message ||
        "Something went wrong while registering",
    };
  }
};
