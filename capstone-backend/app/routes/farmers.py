from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

from app.database import farmer_collection, farm_collection, prediction_collection
from app.models import FarmerModel, FarmModel

# Create the router to handle these URLs
router = APIRouter()

# Simple request schemas so the API knows exactly what data to expect
class CreateFarmerRequest(BaseModel):
    full_name: str
    phone_number: str
    pin: str

# Add these new fields to your CreateFarmRequest
class CreateFarmRequest(BaseModel):
    farmer_id: str
    district: str
    crop: str
    planting_date: datetime
    latitude: float      
    longitude: float 
    farm_size_ha: float  

class LoginRequest(BaseModel):
    phone_number: str
    pin: str

@router.get("/api/farms/{farmer_id}")
async def get_farmer_farms(farmer_id: str):
    cursor = farm_collection.find({"farmer_id": farmer_id})
    farms = await cursor.to_list(length=50)
    for farm in farms:
        farm["_id"] = str(farm["_id"])
    return farms

@router.post("/api/farmers", response_model=FarmerModel)
async def register_farmer(request: CreateFarmerRequest):
    # Check if the farmer already exists
    existing = await farmer_collection.find_one({"phone_number": request.phone_number})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    new_farmer = FarmerModel(
        full_name=request.full_name,
        phone_number=request.phone_number,
        pin=request.pin # Map it here
    )
    
    farmer_dict = new_farmer.model_dump(by_alias=True, exclude={"id"})
    result = await farmer_collection.insert_one(farmer_dict)
    
    new_farmer.id = result.inserted_id
    return new_farmer

@router.post("/api/farms", response_model=FarmModel)
async def register_farm(request: CreateFarmRequest):
    """
    Links a specific district, crop, and GPS location to a farmer's profile.
    """
    new_farm = FarmModel(
        farmer_id=request.farmer_id,
        district=request.district,
        crop=request.crop,
        planting_date=request.planting_date,
        latitude=request.latitude,
        longitude=request.longitude,
        farm_size_ha=request.farm_size_ha
    )
    
    farm_dict = new_farm.model_dump(by_alias=True, exclude={"id"})
    result = await farm_collection.insert_one(farm_dict)
    
    new_farm.id = result.inserted_id
    
    print(f"Success! Farm registered in {new_farm.district} at GPS: {new_farm.latitude}, {new_farm.longitude}.")
    return new_farm

@router.get("/api/farms/single/{farm_id}")
async def get_single_farm(farm_id: str):
    farm = await farm_collection.find_one({"_id": ObjectId(farm_id)})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    farm["_id"] = str(farm["_id"])
    return farm
    

@router.post("/api/login")
async def login_farmer(request: LoginRequest):
    """
    Verifies the farmer's credentials. This will be used by both 
    the React Dashboard and the USSD menu.
    """
    # 1. Look up the farmer by phone number
    farmer = await farmer_collection.find_one({"phone_number": request.phone_number})
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Phone number not found.")
    
    # 2. Check if the PIN matches
    if farmer["pin"] != request.pin:
        raise HTTPException(status_code=401, detail="Incorrect PIN. Please try again.")
    
    # 3. If successful, return the farmer info (but hide the PIN in the response)
    return {
        "message": "Login successful",
        "farmer_id": str(farmer["_id"]),
        "full_name": farmer["full_name"]
    }

@router.get("/api/map-data")
async def get_map_data():
    """Fetches all farms and their most recent AI health status for the GIS Map."""
    farms_cursor = farm_collection.find({})
    farms = await farms_cursor.to_list(length=1000)
    
    map_markers = []
    for farm in farms:
        # 1. SKIP this farm entirely if it doesn't have real GPS coordinates saved
        if "latitude" not in farm or "longitude" not in farm:
            continue 
            
        # 2. Get the most recent prediction for this specific farm
        latest_pred = await prediction_collection.find_one(
            {"farm_id": str(farm["_id"])},
            sort=[("created_at", -1)] # Sort by newest first
        )
        
        # 3. Default to Gray/Unknown if no prediction exists yet
        health = latest_pred["health_status"] if latest_pred else "Unknown"
        
        # 4. Append exact data with no hardcoded fallbacks
        map_markers.append({
            "farm_id": str(farm["_id"]),
            "district": farm.get("district", "Unknown"),
            "crop": farm.get("crop", "Unknown"),
            "lat": farm["latitude"], 
            "lng": farm["longitude"],
            "health_status": health
        })
        
    return map_markers