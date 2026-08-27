export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
 
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/admin/register`;
export const STORE_CREATE_URL = `${API_BASE_URL}/admin/create-store`;

export const FIND_ALL_STORE_URL = `${API_BASE_URL}/store/findAll`;
export const FIND_ALL_STORE_USER_URL = `${API_BASE_URL}/store/find/all-store/user`;
export const FIND_TRANSFER_HISTORY_URL = `${API_BASE_URL}/store/find/transfer-history`;
export const FETCH_STORE_INVENTORY_URL = `${API_BASE_URL}/store/inventory`;



export const FIND_SUPERVISORS_URL = `${API_BASE_URL}/product/supervisors`;
export const FETCH_SUPERVISOR_INVENTORY_URL = `${API_BASE_URL}/product/supervisor/inventory`;


export const FIND_PRODUCT_SEARCH_URL = `${API_BASE_URL}/product/search`;
export const FIND_PRODUCT_PACKING_URL = `${API_BASE_URL}/product/find/packing`;
export const FIND_PRODUCT_PACKING_WITHOUT_INVENTORY_URL = `${API_BASE_URL}/product/findProductPackingWithoutInventory`;

export const SEND_PRODUCT_URL = `${API_BASE_URL}/product/transfer-stock`;
export const SEND_PRODUCT_TO_SUPERVISOR_URL = `${API_BASE_URL}/product/supervisor/transfer-stock`;
export const TRANSFER_BETWEEN_SUPERVISORS_URL = `${API_BASE_URL}/product/supervisor/transfer-between-supervisors`;
export const RETURN_STOCK_TO_STORE_URL = `${API_BASE_URL}/product/supervisor/return-to-store`;
export const SUPERVISOR_CONSUME_URL = `${API_BASE_URL}/product/supervisor/consume`;

export const ADD_INVENROTY_URL = `${API_BASE_URL}/product/add/inventory`;


export const ADD_PRODUCT_URL = `${API_BASE_URL}/product/add`;
export const ADD_PACKING_URL = `${API_BASE_URL}/product/add/packing`;

export const CHECK_PRODUCT_AVAILABILITY_URL = `${API_BASE_URL}/product/productName/check-availability`;