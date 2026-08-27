import axios from "axios";
import { SUPERVISOR_CONSUME_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

/**
 * Supervisor consumes (uses up) stock they are holding.
 *
 * POST /product/supervisor/consume
 * Allowed roles: SUPERVISOR, ADMIN.
 *
 * The backend reads the consuming user and their store from the JWT.
 *
 * @param {Object} consumptionDetails - SupervisorConsumptionDto
 * @param {string} consumptionDetails.supervisorId    supervisor using the stock
 * @param {string} consumptionDetails.purpose         why it was used
 * @param {Array}  consumptionDetails.consumptionList StockTransferDto[]:
 *   [{ inventoryId, packingId, productId, quantityToTransfer,
 *      transferMetadata: { transferType, transferUnit, weight, unit } }]
 * @returns {Promise<import('axios').AxiosResponse>} raw axios response; read response.data.status
 *
 * React Native note: ports unchanged once getSessionData() uses AsyncStorage.
 */
export const consumeSupervisorStock = async (consumptionDetails) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      SUPERVISOR_CONSUME_URL,
      consumptionDetails,
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
          error.response.data?.message || "Failed to record consumption"
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
