import { createContext, useContext, useState } from "react";
import { fetchAllStores } from "../api/fetchAllStores";
import { getSessionData } from "../component/utils/getSessionData";
import { notify } from "../component/utils/feedback";

const StoreContext = createContext();
const STORE_CACHE_KEY = "STORE_LIST";
const STORE_CACHE_TIME_KEY = "STORE_LIST_TIME";
const TTL = 5 * 60 * 60 * 1000;

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState(() => {
    const cached = sessionStorage.getItem(STORE_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isCacheValid = () => {
    const cachedTime = sessionStorage.getItem(STORE_CACHE_TIME_KEY);
    if (!cachedTime) return false;

    return Date.now() - Number(cachedTime) < TTL;
  };

  const loadStores = async (forceRefresh = false) => {
  try {
    setLoading(true);
    setError(null);

    if (!forceRefresh && stores.length && isCacheValid()) {
      return stores;
    }

    const response = await fetchAllStores();

    if (response.data.status !== "SUCCESS") {
      notify.error(response.data.message || "Store not found");
      return [];
    }

    const { storeId: currentStoreId } = getSessionData();

    const storeList = response.data.payload.map(
      ({ userList, storeId, ...store }) => ({
        storeId,
        ...store,
        tag:
          String(storeId) === String(currentStoreId)
            ? "DEFAULT"
            : "REGULAR",
      })
    );

    setStores(storeList);
    sessionStorage.setItem(STORE_CACHE_KEY, JSON.stringify(storeList));
    sessionStorage.setItem(STORE_CACHE_TIME_KEY, Date.now().toString());

    return storeList;
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};


  return (
    <StoreContext.Provider
      value={{
        stores,
        loadStores,
        loading,
        error,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStores = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStores must be used within StoreProvider");
  }

  return context;
};
