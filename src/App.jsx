import { Routes, Route, Link } from "react-router-dom"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import About from "./component/About"
import LoginForm from "./component/auth/LoginForm"

function App() {
  return (
    <>
     
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        
      </Routes>
    </>
  )
}

export default App
