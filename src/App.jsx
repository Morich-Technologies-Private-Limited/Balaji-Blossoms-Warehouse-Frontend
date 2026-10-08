import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import LoginForm from "./component/auth/LoginForm";
import Register from "./component/auth/Register";
import DynamicSidebar from "./component/sidebar/DynamicSidebar";
import StockTransferHistory from "./component/stock/StockTransferHistory";
import InventoryView from "./component/stock/InventoryView";
import AddProduct from "./component/mainstore/AddProduct";
import UnauthorizedPage from "./component/auth/UnauthorizedPage";
import ShopTransfer from "./component/mainstore/ShopTransfer";
import StockImport from "./component/mainstore/StockImport";
import Dashboard from "./component/mainstore/Dashboard";
import CreateStore from "./component/admin/CreateStore";
import RequestView from "./component/admin/RequestView";
import UserManagement from "./component/admin/UserManagment";
import MessagePopUp from "./component/modal/MessagePopUp";
import AdminDashboard from "./component/admin/AdminDashboard";
import ForgotPassword from "./component/auth/ForgotPassword";

// ===== Release branch =====
import ProductExpiry from "./component/stock/ProductExpiry";
import Reminders from "./component/stock/Reminders";
import SupervisorActivity from "./component/supervisor/SupervisorActivity";
import SupervisorManagement from "./component/supervisor/SupervisorManagement";
import SupervisorPortal from "./supervisor/SupervisorPortal";
import InventoryCorrection from "./inventoryCorrection/InventoryCorrection";
import InventoryCorrectionAdmin from "./inventoryCorrection/InventoryCorrectionAdmin";


/* ================= ROLE ↔ PATH MAP ================= */
const ROLE_PATH_MAP = {
  admin: "ADMIN",
  mainstore: "MAIN_STORE_MANAGER",
  substore: "SUB_STORE_MANAGER",
  storehouse: "SHOP_MANAGER",
  supervisor: "SUPERVISOR",
};


/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const { scope } = useParams();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Validate dynamic scope when present
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


  /* ================= ROLE FROM SESSION ================= */
  useEffect(() => {
    const authPages = [
      "/",
      "/login",
      "/register",
      "/unauthorized",
    ];

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
    <MessagePopUp />

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          
          

          {/* ============ ADMIN ============ */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
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

          <Route
            path="/admin/request/view"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <RequestView />
              </ProtectedRoute>
            }
          />
  
         <Route
            path="/admin/user/management"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* ============ COMMON DASHBOARD ============ */}

          <Route
            path="/:scope/"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/:scope/dashboard"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER", "SUB_STORE_MANAGER"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
         
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


          {/* ============ INVENTORY ============ */}

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


          {/* ============ STORE TRANSFER ============ */}

          <Route
            path="/:scope/transfer"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <ShopTransfer />
              </ProtectedRoute>
            }
          />


          {/* ============ SUB STORE OUT ENTRY (own supervisors only) ============ */}

          <Route
            path="/:scope/out-entry"
            element={
              <ProtectedRoute allowedRoles={["SUB_STORE_MANAGER"]}>
                <ShopTransfer ownSupervisorOnly />
              </ProtectedRoute>
            }
          />


          {/* ============ STOCK IMPORT ============ */}

          <Route
            path="/:scope/import"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <StockImport />
              </ProtectedRoute>
            }
          />


          {/* Manager/Admin view of supervisor inventory (own store's supervisors) */}
          <Route
            path="/:scope/supervisor/inventory"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <SupervisorActivity />
              </ProtectedRoute>
            }
          />


          {/* ============ PRODUCT EXPIRY ============ */}

          <Route
            path="/:scope/product/expiry"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <ProductExpiry />
              </ProtectedRoute>
            }
          />

          {/* expiring stock + in entries missing expiry / rack */}
          <Route
            path="/:scope/reminders"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "MAIN_STORE_MANAGER", "SUB_STORE_MANAGER"]}>
                <Reminders />
              </ProtectedRoute>
            }
          />


          {/* ============ INVENTORY CORRECTION ============ */}

          <Route
            path="/admin/inventory-correction"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <InventoryCorrectionAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/:scope/inventory-correction"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <InventoryCorrection />
              </ProtectedRoute>
            }
          />


          {/* ============ SUPERVISOR MANAGEMENT ============ */}

          <Route
            path="/:scope/supervisors"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <SupervisorManagement />
              </ProtectedRoute>
            }
          />


          {/* ============ SUPERVISOR PORTAL ============ */}

          <Route
            path="/supervisor/stock"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorPortal key="stock" view="stock" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/history"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorPortal key="history" view="history" />
              </ProtectedRoute>
            }
          />

          {/* old supervisor URLs -> the two pages above */}
          <Route path="/supervisor/log-usage" element={<Navigate to="/supervisor/stock" replace />} />
          <Route path="/supervisor/return" element={<Navigate to="/supervisor/stock" replace />} />
          <Route path="/supervisor/my/inventory" element={<Navigate to="/supervisor/stock" replace />} />
          <Route path="/supervisor/usage" element={<Navigate to="/supervisor/history" replace />} />
          <Route path="/supervisor/received" element={<Navigate to="/supervisor/history" replace />} />


          {/* ============ ADD PRODUCT ============ */}

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



  


          {/* ============ CREATE STORE ============ */}

          <Route
            path="/admin/create/store"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <CreateStore />
              </ProtectedRoute>
            }
          />


          {/* ============ UNAUTHORIZED ============ */}

          <Route
            path="/unauthorized"
            element={<UnauthorizedPage />}
          />

        </Routes>

      </div>
       
    </>
  );
}

export default App;