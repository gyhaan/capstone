// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage"; // <-- NEW IMPORT
import FarmDetails from "./pages/FarmDetails";
import Home from "./pages/Home";
import AgriGuardLanding from "./pages/NuraHeath";

// Layout
import DashboardLayout from "./components/DashboardLayout"; // <-- NEW IMPORT

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
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/nura" element={<AgriGuardLanding />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLoginSuccess={(id) => setUser(id)} />} />
          
          {/* Protected Routes wrapped in the new Layout */}
          <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
            {/* The index route ("") renders when the URL is exactly "/dashboard" */}
            <Route index element={<Dashboard />} />
            
            {/* The map route renders when the URL is "/dashboard/map" */}
            <Route path="map" element={<MapPage />} />
          </Route>

          {/* Farm Details (Assuming this is a full-page view without the sidebar) */}
          <Route path="/farm/:farmId" element={user ? <FarmDetails /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;