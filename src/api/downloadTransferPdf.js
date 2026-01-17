import axios from "axios";
import { VIEW_PDF_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const downloadTransferPdf = async (transferId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(VIEW_PDF_URL, {
      params: { 
        transferId: transferId 
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/pdf'
      },
      responseType: 'blob', // Critical: tells axios to expect binary data
    });

    return response; 

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to download transfer invoice"
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