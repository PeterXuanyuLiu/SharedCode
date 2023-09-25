import Navbar from "./Navbar"
import Login from "./pages/Login"
import Home from "./pages/Home"
import Events from "./pages/Events"
import Account from "./pages/Account"
import Signup from "./pages/Signup"
import Scenic from "./pages/Scenic"
import Social from "./pages/Social"
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path ="/account" element={<Account />} />
          <Route path="/events" element={<Events />} />
          <Route path="/scenic" element={<Scenic />} />
          <Route path="/social" element={<Social />} />
        </Routes>
      </div>
    </>
  )
}

export default App