import axios from "axios";
import { RETURN_STOCK_TO_STORE_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

/**
 * Supervisor -> Store stock return (the supervisor hands unused stock back).
 *
 * POST /product/supervisor/return-to-store
 * Allowed roles: SUPERVISOR, ADMIN.
 *
 * The backend reads the returning user and their store from the JWT, so the ids
 * in the body are used for the transfer record / slip.
 *
 * @param {Object} returnDetails - TransferDto
 * @param {number} returnDetails.receiverStoreId  store the stock goes back to
 * @param {string} returnDetails.supervisorId     supervisor returning the stock
 * @param {string} returnDetails.userId           logged in user id
 * @param {string} returnDetails.receiverName     who accepts the stock at the store
 * @param {string} returnDetails.contactNo        receiver contact number
 * @param {string} returnDetails.driverName       optional, who carried it
 * @param {string} returnDetails.vehicleNo        optional
 * @param {Array}  returnDetails.stockList        StockTransferDto[]:
 *   [{ inventoryId, packingId, productId, quantityToTransfer,
 *      transferMetadata: { transferType, transferUnit, weight, unit } }]
 * @returns {Promise<import('axios').AxiosResponse>} raw axios response; read response.data.status
 *
 * React Native note: ports unchanged once getSessionData() uses AsyncStorage.
 */
export const returnStockToStore = async (returnDetails) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      RETURN_STOCK_TO_STORE_URL,
      returnDetails,
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
          error.response.data?.message || "Failed to return stock"
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
