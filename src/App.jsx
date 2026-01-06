import { Routes, Route, Link } from "react-router-dom"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import About from "./component/About"
import LoginForm from "./component/auth/LoginForm"
import Register from "./component/auth/Register"

function App() {
  return (
    <>
     
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        
      </Routes>
    </>
  )
}

export default App
