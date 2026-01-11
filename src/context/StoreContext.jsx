import { createContext, useContext, useState } from "react";
import { fetchAllStores } from "../component/api/fetchAllStores";

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

      // ✅ Access-based TTL check
      if (!forceRefresh && stores.length && isCacheValid()) {
        return stores;
      }

      // 🔄 Cache expired OR forced → refresh
      const response = await fetchAllStores();

      if(response.data.status!="SUCCESS")
      {
        alert(response.data.message|| "Store not found");
      }

      const storeList = response.data.payload;

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
