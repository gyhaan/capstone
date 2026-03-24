// src/components/DashboardLayout.jsx
import React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Map as MapIcon, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const farmerName = localStorage.getItem("full_name") || "Farmer";

  const handleLogout = () => {
    localStorage.removeItem("farmer_id");
    localStorage.removeItem("full_name");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        {/* Brand Logo Area */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Agri<span className="text-green-700">Guard</span>
          </h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/dashboard">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                location.pathname === "/dashboard"
                  ? "bg-green-50 text-green-700 font-semibold shadow-sm border border-green-100"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Farm Portfolio
            </button>
          </Link>

          <Link to="/dashboard/map">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                location.pathname === "/dashboard/map"
                  ? "bg-green-50 text-green-700 font-semibold shadow-sm border border-green-100"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MapIcon className="w-5 h-5" />
              GIS Heatmap
            </button>
          </Link>
        </nav>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="w-full flex justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 hidden md:block">
            {location.pathname === "/dashboard/map" ? "Regional Crop Health Map" : "Dashboard Overview"}
          </h2>
          {/* Mobile fallback title */}
          <h2 className="text-xl font-bold text-green-700 md:hidden">AgriGuard</h2>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {farmerName}
            </span>
            <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Container (The Outlet) */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
          <Outlet /> {/* <-- This is where Dashboard or Map will render */}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;