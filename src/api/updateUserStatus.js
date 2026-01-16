import axios from "axios";
import { UPDATE_USER_STATUS_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const updateUserStatus = async (userId, status) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      UPDATE_USER_STATUS_URL,
      null, 
      {
        params: {
          userId: userId,
          status: status,
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
          error.response.data?.message || "Failed to update user status"
        );
      } else if (error.request) {
        throw new Error("Server not responding. Please try again later.");
      }
    }
    throw new Error(error.message || "Something went wrong");
  }
};
