import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const PortfolioHealthChart = ({ predictions }) => {
  // 1. Process the raw backend data into chart data
  const chartData = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];

    const counts = { Green: 0, Yellow: 0, Red: 0 };

    predictions.forEach((pred) => {
      if (counts[pred.health_status] !== undefined) {
        counts[pred.health_status]++;
      }
    });

    // Format for Recharts and assign exact Tailwind colors
    return [
      { name: "Healthy (Green)", value: counts.Green, color: "#22c55e" }, // tailwind green-500
      { name: "Monitor (Yellow)", value: counts.Yellow, color: "#eab308" }, // tailwind yellow-500
      { name: "Critical (Red)", value: counts.Red, color: "#ef4444" }, // tailwind red-500
    ].filter((item) => item.value > 0); // Hide empty slices
  }, [predictions]);

  // 2. Handle Empty State
  if (!predictions || predictions.length === 0) {
    return (
      <Card className="flex flex-col h-full shadow-sm border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gray-800">
            Portfolio Health
          </CardTitle>
          <CardDescription>AI Risk Assessment</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm">No prediction data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Render the Donut Chart
  return (
    <Card className="flex flex-col h-full shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-gray-800">
          Portfolio Health
        </CardTitle>
        <CardDescription>
          Current AI risk breakdown across all fields
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60} // This creates the "Donut" hole
              outerRadius={80}
              paddingAngle={3} // Adds a nice gap between slices
              dataKey="value"
              stroke="none" // Removes the border around slices
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              // This formats the popup to say "6 Farms" instead of just "6"
              formatter={(value, name) => [
                `${value} Farm${value !== 1 ? "s" : ""}`,
                name,
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontWeight: "bold", color: "#374151" }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-700 font-medium">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthChart;
