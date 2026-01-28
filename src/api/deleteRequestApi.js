import axios from "axios";
import { DELETE_REQUEST_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

export const deleteRequestApi = async (requestId, remark, actionStatus) => {
  try {
    const { token } = getSessionData();

    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Create query parameters like the working example
    const params = new URLSearchParams();
    params.append("requestId", requestId);
    params.append("remark", remark);
    params.append("actionStatus", actionStatus);

    const response = await axios.post(
      `${DELETE_REQUEST_URL}?${params.toString()}`,
      {}, // empty body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    // ... your existing error handling
  }
};
