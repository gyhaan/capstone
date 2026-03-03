import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sprout, CloudRain, Thermometer, 
  History, Play, ArrowLeft, Sun, Cloud, AlertCircle, MapPin 
} from "lucide-react";
import { farmerService } from "@/services/api";
import { toast } from "sonner"; 

const FarmDetails = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();
  
  const [farm, setFarm] = useState(null);
  const [history, setHistory] = useState([]);
  const [liveAdvisory, setLiveAdvisory] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  const [error, setError] = useState(null); 

  const loadFarmData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      farmerService.getSingleFarm(farmId),
      farmerService.getFarmPredictions(farmId)
    ])
      .then(([farmRes, historyRes]) => {
        setFarm(farmRes.data);
        const sortedHistory = historyRes.data.sort((a, b) => 
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setHistory(sortedHistory);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load farm details. Please try again later.");
        toast.error("Failed to load farm data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFarmData();
  }, [farmId]);

  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      await farmerService.triggerPrediction(farmId);
      toast.success("AI Assessment completed successfully!");
      loadFarmData(); 
    } catch (err) {
      toast.error("Failed to run AI assessment. Please ensure the model is loaded.");
    } finally {
      setPredicting(false);
    }
  };

  const handleCheckWeather = async () => {
    setLoadingAdvisory(true);
    try {
      const response = await farmerService.getFarmAdvisory(farmId);
      setLiveAdvisory(response.data);
      toast.success("Live weather advisory fetched successfully!");
    } catch (err) {
      toast.error("Failed to fetch the 7-day weather forecast.");
    } finally {
      setLoadingAdvisory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-gray-500 font-medium">Loading farm profile...</p>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl font-bold text-gray-800">Farm not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  const latest = history[0] || null;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 pl-0 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-md">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-green-950">{farm.crop} Field</h1>
            <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 hover:bg-green-200">
              {farm.farm_size_ha} Hectares
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-gray-600 font-medium">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {farm.district} District</span>
            <span>•</span>
            <span>Planted: {new Date(farm.planting_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleCheckWeather} 
            disabled={loadingAdvisory} 
            variant="outline" 
            className="border-blue-600 text-blue-700 hover:bg-blue-50 w-full sm:w-auto shadow-sm"
          >
            {loadingAdvisory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
            Get 7-Day Weather
          </Button>
          
          <Button 
            onClick={handleRunPrediction} 
            disabled={predicting} 
            className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto shadow-sm"
          >
            {predicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 text-green-100" />}
            Run AI Assessment
          </Button>
        </div>
      </header>

      {liveAdvisory && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md transform transition-all animate-in fade-in slide-in-from-top-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-blue-900">7-Day Weather Advisory</CardTitle>
              <CardDescription className="text-blue-700">Immediate guidance based on current forecasts</CardDescription>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Sun className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 text-lg font-medium leading-relaxed mb-4">
              {liveAdvisory.crop_advisory}
            </p>
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-white text-blue-800 border-blue-300">
                Rain Expected: {liveAdvisory.forecast_rain_mm} mm
              </Badge>
              <Badge variant="outline" className="bg-white text-blue-800 border-blue-300">
                Avg Highs: {liveAdvisory.forecast_temp_c}°C
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!latest ? (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="py-16 text-center text-gray-500 space-y-4">
            <Sprout className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">No Assessments Yet</h3>
            <p>Click "Run AI Assessment" to analyze satellite data and predict your crop yield.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Latest Yield Assessment</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-green-50 border-green-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-green-900">Est. Total Harvest</CardTitle>
                  <Sprout className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-green-950">
                    {latest.total_estimated_harvest_kg ? `${latest.total_estimated_harvest_kg.toLocaleString()} kg` : `${latest.predicted_yield_kg_ha} kg`}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-green-800 bg-green-200/50 px-2 py-1 rounded-md">
                      Rate: {latest.predicted_yield_kg_ha} kg/ha
                    </span>
                    <Badge className={latest.health_status === 'Green' ? 'bg-green-500 hover:bg-green-600' : latest.health_status === 'Yellow' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}>
                      {latest.health_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Season Rainfall</CardTitle>
                  <CloudRain className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{latest.total_rainfall_mm} mm</div>
                  <p className="text-xs text-gray-500 mt-1">Total recorded</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Temperature</CardTitle>
                  <Thermometer className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{latest.average_temp_c}°C</div>
                  <p className="text-xs text-gray-500 mt-1">Daily mean</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Vegetation Health</CardTitle>
                  <History className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{latest.mean_ndvi}</div>
                  <p className="text-xs text-gray-500 mt-1">Satellite NDVI score</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-gray-800">Historical Tracking</h2>
            <Card className="shadow-sm overflow-hidden border-gray-200">
              <CardContent className="p-4 space-y-4">
                {history.map((item) => (
                  <div key={item._id} className="border-b pb-4 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900">
                      Date: {new Date(item.created_at || new Date()).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600 mt-1">Season: {item.season}</p>
                    <p className="text-gray-600 mt-1">Yield Rate: {item.predicted_yield_kg_ha} kg/ha</p>
                    <p className="text-gray-600 mt-1">
                      Total Harvest: {item.total_estimated_harvest_kg ? `${item.total_estimated_harvest_kg.toLocaleString()} kg` : '-'}
                    </p>
                    <p className="mt-2">
                      <Badge variant={item.health_status === 'Green' ? 'default' : 'secondary'} 
                             className={item.health_status === 'Green' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                        item.health_status === 'Yellow' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                                        'bg-red-100 text-red-800 hover:bg-red-100'}>
                        {item.health_status}
                      </Badge>
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
};

export default FarmDetails;