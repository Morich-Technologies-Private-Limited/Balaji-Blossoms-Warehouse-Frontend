// Updated App.js
import { Routes, Route, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import LoginForm from "./component/auth/LoginForm"
import Register from "./component/auth/Register"
import DynamicSidebar from "./component/sidebar/DynamicSidebar"

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determine role based on route
  const [userRole, setUserRole] = useState(null);

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

  return (
    <>
      {showSidebar && <DynamicSidebar role={userRole} />}
      
      <div style={{ marginLeft: showSidebar ? '250px' : '0', transition: 'margin-left 0.3s ease' }}>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main Store Routes */}
          <Route path="/mainstore" element={<div style={{ padding: '20px' }}><h2>Main Store Dashboard</h2></div>} />
          <Route path="/mainstore/dashboard1" element={<div style={{ padding: '20px' }}><h2>Dashboard 1</h2></div>} />
          <Route path="/mainstore/dashboard2" element={<div style={{ padding: '20px' }}><h2>Dashboard 2</h2></div>} />
          <Route path="/mainstore/dashboard3" element={<div style={{ padding: '20px' }}><h2>Dashboard 3</h2></div>} />
          
          {/* Sub Store Routes */}
          <Route path="/substore" element={<div style={{ padding: '20px' }}><h2>Sub Store Dashboard</h2></div>} />
          
          {/* Store House Routes */}
          <Route path="/storehouse" element={<div style={{ padding: '20px' }}><h2>Store House Dashboard</h2></div>} />
        </Routes>
      </div>
    </>
  )
}

export default App