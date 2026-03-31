import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Calendar,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { farmerService } from "@/services/api";
import RegisterFarmModal from "@/components/RegisterFarmModal";
import { toast } from "sonner";
import PortfolioHealthChart from "@/components/PortfolioHealthChart";
import YieldPerformanceChart from "@/components/YieldPerformanceChart";

const Dashboard = () => {
  const [farms, setFarms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cronLoading, setCronLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const farmerId = localStorage.getItem("farmer_id");
  const farmerName = localStorage.getItem("full_name") || "Farmer";

  const loadDashboardData = () => {
    if (!farmerId) return;
    setLoading(true);

    Promise.all([
      farmerService.getFarmerFarms(farmerId),
      farmerService.getFarmerHistory(farmerId),
    ])
      .then(([farmsRes, predsRes]) => {
        const activeFarms = farmsRes.data;
        const allHistory = predsRes.data;
        
        setFarms(activeFarms);

        // --- BULLETPROOF FILTERING & DATA MERGE ---
        
        // 1. Loop through the active farms we just fetched
        const latestPredictions = activeFarms.map((farm) => {
          
          // 2. Find all historical predictions that belong to THIS specific farm
          const predsForThisFarm = allHistory.filter(
            (p) => p.farm_id === farm._id
          );

          // If this farm hasn't been scanned by the AI yet, skip it
          if (predsForThisFarm.length === 0) return null;

          // 3. Sort the predictions for this farm by date (Newest first)
          predsForThisFarm.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );

          // 4. THE FIX: Grab the newest prediction, and inject the farm details!
          const latestPred = predsForThisFarm[0];
          return {
            ...latestPred,       // Keep all AI data (yield, health, rainfall, etc.)
            crop: farm.crop,     // <-- INJECTED FOR TOOLTIP
            district: farm.district // <-- INJECTED FOR TOOLTIP
          };
        });

        // 5. Remove any "null" values (farms without predictions) and update state
        const cleanPredictions = latestPredictions.filter((pred) => pred !== null);
        
        setPredictions(cleanPredictions);
        // -----------------------------------------
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        toast.error("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, [farmerId]);

  const handleTriggerCron = async () => {
    setCronLoading(true);
    try {
      await farmerService.triggerGlobalUpdate();
      toast.success("System update initiated!", {
        description:
          "The AI is scanning all registered farms via satellite. Refreshing in 10 seconds...",
        duration: 10000,
      });

      setTimeout(() => {
        loadDashboardData();
        setCronLoading(false);
      }, 10000);
    } catch (error) {
      console.error("Cron failed:", error);
      toast.error(
        "Failed to trigger update. Check if your FastAPI server is running."
      );
      setCronLoading(false);
    }
  };

  if (loading && farms.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-900">
            Welcome, {farmerName}
          </h1>
          <p className="text-gray-500">
            Manage your fields and run AI predictions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleTriggerCron}
            disabled={cronLoading}
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50 shadow-sm"
          >
            {cronLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {cronLoading ? "Scanning Satellites..." : "Force System Update"}
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-700 hover:bg-green-800 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Register New Farm
          </Button>
        </div>
      </header>

      {/* CHARTS SECTION */}
      {farms.length > 0 && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <PortfolioHealthChart predictions={predictions} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <YieldPerformanceChart predictions={predictions} />
            </div>
          </div>
        </section>
      )}

      {/* FARMS LIST SECTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">My Fields</h2>
        {farms.length === 0 ? (
          <Card className="bg-gray-50 border-dashed border-2">
            <CardContent className="py-12 text-center text-gray-500">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No farms registered yet.</p>
              <p className="text-sm">
                Click "Register New Farm" to start monitoring your crops.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => (
              <Card
                key={farm._id}
                className="border-green-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-green-300"
                onClick={() => navigate(`/farm/${farm._id}`)}
              >
                <CardHeader className="pb-2 bg-green-50/50 rounded-t-xl border-b border-green-50">
                  <CardTitle className="text-lg flex items-center justify-between text-green-900">
                    <span>{farm.crop}</span>
                    <Badge
                      variant="secondary"
                      className="bg-white text-green-700 border-green-200"
                    >
                      {farm.district}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="text-sm text-gray-600 flex flex-col gap-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" /> Planted:{" "}
                      {new Date(farm.planting_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" /> Size:{" "}
                      {farm.farm_size_ha} ha
                    </span>
                  </div>
                  <Button
                    className="w-full bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border border-green-200"
                    variant="secondary"
                  >
                    View Health & AI Data <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <RegisterFarmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default Dashboard;