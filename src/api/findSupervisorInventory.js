import axios from "axios";
import { FETCH_SUPERVISOR_INVENTORY_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

/**
 * Stock currently held by one supervisor.
 *
 * GET /product/supervisor/inventory?supervisorId=
 * Allowed roles: MAIN_STORE_MANAGER, SUB_STORE_MANAGER, SUPERVISOR, ADMIN.
 *
 * @param {string} supervisorId
 * @returns {Promise<import('axios').AxiosResponse>} payload is ProductDto[]:
 *   [{ productId, productName, category, packingList: [
 *      { packingId, packingSize, packingUnit, inventoryList: [
 *         { inventoryId, availableQuantity, packingUnit, storeId, storeName } ] } ] }]
 *
 * An empty inventory comes back as 404, which is returned as-is (status
 * NOT_FOUND) instead of throwing, so callers can just render an empty list.
 *
 * React Native note: ports unchanged once getSessionData() uses AsyncStorage.
 */
export const findSupervisorInventory = async (supervisorId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(FETCH_SUPERVISOR_INVENTORY_URL, {
      params: { supervisorId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Empty supervisor inventory is a valid outcome, not a failure
        if (error.response.status === 404) {
          return error.response;
        }

        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to fetch supervisor inventory"
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
