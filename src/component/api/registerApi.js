import axios from "axios";
import { REGISTER_URL } from "../constants/apiConstants";

export const registerApi = async (userData) => {
  try {
    const response = await axios.post(REGISTER_URL, userData);

    const data = response.data;

    if (data.status === "SUCCESS") {
      return {
        success: true,
        message: data.message || "User registered successfully",
        payload: data.payload,
      };
    } else {
      return {
        success: false,
        message: data.message || "Registration failed",
      };
    }
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Something went wrong while registering",
    };
  }
};
