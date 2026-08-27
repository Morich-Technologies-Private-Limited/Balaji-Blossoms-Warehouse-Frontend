import axios from "axios";
import { FIND_SUPERVISORS_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

/**
 * Supervisors attached to a store, used to populate receiver dropdowns.
 *
 * GET /product/supervisors?storeId=
 * Allowed roles: MAIN_STORE_MANAGER, SUB_STORE_MANAGER, SUPERVISOR, ADMIN.
 *
 * @param {number|string} storeId
 * @returns {Promise<import('axios').AxiosResponse>} payload is SupervisorDto[]:
 *   [{ supervisorId, name, contactNumber, storeId, storeName }]
 *
 * A store with no supervisors comes back as 404, which is returned as-is
 * (status NOT_FOUND) instead of throwing, so callers can show an empty dropdown.
 *
 * React Native note: ports unchanged once getSessionData() uses AsyncStorage.
 */
export const findSupervisors = async (storeId) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(FIND_SUPERVISORS_URL, {
      params: { storeId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // No supervisors mapped to this store is a valid outcome, not a failure
        if (error.response.status === 404) {
          return error.response;
        }

        console.error("API Error:", error.response.data);
        throw new Error(
          error.response.data?.message || "Failed to fetch supervisors"
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
