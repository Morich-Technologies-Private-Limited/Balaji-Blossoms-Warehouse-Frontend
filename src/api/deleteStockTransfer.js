import axios from "axios";
import { DELETE_STOCK_TRANSFER_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const deleteStockTransfer = async (transferId, reason) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const params = new URLSearchParams();
    params.append("transferId", transferId);
    params.append("reason", reason);

    const response = await axios.post(
      `${DELETE_STOCK_TRANSFER_URL}?${params.toString()}`,
      {},
      {
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
        throw new Error(error.response.data?.message || "Failed to delete transfer");
      } else if (error.request) {
        console.error("No response from server");
        throw new Error("Server not responding. Please try again later.");
      }
    }

    console.error("Unexpected Error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};
