import axios from "axios";
import { TRANSFER_BETWEEN_SUPERVISORS_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

/**
 * Supervisor -> Supervisor stock transfer.
 *
 * POST /product/supervisor/transfer-between-supervisors
 * Allowed roles: SUPERVISOR, ADMIN.
 *
 * The backend reads the sending user and store from the JWT, so the ids in the
 * body are only used for the transfer record / slip.
 *
 * @param {Object} transferDetails - StockTransferSupervisorDto
 * @param {string} transferDetails.supervisorId          sender (logged in supervisor)
 * @param {string} transferDetails.supervisorName        sender name
 * @param {string} transferDetails.contactNo             sender contact number
 * @param {string} transferDetails.receiverSupervisorId  receiving supervisor
 * @param {string} transferDetails.receiverSupervisorName
 * @param {string} transferDetails.receiverContactNo
 * @param {string} transferDetails.storeName             store both supervisors belong to
 * @param {Array}  transferDetails.stockList             StockTransferDto[]
 * @returns {Promise<import('axios').AxiosResponse>} raw axios response; read response.data.status
 *
 * React Native note: this file ports unchanged. Only getSessionData() needs to
 * move from sessionStorage to AsyncStorage (which makes it async, so await it here).
 */
export const transferBetweenSupervisors = async (transferDetails) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      TRANSFER_BETWEEN_SUPERVISORS_URL,
      transferDetails,
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
        // 400 carries the business failure message from ApiResponseModal
        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to transfer product"
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
