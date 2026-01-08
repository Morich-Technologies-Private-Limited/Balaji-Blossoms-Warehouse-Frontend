import axios from "axios";
import { FIND_ALL_STORE_USER_URL } from "../constants/apiConstants";
import { getSessionData } from "../utils/getSessionData";

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

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to fetch store users"
        );
      } else if (error.request) {
        // Request made but no response
        console.error("No response from server");
        throw new Error("Server not responding. Please try again later.");
      }
    }

    // Generic JS error
    console.error("Unexpected Error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};
