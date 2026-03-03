from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timedelta
import pandas as pd
from bson import ObjectId

from app.database import farm_collection, prediction_collection
from app.models import PredictionModel
from app.services.weather_fetcher import get_live_weather, get_7_day_forecast, generate_crop_advisory
from app.services.ndvi_fetcher import get_live_ndvi
from app.state import ml_components
from app.scheduler.cron_tasks import weekly_crop_health_update

# Create the router to handle these specific URLs
router = APIRouter()

# A simple Pydantic model for the incoming request
class PredictRequest(BaseModel):
    farm_id: str


def get_current_season_dates():
    """
    Determines the current agricultural season (Strictly A or B for the ML model).
    Season A: September - February
    Season B: March - August (absorbing the short dry season)
    """
    today = datetime.now()
    month = today.month
    year = today.year
    
    # Cap the end date to yesterday to prevent Open-Meteo API crashes
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")

    # Season A: September to December
    if month >= 9:
        season = "Season A"
        start_date = f"{year}-09-01"
        target_end = f"{year + 1}-02-28"
        
    # Season A: January to February (wrapping into the new year)
    elif month <= 2:
        season = "Season A"
        start_date = f"{year - 1}-09-01"
        target_end = f"{year}-02-28"
        
    # Season B: March to August
    else: 
        season = "Season B"
        start_date = f"{year}-03-01"
        target_end = f"{year}-08-31"

    # Ensure we never query a date in the future
    safe_end_date = min(target_end, yesterday_str)
    
    return season, start_date, safe_end_date


@router.post("/api/predict", response_model=PredictionModel)
async def generate_prediction(request: PredictRequest):
    """
    Generates a live yield prediction by fetching real-time weather and NDVI data
    using the farm's exact GPS coordinates.
    """
    # 1. Fetch the farm details from MongoDB
    farm = await farm_collection.find_one({"_id": ObjectId(request.farm_id)})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found in the database.")
    
    district = farm["district"]
    crop = farm["crop"]
    farmer_id = farm["farmer_id"]
    lat = farm.get("latitude", -1.9441)
    lon = farm.get("longitude", 30.0619)
    farm_size_ha = farm.get("farm_size_ha", 1.0) 

    # 2. Dynamically determine the current season dates
    season, start_date, end_date = get_current_season_dates()

    # 3. Fetch Live Data & Forecasts
    try:
        weather_data = get_live_weather(lat, lon, start_date, end_date)
        
        # Fixed: Only pass lat, lon, end_date
        ndvi_score = get_live_ndvi(lat, lon, start_date,end_date) 
        ndvi_start_date = start_date
        
        # NEW: Fetch forecast and advisory
        forecast_data = get_7_day_forecast(lat, lon)
        advisory = generate_crop_advisory(crop, forecast_data["forecast_rain_mm"])
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"External API Error: {str(e)}")

    # 4. Prepare data for the Machine Learning Model
    input_df = pd.DataFrame([{
        "District": district,
        "Crop": crop,
        "Season": season,
        "Total_Rainfall_mm": weather_data["Total_Rainfall_mm"],
        "Average_Temp_C": weather_data["Average_Temp_C"],
        "Mean_NDVI": ndvi_score
    }])

    # 5. Run the Prediction using the model loaded in RAM
    if "model" not in ml_components:
        raise HTTPException(status_code=500, detail="ML Model is not loaded in memory.")
    
    predicted_yield = ml_components["model"].predict(input_df)[0]
    total_estimated_harvest_kg = predicted_yield * farm_size_ha

    # 6. Calculate RAG Health Status (The Traffic Light System)
    baseline_yield = 1500.0 
    ratio = predicted_yield / baseline_yield

    if ratio >= 0.9 and ndvi_score > 0.45:
        health_status = "Green"
    elif ratio >= 0.75:
        health_status = "Yellow"
    else:
        health_status = "Red"

    # 7. Create the database record with ALL fields
    new_prediction = PredictionModel(
        farm_id=request.farm_id,
        farmer_id=farmer_id,
        season=season,
        total_rainfall_mm=weather_data["Total_Rainfall_mm"],
        average_temp_c=weather_data["Average_Temp_C"],
        mean_ndvi=ndvi_score,
        ndvi_start_date=ndvi_start_date, # Fixed
        predicted_yield_kg_ha=round(predicted_yield, 2),
        total_estimated_harvest_kg=round(total_estimated_harvest_kg, 2), 
        baseline_yield_kg_ha=baseline_yield,
        health_status=health_status,
        forecast_rain_mm=forecast_data["forecast_rain_mm"], # Fixed
        forecast_temp_c=forecast_data["forecast_temp_c"], # Fixed
        crop_advisory=advisory # Fixed
    )

    # 8. Save to MongoDB
    new_pred_dict = new_prediction.model_dump(by_alias=True, exclude=["id"])
    result = await prediction_collection.insert_one(new_pred_dict)
    new_prediction.id = result.inserted_id

    return new_prediction

@router.get("/api/predictions/{farmer_id}")
async def get_farmer_predictions(farmer_id: str):
    cursor = prediction_collection.find({"farmer_id": farmer_id})
    predictions = await cursor.to_list(length=100)
    for pred in predictions:
        pred["_id"] = str(pred["_id"])
    return predictions

@router.get("/api/predictions/farm/{farm_id}")
async def get_farm_predictions(farm_id: str):
    cursor = prediction_collection.find({"farm_id": farm_id})
    predictions = await cursor.to_list(length=100)
    for pred in predictions:
        pred["_id"] = str(pred["_id"])
    return predictions

@router.post("/api/cron/trigger")
async def trigger_cron_job(background_tasks: BackgroundTasks):
    background_tasks.add_task(weekly_crop_health_update)
    return {"message": "Global update started in the background."}

# Add this new endpoint
@router.get("/api/farms/{farm_id}/advisory")
async def get_farm_advisory(farm_id: str):
    """
    Fetches an instant 7-day weather forecast and crop-specific advice 
    without running the heavy ML prediction model.
    """
    farm = await farm_collection.find_one({"_id": ObjectId(farm_id)})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")

    lat = farm.get("latitude", -1.9441)
    lon = farm.get("longitude", 30.0619)
    crop = farm["crop"]

    try:
        forecast_data = get_7_day_forecast(lat, lon)
        advisory_text = generate_crop_advisory(crop, forecast_data["forecast_rain_mm"])
        
        return {
            "forecast_rain_mm": forecast_data["forecast_rain_mm"],
            "forecast_temp_c": forecast_data["forecast_temp_c"],
            "crop_advisory": advisory_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather API Error: {str(e)}")