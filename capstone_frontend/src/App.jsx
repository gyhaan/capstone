import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FarmDetails from "./pages/FarmDetails";
import Home from "./pages/Home";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const farmerId = localStorage.getItem("farmer_id");
    if (farmerId) {
      setUser(farmerId);
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <>
    <Toaster richColors position="top-right" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login onLoginSuccess={(id) => setUser(id)} />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/farm/:farmId" element={user ? <FarmDetails /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;