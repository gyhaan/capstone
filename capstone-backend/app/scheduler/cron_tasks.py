from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
import pandas as pd

from app.database import farm_collection, prediction_collection
from app.services.weather_fetcher import get_live_weather, get_7_day_forecast, generate_crop_advisory
from app.services.ndvi_fetcher import get_live_ndvi
from app.state import ml_components
from app.models import PredictionModel

def get_current_season_dates():
    """Dynamically calculates the correct season and dates based on today."""
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


async def weekly_crop_health_update():
    """
    The heartbeat of the system. Loops through all farms, fetches live data,
    runs the ML model, and updates the RAG health status.
    """
    print(f"\n--- Starting Automated Crop Health Update: {datetime.now()} ---")
    
    cursor = farm_collection.find({})
    farms = await cursor.to_list(length=1000)
    
    if not farms:
        print("No farms found in the database. Skipping update.")
        return

    # NEW: Fetch dates dynamically every time the cron job wakes up
    season, start_date, end_date = get_current_season_dates()
    baseline_yield = 1500.0

    print(f"Tracking for: {season} ({start_date} to {end_date})")

    for farm in farms:
        farm_id = str(farm["_id"])
        farmer_id = farm["farmer_id"]
        crop = farm["crop"]
        
        lat = farm.get("latitude", -1.9441)
        lon = farm.get("longitude", 30.0619)
        farm_size_ha = farm.get("farm_size_ha", 1.0)
        
        print(f"-> Analyzing Farm: {farm_id}...")
        
        try:
            weather_data = get_live_weather(lat, lon, start_date, end_date)
            ndvi_data = get_live_ndvi(lat, lon, start_date, end_date) 
            
            if isinstance(ndvi_data, dict):
                ndvi_score = ndvi_data["score"]
                safe_start = ndvi_data["safe_start_date"]
            else:
                ndvi_score = ndvi_data
                safe_start = (datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d")
            
            # Get future forecast and advisory
            forecast_data = get_7_day_forecast(lat, lon)
            advisory = generate_crop_advisory(crop, forecast_data["forecast_rain_mm"])
            
            if "model" in ml_components:
                input_df = pd.DataFrame([{
                    "District": farm["district"],
                    "Crop": crop,
                    "Season": season,
                    "Total_Rainfall_mm": weather_data["Total_Rainfall_mm"],
                    "Average_Temp_C": weather_data["Average_Temp_C"],
                    "Mean_NDVI": ndvi_score
                }])
                predicted_yield = ml_components["model"].predict(input_df)[0]
                total_estimated_harvest_kg = predicted_yield * farm_size_ha
            else:
                print("ML Model not loaded. Skipping.")
                continue
                
            ratio = predicted_yield / baseline_yield
            if ratio >= 0.9 and ndvi_score > 0.45:
                health_status = "Green"
            elif ratio >= 0.75:
                health_status = "Yellow"
            else:
                health_status = "Red"
                
            new_prediction = PredictionModel(
                farm_id=farm_id,
                farmer_id=farmer_id,
                season=season,
                total_rainfall_mm=weather_data["Total_Rainfall_mm"],
                average_temp_c=weather_data["Average_Temp_C"],
                mean_ndvi=ndvi_score,
                ndvi_start_date=safe_start,
                predicted_yield_kg_ha=round(predicted_yield, 2),
                total_estimated_harvest_kg=round(total_estimated_harvest_kg, 2),
                baseline_yield_kg_ha=baseline_yield,
                health_status=health_status,
                forecast_rain_mm=forecast_data["forecast_rain_mm"],
                forecast_temp_c=forecast_data["forecast_temp_c"],
                crop_advisory=advisory
            )
            
            pred_dict = new_prediction.model_dump(by_alias=True, exclude={"id"})
            await prediction_collection.insert_one(pred_dict)
            print(f"   Success! Updated status: {health_status}")
            
        except Exception as e:
            print(f"Failed to update farm {farm_id}. Error: {e}")

    print("--- Automated Update Complete! ---\n")

# Initialize the scheduler
scheduler = AsyncIOScheduler()
# Schedule the job to run automatically every Monday at 6:00 AM
scheduler.add_job(weekly_crop_health_update, 'cron', day_of_week='mon', hour=6, minute=0)