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
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to update user store"
        );
      } else if (error.request) {
        throw new Error("Server not responding. Please try again later.");
      }
    }
    throw new Error(error.message || "Something went wrong");
  }
};
