export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
 
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/admin/register`;

export const FIND_ALL_STORE_URL = `${API_BASE_URL}/store/findAll`;
export const FIND_ALL_STORE_USER_URL = `${API_BASE_URL}/store/find/all-store/user`;
export const FIND_TRANSFER_HISTORY_URL = `${API_BASE_URL}/store/find/transfer-history`;
export const FETCH_STORE_INVENTORY_URL = `${API_BASE_URL}/store/inventory`;



export const FIND_PRODUCT_SEARCH_URL = `${API_BASE_URL}/product/search`;
export const FIND_PRODUCT_PACKING_URL = `${API_BASE_URL}/product/find/packing`;
export const SEND_PRODUCT_URL = `${API_BASE_URL}/product/transfer-stock`;

export const ADD_PRODUCT_URL = `${API_BASE_URL}/product/add`;