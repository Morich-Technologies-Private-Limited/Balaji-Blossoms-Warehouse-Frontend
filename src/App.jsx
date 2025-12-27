import { Routes, Route, Link } from "react-router-dom"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import About from "./component/About"

function App() {
  return (
    <>
      {/* Simple Navbar */}
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">ViteApp</Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/about">Home</Link>
            <Link className="nav-link" to="/about">About</Link>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/about" element={<About />} />
        
      </Routes>
    </>
  )
}

export default App
