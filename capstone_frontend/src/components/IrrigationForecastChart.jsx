import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplets, AlertTriangle } from "lucide-react";

// ---> Scientific Water Requirements (Average mm per week) <---
// Based on FAO Crop Water Information standards
const CROP_WATER_NEEDS = {
  // HIGH WATER NEEDS
  "Paddy rice": 50.0,
  "Bananas": 40.0,
  "Banana for beer": 40.0,
  "Cooking Banana": 40.0,
  "Dessert banana": 40.0,

  // MODERATE-HIGH WATER NEEDS
  "Maize": 30.0,
  "Irish potatoes": 25.0,
  "Wheat": 25.0,
  "Yams & Taro": 25.0,

  // MODERATE WATER NEEDS
  "Beans": 20.0,
  "Bush bean": 20.0,
  "Climbing bean": 20.0,
  "Soya beans": 20.0,
  "Peas": 20.0,
  "Sweet potatoes": 20.0,
  "Ground nuts": 20.0,

  // LOW WATER NEEDS (DROUGHT RESISTANT)
  "Sorghum": 15.0,
  "Cassava": 10.0,
};

// Default fallback if a crop isn't explicitly listed above
const DEFAULT_WATER_NEED = 20.0; 

const IrrigationForecastChart = ({ prediction, cropName }) => {
  
  // Look up the exact requirement, or use the 20mm fallback
  const targetRainfall = CROP_WATER_NEEDS[cropName] || DEFAULT_WATER_NEED;

  // 1. Process the single prediction object safely
  const chartData = useMemo(() => {
    if (!prediction || typeof prediction.forecast_rain_mm === 'undefined') {
        return [];
    }

    let totalRain = 0;
    if (Array.isArray(prediction.forecast_rain_mm)) {
      totalRain = prediction.forecast_rain_mm.reduce((sum, val) => sum + val, 0);
    } else {
      totalRain = Number(prediction.forecast_rain_mm) || 0;
    }

    return [
      {
        name: "Next 7 Days",
        "Expected Rain": Number(totalRain.toFixed(2)),
        "Ideal Minimum": targetRainfall,
      }
    ];
  }, [prediction, targetRainfall]);

  // 2. Dynamic Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const expected = payload[0].payload["Expected Rain"];
      const deficit = targetRainfall - expected;
      
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-blue-100 min-w-[200px]">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">Weekly Moisture</p>
          <p className="text-sm text-blue-600 font-bold flex justify-between gap-4">
            <span>Expected:</span> <span>{expected} mm</span>
          </p>
          <p className="text-sm text-gray-500 font-medium flex justify-between gap-4 mt-1">
            <span>Target ({cropName || "Crop"}):</span> <span>{targetRainfall} mm</span>
          </p>
          
          {deficit > 0 ? (
            <div className="mt-3 pt-2 border-t border-red-100 text-xs text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Deficit: {deficit.toFixed(1)} mm (Irrigation Needed)
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-green-100 text-xs text-green-600 font-bold flex items-center gap-1">
              <Droplets className="w-4 h-4" />
              Sufficient Natural Rainfall
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 3. Handle Empty State
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="flex flex-col shadow-sm border-gray-200 h-[350px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Irrigation Needs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">Run an AI assessment to calculate irrigation needs.</p>
        </CardContent>
      </Card>
    );
  }

  const expectedRain = chartData[0]["Expected Rain"];
  const isDeficit = expectedRain < targetRainfall;

  // 4. Render the Chart
  return (
    <Card className="flex flex-col shadow-sm border-gray-200 h-[350px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Irrigation Requirement Planner
          </CardTitle>
          <CardDescription>
            Comparing predicted 7-day rainfall against {cropName || "crop"} requirements
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
            barSize={80}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${value}mm`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            
            <Bar 
              dataKey="Ideal Minimum" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              name="Target Weekly Rain"
            />
            
            <Bar 
              dataKey="Expected Rain" 
              fill={isDeficit ? "#ef4444" : "#3b82f6"} 
              radius={[4, 4, 0, 0]} 
              name="Forecasted Rain"
            />
            
            {/* The Reference line dynamically shifts to the crop's specific target! */}
            <ReferenceLine y={targetRainfall} stroke="#64748b" strokeDasharray="3 3" />
            
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default IrrigationForecastChart;