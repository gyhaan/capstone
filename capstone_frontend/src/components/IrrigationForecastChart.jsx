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

const IrrigationForecastChart = ({ prediction }) => {
  // 1. Process the single prediction object safely
  const chartData = useMemo(() => {
    if (!prediction || typeof prediction.forecast_rain_mm === 'undefined') {
        return [];
    }

    // Safely handle the data whether the backend returns a single float OR an array
    let totalRain = 0;
    if (Array.isArray(prediction.forecast_rain_mm)) {
      totalRain = prediction.forecast_rain_mm.reduce((sum, val) => sum + val, 0);
    } else {
      totalRain = Number(prediction.forecast_rain_mm) || 0;
    }

    // We use a standard baseline of 20mm of rain per week for healthy crop growth
    return [
      {
        name: "Next 7 Days",
        "Expected Rain": Number(totalRain.toFixed(2)),
        "Ideal Minimum": 20.0, 
      }
    ];
  }, [prediction]);

  // 2. Dynamic Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const expected = payload[0].value;
      const deficit = 20 - expected;
      
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-blue-100 min-w-[200px]">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">Weekly Moisture</p>
          <p className="text-sm text-blue-600 font-bold flex justify-between">
            <span>Expected:</span> <span>{expected} mm</span>
          </p>
          <p className="text-sm text-gray-500 font-medium flex justify-between mt-1">
            <span>Target:</span> <span>20 mm</span>
          </p>
          
          {deficit > 0 ? (
            <div className="mt-3 pt-2 border-t border-red-100 text-xs text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Deficit: {deficit.toFixed(1)} mm (Irrigation Needed)
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-green-100 text-xs text-green-600 font-bold flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              Sufficient Natural Rainfall
            </div>
          )}
        </div>
      );
    }
    return null;
  };

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
  const isDeficit = expectedRain < 20;

  return (
    <Card className="flex flex-col shadow-sm border-gray-200 h-[350px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Irrigation Requirement Planner
          </CardTitle>
          <CardDescription>
            Comparing predicted 7-day rainfall against crop requirements
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
            barSize={60}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            {/* The Target Baseline */}
            <Bar 
              dataKey="Ideal Minimum" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
            />
            
            {/* The Expected Rain - Changes color if it drops below the target! */}
            <Bar 
              dataKey="Expected Rain" 
              fill={isDeficit ? "#ef4444" : "#3b82f6"} 
              radius={[4, 4, 0, 0]} 
            />
            
            {/* A clear visual line showing the goal threshold */}
            <ReferenceLine y={20} stroke="#64748b" strokeDasharray="3 3" />
            
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default IrrigationForecastChart;