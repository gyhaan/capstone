import requests
from datetime import datetime

def get_live_weather(lat: float, lon: float, start_date: str, end_date: str):
    """
    Fetches weather data for a highly specific GPS coordinate.
    """
    print(f"Fetching live weather for coordinates: {lat}, {lon}...")

    # Notice how we skip the Geocoding API and inject lat/lon directly!
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
    if forecast_rain_mm > 50:
        return f"Warning: Heavy rain ({forecast_rain_mm}mm) expected over the next 7 days. Ensure your {crop} fields have proper drainage trenches to prevent waterlogging and root rot."
    elif forecast_rain_mm < 10:
        return f"Alert: Very dry week ahead (only {forecast_rain_mm}mm rain). Plan to heavily irrigate your {crop} fields early in the morning or late evening to prevent heat stress."
    else:
        return f"Good news: Moderate rainfall ({forecast_rain_mm}mm) expected. These are favorable growing conditions for {crop}. Proceed with routine weeding and fertilization."