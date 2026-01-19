import axios from "axios";
import { CREATE_GRAPH_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const createProductGraph = async (productId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

      const response = await axios.get(CREATE_GRAPH_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          productId: productId, // or just productId (ES6 shorthand)
        },
      });

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
