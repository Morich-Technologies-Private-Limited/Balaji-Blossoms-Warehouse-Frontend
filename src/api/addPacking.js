import axios from "axios";
import { ADD_PACKING_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const addPacking = async (packing) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log(packing);
    const response = await axios.post(
      ADD_PACKING_URL,
        JSON.stringify(packing),
      {
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
          error.response.data?.message || "Failed to add product"
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
