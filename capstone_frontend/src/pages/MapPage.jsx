// src/pages/MapPage.jsx
import React from "react";
import FarmMap from "@/components/FarmMap";
import { Card, CardContent } from "@/components/ui/card";

const MapPage = () => {
  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900">GIS Heatmap</h1>
        <p className="text-gray-500">Monitor regional crop health based on the latest AI predictions.</p>
      </div>

      <Card className="flex-1 min-h-[600px] overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0 h-full relative">
            <div className="absolute inset-0">
                <FarmMap />
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapPage;