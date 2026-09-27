import axios from "axios";
import { STORE_INVENTORY_PRODUCTS_URL, STORE_INVENTORY_ITEMS_URL } from "../constants/apiConstants";
import { getSessionData } from "../component/utils/getSessionData";

// Fast inventory: product master first, then packings / quantities in batches (background)

export const INVENTORY_BATCH_SIZE = 50;

const authHeaders = () => {
  const { token } = getSessionData();
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return { Authorization: `Bearer ${token}` };
};

const handleError = (error, fallbackMessage) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error("API Error:", error.response.data);
      throw new Error(error.response.data?.message || fallbackMessage);
    } else if (error.request) {
      console.error("No response from server");
      throw new Error("Server not responding. Please try again later.");
    }
  }
  console.error("Unexpected Error:", error);
  throw new Error(error.message || "Something went wrong");
};

// [{ productId, productName, category }] - storeId only honoured for admin
export const fetchStoreProducts = async (storeId) => {
  try {
    return await axios.get(STORE_INVENTORY_PRODUCTS_URL, {
      params: storeId ? { storeId } : {},
      headers: authHeaders(),
    });
  } catch (error) {
    handleError(error, "Failed to fetch products");
  }
};

// Flat rows [{ productId, productName, packingId, packingSize, packingUnit, inventoryId, availableQuantity }].
// productIds optional (max 200) - without it every inventory row of the store is returned.
export const fetchInventoryItems = async (storeId, productIds) => {
  try {
    const params = new URLSearchParams();
    if (storeId) params.append("storeId", storeId);
    (productIds || []).forEach(id => params.append("productIds", id));
    return await axios.get(STORE_INVENTORY_ITEMS_URL, { params, headers: authHeaders() });
  } catch (error) {
    handleError(error, "Failed to fetch inventory");
  }
};

// Flat rows -> { productId: packingList } in the same shape as the old /store/inventory response
export const groupItemsByProduct = (items) => items.reduce((groups, item) => {
  const packingList = groups[item.productId] || (groups[item.productId] = []);
  packingList.push({
    packingId: item.packingId,
    packingSize: item.packingSize,
    packingUnit: item.packingUnit,
    inventoryList: item.inventoryId == null
      ? []
      : [{ inventoryId: item.inventoryId, availableQuantity: item.availableQuantity ?? 0, packingUnit: item.packingUnit }],
  });
  return groups;
}, {});
