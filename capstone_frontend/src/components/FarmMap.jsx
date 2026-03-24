import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const FarmMap = () => {
  const [markers, setMarkers] = useState([]);
  // 1. Add state to track which health status we are filtering by
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/map-data`);
        setMarkers(response.data);
      } catch (error) {
        console.error("Failed to load map data", error);
      }
    };
    fetchMapData();
  }, []);

  // Center the map on Rwanda
  const rwandaCenter = [-1.9403, 29.8739];

  // 2. Filter the markers array before mapping over it
  const filteredMarkers = markers.filter(marker => {
    if (activeFilter === 'All') return true;
    return marker.health_status === activeFilter;
  });

  // Helper to get the exact hex color for the SVG circles
  const getStatusColor = (status) => {
    if (status === 'Red') return '#ef4444';    // Tailwind red-500
    if (status === 'Yellow') return '#eab308'; // Tailwind yellow-500
    if (status === 'Green') return '#22c55e';  // Tailwind green-500
    return '#9ca3af';                          // Default gray
  };

  return (
    // Changed height to h-full so it fills the new MapPage card container
    <div className="relative h-full min-h-[500px] w-full rounded-lg overflow-hidden border shadow-sm">
      
      {/* 3. FLOATING CONTROL PANEL (Z-index 1000 to sit above Leaflet map) */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-2 min-w-[180px]">
        <h3 className="text-sm font-bold text-gray-700 mb-1 px-1">Filter by AI Status</h3>
        
        <button 
          onClick={() => setActiveFilter('All')}
          className={`px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${activeFilter === 'All' ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          🌍 Show All Farms
        </button>
        <button 
          onClick={() => setActiveFilter('Red')}
          className={`px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${activeFilter === 'Red' ? 'bg-red-50 text-red-700 ring-1 ring-red-300' : 'text-gray-600 hover:bg-red-50'}`}
        >
          🔴 Critical Risk
        </button>
        <button 
          onClick={() => setActiveFilter('Yellow')}
          className={`px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${activeFilter === 'Yellow' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-300' : 'text-gray-600 hover:bg-yellow-50'}`}
        >
          🟡 Monitor / Warning
        </button>
        <button 
          onClick={() => setActiveFilter('Green')}
          className={`px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${activeFilter === 'Green' ? 'bg-green-50 text-green-700 ring-1 ring-green-300' : 'text-gray-600 hover:bg-green-50'}`}
        >
          🟢 Healthy Yield
        </button>
      </div>

      <MapContainer center={rwandaCenter} zoom={9} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />
        
        {/* 4. LOOP THROUGH FILTERED MARKERS USING CIRCLEMARKER */}
        {filteredMarkers.map((marker, index) => (
          <CircleMarker 
            key={index} 
            center={[marker.lat, marker.lng]} 
            radius={8} // Size of the dot
            pathOptions={{ 
              color: getStatusColor(marker.health_status),
              fillColor: getStatusColor(marker.health_status),
              fillOpacity: 0.8,
              weight: 2 // Border thickness
            }}
          >
            {/* 5. RICH TELEMETRY POPUP */}
            <Popup className="agri-popup">
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-base border-b pb-1 mb-2">{marker.crop} Farm</h3>
                
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="flex justify-between">
                    <span className="text-gray-500">District:</span> 
                    <span className="font-medium">{marker.district}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">NDVI Health:</span> 
                    <span className="font-medium">{marker.mean_ndvi > 0 ? marker.mean_ndvi : 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-gray-500">Predicted Yield:</span> 
                    <span className="font-bold text-gray-900">{marker.predicted_yield_kg_ha > 0 ? `${marker.predicted_yield_kg_ha} kg/ha` : 'Pending'}</span>
                  </p>
                  <p className="flex justify-between items-center bg-gray-50 p-1 rounded mt-2">
                    <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Status</span> 
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      marker.health_status === 'Red' ? 'bg-red-100 text-red-700' : 
                      marker.health_status === 'Green' ? 'bg-green-100 text-green-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {marker.health_status}
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FarmMap;