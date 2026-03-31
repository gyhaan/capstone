import requests
from datetime import datetime

# ---> Scientific Water Requirements (Average mm per week) <---
# Based on FAO Crop Water Information standards
CROP_WATER_NEEDS = {
    "Paddy rice": 50.0,
    "Bananas": 40.0,
    "Banana for beer": 40.0,
    "Cooking Banana": 40.0,
    "Dessert banana": 40.0,
    "Maize": 30.0,
    "Irish potatoes": 25.0,
    "Wheat": 25.0,
    "Yams & Taro": 25.0,
    "Beans": 20.0,
    "Bush bean": 20.0,
    "Climbing bean": 20.0,
    "Soya beans": 20.0,
    "Peas": 20.0,
    "Sweet potatoes": 20.0,
    "Ground nuts": 20.0,
    "Sorghum": 15.0,
    "Cassava": 10.0,
}

def get_live_weather(lat: float, lon: float, start_date: str, end_date: str):
    """
    Fetches weather data for a highly specific GPS coordinate.
    """
    print(f"Fetching live weather for coordinates: {lat}, {lon}...")

    weather_url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&daily=temperature_2m_mean,precipitation_sum"
        f"&timezone=Africa/Kigali"
    )
    
    weather_response = requests.get(weather_url).json()
    
    if "daily" not in weather_response:
        error_msg = weather_response.get("reason", "Unknown API Error")
        raise ValueError(f"Failed to fetch weather data. Reason: {error_msg}")

    # Calculate averages and sums
    daily_temps = weather_response["daily"]["temperature_2m_mean"]
    daily_rain = weather_response["daily"]["precipitation_sum"]
    
    clean_temps = [t for t in daily_temps if t is not None]
    clean_rain = [r for r in daily_rain if r is not None]

    average_temp = sum(clean_temps) / len(clean_temps) if clean_temps else 0.0
    total_rainfall = sum(clean_rain) if clean_rain else 0.0

    return {
        "Total_Rainfall_mm": round(total_rainfall, 2),
        "Average_Temp_C": round(average_temp, 2)
    }

def get_7_day_forecast(lat: float, lon: float) -> dict:
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=precipitation_sum,temperature_2m_max&timezone=Africa/Kigali&forecast_days=7"
    res = requests.get(url).json()
    
    clean_rain = [r for r in res["daily"]["precipitation_sum"] if r is not None]
    clean_temp = [t for t in res["daily"]["temperature_2m_max"] if t is not None]
    
    total_rain = sum(clean_rain) if clean_rain else 0.0
    avg_temp = sum(clean_temp) / len(clean_temp) if clean_temp else 0.0
    
    return {
        "forecast_rain_mm": round(total_rain, 2),
        "forecast_temp_c": round(avg_temp, 2)
    }

def generate_crop_advisory(crop: str, forecast_rain_mm: float) -> str:
    """
    Generates a dynamic SMS/USSD advisory based on FAO water requirements.
    """
    # 1. Look up the specific crop's water needs (fallback to 20mm if not found)
    target_rain = CROP_WATER_NEEDS.get(crop, 20.0)
    
    # 2. Define dynamic thresholds based on the target
    deficit_threshold = target_rain * 0.7  # Less than 70% of required water
    flood_threshold = target_rain * 2.0    # More than double the required water

    # 3. Generate the dynamic advisory
    if forecast_rain_mm > flood_threshold:
        return f"Warning: Heavy rain ({forecast_rain_mm}mm) expected. Your {crop} only needs {target_rain}mm. Ensure proper drainage trenches to prevent root rot."
        
    elif forecast_rain_mm < deficit_threshold:
        deficit_amount = round(target_rain - forecast_rain_mm, 1)
        return f"Alert: Dry week ahead ({forecast_rain_mm}mm). Your {crop} needs {target_rain}mm. Plan to irrigate ~{deficit_amount}mm to prevent heat stress."
        
    else:
        return f"Good news: Expected rainfall ({forecast_rain_mm}mm) is optimal for your {crop} (target: {target_rain}mm). Proceed with routine weeding."