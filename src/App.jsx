import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import LoginForm from "./component/auth/LoginForm";
import Register from "./component/auth/Register";
import DynamicSidebar from "./component/sidebar/DynamicSidebar";
import MainStoreTransfer from "./component/mainstore/MainStoreTransfer";
import StockTransferHistory from "./component/stock/StockTransferHistory";
import InventoryView from "./component/stock/InventoryView";
import AddProduct from "./component/mainstore/AddProduct";
import UnauthorizedPage from "./component/auth/UnauthorizedPage";
import ShopTransfer from "./component/mainstore/ShopTransfer";
import StockImport from "./component/mainstore/StockImport";

/* ================= ROLE ↔ PATH MAP ================= */
const ROLE_PATH_MAP = {
  admin: "ADMIN",
  mainstore: "MAIN_STORE_MANAGER",
  substore: "SUB_STORE_MANAGER",
  storehouse: "SHOP_MANAGER",
};

/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { scope } = useParams(); // admin | mainstore | substore

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If route has dynamic scope, validate it
  if (scope) {
    const expectedRole = ROLE_PATH_MAP[scope];
    if (expectedRole && expectedRole !== user.userRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

function App() {
  const location = useLocation();
  const pathname = location.pathname;

  const [userRole, setUserRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* ================= RESPONSIVE SIDEBAR ================= */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ================= ROLE FROM SESSION (NOT URL) ================= */
  useEffect(() => {
    const authPages = ["/", "/login", "/register", "/unauthorized"];
    if (authPages.includes(pathname)) {
      setUserRole(null);
      return;
    }

    const user = JSON.parse(sessionStorage.getItem("user"));
    setUserRole(user?.userRole || null);
  }, [pathname]);

  const showSidebar = Boolean(userRole);

  return (
    <>
      {showSidebar && (
        <DynamicSidebar
          role={userRole}
          onSidebarChange={setIsSidebarOpen}
        />
      )}

      <div
        className={`main-content ${
          !showSidebar
            ? "no-sidebar"
            : !isSidebarOpen || isMobile
            ? "sidebar-closed"
            : ""
        }`}
      >
        <Routes>

          {/* ============ PUBLIC ============ */}
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          

          {/* ============ ADMIN ============ */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <h2>Admin Dashboard</h2>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/register"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Register />
              </ProtectedRoute>
            }
          />

          {/* ============ MAIN STORE ============ */}
          <Route
            path="/mainstore"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER", "ADMIN"]}>
                <h2>Main Store Dashboard</h2>
              </ProtectedRoute>
            }
          />


          {/* ============ 🔥 DYNAMIC COMMON ROUTE (KEY FIX) 🔥 ============ */}
          <Route
            path="/:scope/view/tranferHistory"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <StockTransferHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/:scope/view/inventory"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <InventoryView />
              </ProtectedRoute>
            }
          />



          <Route
            path="/:scope/transfer"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER","SUB_STORE_MANAGER"]}>
                <MainStoreTransfer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/:scope/import"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER","SUB_STORE_MANAGER"]}>
                <StockImport />
              </ProtectedRoute>
            }
          />


                  <Route
            path="/:scope/shop/tranfer"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER","SUB_STORE_MANAGER"]}>
                <ShopTransfer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/:scope/product/add"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <AddProduct />
              </ProtectedRoute>
            }
          />



          {/* ============ SUB STORE ============ */}
          <Route
            path="/substore"
            element={
              <ProtectedRoute
                allowedRoles={["SUB_STORE_MANAGER", "SUB_STORE_SUPERVISOR"]}
              >
                <h2>Sub Store Dashboard</h2>
              </ProtectedRoute>
            }
          />

          {/* ============ STORE HOUSE ============ */}
          <Route
            path="/storehouse"
            element={
              <ProtectedRoute allowedRoles={["SHOP_MANAGER"]}>
                <h2>Store House Dashboard</h2>
              </ProtectedRoute>
            }
          />

          {/* ============ UNAUTHORIZED ============ */}
           <Route path="/unauthorized" element={<UnauthorizedPage />} />
     
        </Routes>
      </div>
    </>
  );
}

export default App;
