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
import SupervisorTransfer from "./component/mainstore/SupervisorTransfer";
import Dashboard from "./component/mainstore/Dashboard";
import CreateStore from "./component/admin/CreateStore";

// ===== Release branch =====
import ProductExpiry from "./component/stock/ProductExpiry";
import SupervisorActivity from "./component/supervisor/SupervisorActivity";
import SupervisorManagement from "./component/supervisor/SupervisorManagement";
import SupervisorPortal from "./supervisor/SupervisorPortal";
import InventoryCorrection from "./inventoryCorrection/InventoryCorrection";
import InventoryCorrectionAdmin from "./inventoryCorrection/InventoryCorrectionAdmin";

// ===== Test branch =====
import ViewSupervisorInventory from "./component/supervisor/ViewSupervisorInventory";
import SupervisorInternalTransfer from "./component/supervisor/SupervisorInternalTransfer";
import SupervisorReturnToStore from "./component/supervisor/SupervisorReturnToStore";
import SupervisorUsage from "./component/supervisor/SupervisorUsage";


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


          {/* ============ COMMON DASHBOARD ============ */}

          <Route
            path="/:scope/dashboard"
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


          {/* ============ STOCK TRANSFER HISTORY ============ */}

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


          {/* ============ SUPERVISOR TRANSFER FROM STORE ============ */}

          <Route
            path="/:scope/supervisor/transfer"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "MAIN_STORE_MANAGER",
                  "SUB_STORE_MANAGER",
                ]}
              >
                <SupervisorTransfer />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              SUPERVISOR FEATURES
              ===================================================== */}

          {/* Supervisor's own inventory */}
          <Route
            path="/:scope/my/inventory"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERVISOR",
                ]}
              >
                <ViewSupervisorInventory />
              </ProtectedRoute>
            }
          />


          {/* Supervisor → Supervisor transfer */}
          <Route
            path="/:scope/transfer/supervisor"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERVISOR",
                ]}
              >
                <SupervisorInternalTransfer />
              </ProtectedRoute>
            }
          />


          {/* Supervisor → Store return */}
          <Route
            path="/:scope/transfer/store"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERVISOR",
                ]}
              >
                <SupervisorReturnToStore />
              </ProtectedRoute>
            }
          />


          {/* Supervisor usage */}
          <Route
            path="/:scope/usage"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
                  "SUPERVISOR",
                ]}
              >
                <SupervisorUsage />
              </ProtectedRoute>
            }
          />


          {/* Manager/Admin view of supervisor inventory */}
          <Route
            path="/:scope/supervisor/inventory"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "ADMIN",
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
                <SupervisorPortal
                  key="stock"
                  initialTab="stock"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/log-usage"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorPortal
                  key="log"
                  initialTab="log"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/usage"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorPortal
                  key="usage"
                  initialTab="usage"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/received"
            element={
              <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
                <SupervisorPortal
                  key="received"
                  initialTab="received"
                />
              </ProtectedRoute>
            }
          />


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


          {/* ============ SUB STORE ============ */}

          <Route
            path="/substore"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SUB_STORE_MANAGER",
                  "SUB_STORE_SUPERVISOR",
                ]}
              >
                <h2>Sub Store Dashboard</h2>
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