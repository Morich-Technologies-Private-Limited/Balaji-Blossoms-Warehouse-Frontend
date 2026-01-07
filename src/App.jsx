import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import LoginForm from "./component/auth/LoginForm";
import Register from "./component/auth/Register";
import DynamicSidebar from "./component/sidebar/DynamicSidebar";
import MainStoreTransfer from "./component/mainstore/MainStoreTransfer";

/* 🔐 Protected Route INSIDE App.jsx */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.userRole))
    return <Navigate to="/unauthorized" replace />;

  return children;
};

function App() {
  const location = useLocation();
  const pathname = location.pathname;

  const [userRole, setUserRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    if (pathname.startsWith("/admin")) setUserRole("admin");
    else if (pathname.startsWith("/mainstore")) setUserRole("mainstore");
    else if (pathname.startsWith("/substore")) setUserRole("substore");
    else if (pathname.startsWith("/storehouse")) setUserRole("storehouse");
    else setUserRole(null);
  }, [pathname]);

  const showSidebar = userRole !== null;

  return (
    <>
      {showSidebar && (
        <DynamicSidebar
          role={userRole}
          onSidebarChange={setIsSidebarOpen}
        />
      )}

      <div className={`main-content ${!isSidebarOpen || isMobile ? "sidebar-closed" : ""}`}>
        <Routes>

          {/* ============ PUBLIC ============ */}
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<Register />} />
          

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
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <h2>User Management</h2>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/stores"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <h2>Store Management</h2>
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

          <Route
            path="/mainstore/transfer"
            element={
              <ProtectedRoute allowedRoles={["MAIN_STORE_MANAGER"]}>
                <MainStoreTransfer />
              </ProtectedRoute>
            }
          />

          {/* ============ SUB STORE ============ */}
          <Route
            path="/substore"
            element={
              <ProtectedRoute allowedRoles={["SUB_STORE_MANAGER", "SUB_STORE_SUPERVISOR"]}>
                <h2>Sub Store Dashboard</h2>
              </ProtectedRoute>
            }
          />

          <Route
            path="/storehouse"
            element={
              <ProtectedRoute allowedRoles={["SHOP_MANAGER"]}>
                <h2>Store House Dashboard</h2>
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={<h2>❌ You are not authorized</h2>}
          />

        </Routes>
      </div>
    </>
  );
}

export default App;
