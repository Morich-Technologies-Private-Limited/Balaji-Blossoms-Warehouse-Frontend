// Updated App.js
import { Routes, Route, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './App.css' // Import the global CSS

import LoginForm from "./component/auth/LoginForm"
import Register from "./component/auth/Register"
import DynamicSidebar from "./component/sidebar/DynamicSidebar"
import MainStoreTransfer from "./component/mainstore/MainStoreTransfer"

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // State for role and sidebar
  const [userRole, setUserRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/mainstore')) {
      setUserRole('mainstore');
    } else if (pathname.startsWith('/substore')) {
      setUserRole('substore');
    } else if (pathname.startsWith('/storehouse')) {
      setUserRole('storehouse');
    } else {
      setUserRole(null);
    }
  }, [pathname]);

  const showSidebar = userRole !== null;

  // Handler to receive sidebar state from DynamicSidebar
  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <>
      {showSidebar && (
        <DynamicSidebar 
          role={userRole} 
          onSidebarChange={handleSidebarToggle}
        />
      )}
      
      <div className={`main-content ${!isSidebarOpen || isMobile ? 'sidebar-closed' : ''}`}>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/mainstore/register" element={<Register />} />
          <Route path="/mainstore/transfer" element={<MainStoreTransfer />} />
          
          
          {/* Main Store Routes */}
          <Route path="/mainstore" element={
            <div>
              <h2>Main Store Dashboard</h2>
              <p>Content should shift based on sidebar state</p>
            </div>
          } />
          <Route path="/mainstore/dashboard1" element={
            <div>
              <h2>Dashboard 1</h2>
              <p>This content should not be overlapped by sidebar</p>
            </div>
          } />
          <Route path="/mainstore/dashboard2" element={
            <div>
              <h2>Dashboard 2</h2>
              <p>This content should not be overlapped by sidebar</p>
            </div>
          } />
          <Route path="/mainstore/dashboard3" element={
            <div>
              <h2>Dashboard 3</h2>
              <p>This content should not be overlapped by sidebar</p>
            </div>
          } />
          
          {/* Sub Store Routes */}
          <Route path="/substore" element={
            <div>
              <h2>Sub Store Dashboard</h2>
            </div>
          } />
          
          {/* Store House Routes */}
          <Route path="/storehouse" element={
            <div>
              <h2>Store House Dashboard</h2>
            </div>
          } />
        </Routes>
      </div>
    </>
  )
}

export default App