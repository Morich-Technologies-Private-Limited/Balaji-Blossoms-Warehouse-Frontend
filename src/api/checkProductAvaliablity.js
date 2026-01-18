import axios from "axios";
import { CHECK_PRODUCT_AVAILABILITY_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const checkProductAvaliablity = async (productName) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      CHECK_PRODUCT_AVAILABILITY_URL,
      {
        params: { productName }, // Query parameters go in config
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to check product availability"
        );
      } else if (error.request) {
        console.error("No response from server");
        throw new Error("Server not responding. Please try again later.");
      }
    }

    console.error("Unexpected Error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};