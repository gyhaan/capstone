import ee
from datetime import datetime, timedelta

def get_live_ndvi(lat: float, lon: float, start_date: str, end_date: str) -> float:
    """
    Fetches the mean NDVI (greenness) for a specific GPS coordinate
    using a safe 30-day window ending on the provided end_date.
    """
    print(f"Fetching live satellite NDVI for coordinates: {lat}, {lon}...")
    
    # --- SAFE DATE CALCULATION ---
    # Convert string to datetime
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Force the start_date to be exactly 30 days before the end_date.
    # This guarantees the MODIS satellite (which passes every 16 days)
    # has at least 1 or 2 clean images to average together.
    safe_start_dt = end_dt - timedelta(days=30)
    safe_start_date = safe_start_dt.strftime("%Y-%m-%d")
    
    print(f"NDVI Date Window: {safe_start_date} to {end_date}")

    # 1. Initialize Google Earth Engine
    try:
        ee.Initialize(project='capstone-484914')
    except Exception as e:
        print("Earth Engine not initialized. Attempting to authenticate...")
        ee.Authenticate()
        ee.Initialize(project='capstone-484914')

    # 2. Create Geometry
    farm_point = ee.Geometry.Point([lon, lat])

    # 3. Fetch MODIS Collection using our new safe date range
    modis = ee.ImageCollection('MODIS/061/MOD13Q1').select('NDVI')
    ndvi_col = modis.filterDate(safe_start_date, end_date)
    mean_ndvi_img = ndvi_col.mean()

    # 4. Calculate
    try:
        val = mean_ndvi_img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=farm_point,
            scale=250,
            maxPixels=1e9 
        ).getInfo()
        
        if val and val.get('NDVI') is not None:
            final_ndvi = val['NDVI'] * 0.0001
        else:
            final_ndvi = 0.0
            
    except Exception as e:
        print(f"Error calculating NDVI for coordinates {lat}, {lon}: {e}")
        final_ndvi = 0.0

    print(f"Result -> Mean NDVI: {final_ndvi:.4f}")
    return round(final_ndvi, 4)