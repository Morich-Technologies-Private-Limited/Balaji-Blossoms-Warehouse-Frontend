export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
 
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/admin/register`;
export const STORE_CREATE_URL = `${API_BASE_URL}/admin/create-store`;

export const FIND_ALL_STORE_URL = `${API_BASE_URL}/store/findAll`;
export const FIND_ALL_STORE_USER_URL = `${API_BASE_URL}/store/find/all-store/user`;
export const FIND_TRANSFER_HISTORY_URL = `${API_BASE_URL}/store/find/transfer-history`;
export const FETCH_STORE_INVENTORY_URL = `${API_BASE_URL}/store/inventory`;


export const FIND_PRODUCT_SEARCH_URL = `${API_BASE_URL}/product/search`;
export const FIND_PRODUCT_PACKING_URL = `${API_BASE_URL}/product/find/packing`;
export const FIND_PRODUCT_PACKING_WITHOUT_INVENTORY_URL = `${API_BASE_URL}/product/findProductPackingWithoutInventory`;

export const SEND_PRODUCT_URL = `${API_BASE_URL}/product/transfer-stock`;

export const ADD_INVENROTY_URL = `${API_BASE_URL}/product/add/inventory`;


export const ADD_PRODUCT_URL = `${API_BASE_URL}/product/add`;
export const ADD_PACKING_URL = `${API_BASE_URL}/product/add/packing`;

export const CHECK_PRODUCT_AVAILABILITY_URL = `${API_BASE_URL}/product/productName/check-availability`;

export const SUPERVISOR_LIST_URL = `${API_BASE_URL}/store/supervisor/list`;
export const SUPERVISOR_ADD_URL = `${API_BASE_URL}/store/supervisor/add`;
export const SUPERVISOR_TRANSFER_HISTORY_URL = `${API_BASE_URL}/store/supervisor/transfer-history`;

export const PRODUCT_EXPIRY_LIST_URL = `${API_BASE_URL}/product/expiry/list`;
export const PRODUCT_EXPIRY_ADD_URL = `${API_BASE_URL}/product/expiry/add`;
export const PRODUCT_EXPIRY_UPDATE_URL = `${API_BASE_URL}/product/expiry/update`;
export const PRODUCT_EXPIRY_DELETE_URL = `${API_BASE_URL}/product/expiry/delete`;

export const SUPERVISOR_LOGIN_URL = `${API_BASE_URL}/auth/supervisor/login`;

// Sub store manager: supervisor management
export const SUPERVISOR_CREATE_LOGIN_URL = `${API_BASE_URL}/store/supervisor/create-login`;
export const SUPERVISOR_LOGIN_STATUS_URL = `${API_BASE_URL}/store/supervisor/login-status`;
export const SUPERVISOR_INVENTORY_URL = `${API_BASE_URL}/store/supervisor/inventory`;
export const SUPERVISOR_USAGE_URL = `${API_BASE_URL}/store/supervisor/usage`;

// Logged-in supervisor (own data only)
export const SELF_SUPERVISOR_PROFILE_URL = `${API_BASE_URL}/supervisor/me`;
export const SELF_SUPERVISOR_INVENTORY_URL = `${API_BASE_URL}/supervisor/inventory`;
export const SELF_SUPERVISOR_USAGE_URL = `${API_BASE_URL}/supervisor/usage`;
export const SELF_SUPERVISOR_TRANSFER_HISTORY_URL = `${API_BASE_URL}/supervisor/transfer-history`;
export const SELF_SUPERVISOR_RETURN_URL = `${API_BASE_URL}/supervisor/return-to-store`;
export const PRODUCT_EXPIRY_PACKING_AVAILABILITY_URL = `${API_BASE_URL}/product/expiry/packing-availability`;

// Main store -> sub store -> supervisor direct transfer
export const SUPERVISOR_BY_STORE_URL = `${API_BASE_URL}/store/supervisor/by-store`;
export const MAIN_TO_SUPERVISOR_TRANSFER_URL = `${API_BASE_URL}/product/main-store/supervisor/transfer-stock`;

// Inventory correction (admin defines window + allowed stores, those stores correct own inventory without in/out entries)
export const INVENTORY_CORRECTION_STATUS_URL = `${API_BASE_URL}/store/inventory-correction/status`;
export const INVENTORY_CORRECTION_WINDOW_URL = `${API_BASE_URL}/admin/inventory-correction/window`;
export const INVENTORY_CORRECTION_WINDOW_CLOSE_URL = `${API_BASE_URL}/admin/inventory-correction/window/close`;
export const INVENTORY_CORRECTION_APPLY_URL = `${API_BASE_URL}/store/inventory-correction/apply`;
export const INVENTORY_CORRECTION_LOGS_URL = `${API_BASE_URL}/store/inventory-correction/logs`;

// Fast inventory view: product master first, quantities in background (existing /store/inventory unchanged)
export const STORE_INVENTORY_PRODUCTS_URL = `${API_BASE_URL}/store/inventory/v2/products`;
export const STORE_INVENTORY_ITEMS_URL = `${API_BASE_URL}/store/inventory/v2/items`;
