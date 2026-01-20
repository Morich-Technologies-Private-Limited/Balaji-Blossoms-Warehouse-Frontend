export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
 
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/admin/register`;
export const STORE_CREATE_URL = `${API_BASE_URL}/admin/create-store`;
export const FIND_ALL_USER_URL = `${API_BASE_URL}/admin/find/allUsers`;
export const CREATE_GRAPH_URL = `${API_BASE_URL}/admin/createProductGraph`;


export const UPDATE_USER_STATUS_URL = `${API_BASE_URL}/admin/update/user/status`;
export const UPDATE_USER_STORE_URL = `${API_BASE_URL}/admin/update/user/store`;
export const VIEW_REQUEST_URL = `${API_BASE_URL}/admin/find/billRequest`;
export const DELETE_REQUEST_URL = `${API_BASE_URL}/admin/delete/billRequest/action`;

export const FIND_ALL_USER_INFORMATION_URL = `${API_BASE_URL}/admin/find/allUsers`;

export const FIND_ALL_STORE_URL = `${API_BASE_URL}/store/findAll`;
export const FIND_ALL_STORE_USER_URL = `${API_BASE_URL}/store/find/all-store/user`;
export const FIND_TRANSFER_HISTORY_URL = `${API_BASE_URL}/store/find/transfer-history`;
export const FETCH_STORE_INVENTORY_URL = `${API_BASE_URL}/store/inventory`;

export const VIEW_PDF_URL = `${API_BASE_URL}/product/view/pdf`;


export const FIND_ALL_PRODUCT_URL = `${API_BASE_URL}/product/findAll`;
export const FIND_PRODUCT_SEARCH_URL = `${API_BASE_URL}/product/search`;
export const FIND_PRODUCT_PACKING_URL = `${API_BASE_URL}/product/find/packing`;
export const FIND_PRODUCT_PACKING_WITHOUT_INVENTORY_URL = `${API_BASE_URL}/product/findProductPackingWithoutInventory`;

export const SEND_PRODUCT_URL = `${API_BASE_URL}/product/transfer-stock`;
export const SEND_PRODUCT_TO_SUPERVISOR_URL = `${API_BASE_URL}/product/supervisor/transfer-stock`;
export const ADD_INVENROTY_URL = `${API_BASE_URL}/product/add/inventory`;
export const ADD_SUB_STORE_INVENROTY_URL = `${API_BASE_URL}/product/substore/add/inventory`;

export const DELETE_STOCK_TRANSFER_URL = `${API_BASE_URL}/product/transferHistory/delete`;



export const ADD_PRODUCT_URL = `${API_BASE_URL}/product/add`;
export const ADD_PACKING_URL = `${API_BASE_URL}/product/add/packing`;


export const CHECK_PRODUCT_AVAILABILITY_URL = `${API_BASE_URL}/product/productName/check-availability`;