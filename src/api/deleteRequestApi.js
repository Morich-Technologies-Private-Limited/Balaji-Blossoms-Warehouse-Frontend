import axios from "axios";
import { DELETE_REQUEST_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const deleteRequestApi = async (requestId, remark, actionStatus) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      DELETE_REQUEST_URL,
      null, // no body
      {
        params: { requestId, remark, actionStatus },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Action failed"
      );
    }
    throw error;
  }
};
