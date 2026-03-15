import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Custom colored icons for the map
const getMarkerIcon = (status) => {
  let colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png';
  if (status === 'Green') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
  if (status === 'Yellow') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png';
  if (status === 'Red') colorUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';

  return new L.Icon({
    iconUrl: colorUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const FarmMap = () => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Fetch the data from your new FastAPI route
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

  // Center the map on Rwanda (Kigali roughly)
  const rwandaCenter = [-1.9403, 29.8739];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border shadow-sm">
      <MapContainer center={rwandaCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
        {/* This is the free OpenStreetMap base layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Loop through your backend data and plot the pins */}
        {markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={[marker.lat, marker.lng]} 
            icon={getMarkerIcon(marker.health_status)}
          >
            <Popup>
              <strong>{marker.crop} Farm</strong><br />
              District: {marker.district}<br />
              Status: <span className={`font-bold ${marker.health_status === 'Red' ? 'text-red-600' : marker.health_status === 'Green' ? 'text-green-600' : 'text-yellow-600'}`}>{marker.health_status}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FarmMap;