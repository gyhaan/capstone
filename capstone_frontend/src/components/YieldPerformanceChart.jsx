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
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

// ---> ADD THIS CUSTOM TOOLTIP COMPONENT <---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Grabs the full data object for this specific bar

    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 min-w-[180px]">
        {/* Header: Crop and District */}
        <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 flex justify-between items-center gap-4">
          <span>{data.name} Farm</span>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {data.district}
          </span>
        </p>

        {/* Body: The Data with Units */}
        <div className="space-y-1 mb-3">
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm flex justify-between gap-4"
              style={{ color: entry.color }}
            >
              <span className="font-semibold">{entry.name}:</span>
              <span>{entry.value} kg/ha</span>
            </p>
          ))}
        </div>

        {/* Footer: The AI Health Status Badge */}
        <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            AI Status
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              data.status === "Red"
                ? "bg-red-100 text-red-700"
                : data.status === "Yellow"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {data.status}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const YieldPerformanceChart = ({ predictions }) => {
  // 1. Process the raw backend data into chart data
  const chartData = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    // Since a farmer might have multiple predictions over time for the same farm,
    // we only want to show the MOST RECENT prediction for each farm on the dashboard.
    const latestPredictionsMap = new Map();

    predictions.forEach((pred) => {
      // Assuming predictions are sorted chronologically from the backend,
      // this will continually overwrite and keep the newest one per farm.
      latestPredictionsMap.set(pred.farm_id, pred);
    });

    // Convert the Map back to an array and format it for Recharts
    return Array.from(latestPredictionsMap.values())
      .map((pred) => ({
        name: pred.crop, // e.g., "Maize"
        district: pred.district || "Unknown",
        Predicted: pred.predicted_yield_kg_ha,
        Baseline: pred.baseline_yield_kg_ha,
        status: pred.health_status,
      }))
      .slice(0, 6); // Limit to max 6 farms so the bars don't get too squished
  }, [predictions]);

  // Helper to color the Predicted bar based on its AI status
  const getStatusColor = (status) => {
    if (status === "Red") return "#ef4444";
    if (status === "Yellow") return "#eab308";
    return "#22c55e"; // Green default
  };

  // 2. Handle Empty State
  if (!predictions || predictions.length === 0) {
    return (
      <Card className="flex flex-col h-full shadow-sm border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-800">
            Yield Performance vs. Regional Baseline
          </CardTitle>
          <CardDescription>
            Compare your expected harvest against historical averages
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <TrendingDown className="w-8 h-8 opacity-50" />
            <p className="text-sm">
              Run an AI assessment to view yield comparisons.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Render the Grouped Bar Chart
  return (
    <Card className="flex flex-col h-full shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-gray-800">
          Yield Performance vs. Regional Baseline
        </CardTitle>
        <CardDescription>
          Comparing predicted harvest (kg/ha) against historical averages
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 min-h-[250px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}kg`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px" }}
            />

            {/* The Historical Baseline Bar (Dark Slate Gray) */}
            <Bar
              dataKey="Baseline"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              name="Historical Baseline (kg/ha)"
            />

            {/* The Predicted Yield Bar (Colors dynamically based on Red/Yellow/Green status!) */}
            <Bar
              dataKey="Predicted"
              radius={[4, 4, 0, 0]}
              name="Predicted Yield (kg/ha)"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStatusColor(entry.status)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default YieldPerformanceChart;
