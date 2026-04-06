# app/routes/farmers.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional
import re

from app.database import farmer_collection, farm_collection, prediction_collection
from app.models import FarmerModel, FarmModel

# --- NEW: Import our security tools ---
from app.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# --- UPDATED SCHEMAS ---
class CreateFarmerRequest(BaseModel):
    full_name: str
    phone_number: str
    pin: str
    password: Optional[str] = None 

    # ---> NEW: Enterprise Password Enforcement <---
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        # If they are signing up via USSD, password is None, so we pass
        if v is None:
            return v
            
        # 1. Enforce Length
        if len(v) < 8:
            raise ValueError("Web password must be at least 8 characters long.")
            
        # 2. Enforce Complexity (At least one uppercase and one number)
        if not re.search(r"[A-Z]", v):
            raise ValueError("Web password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Web password must contain at least one number.")
            
        return v

class LoginRequest(BaseModel):
    phone_number: str
    password: str 

class CreateFarmRequest(BaseModel):
    farmer_id: str
    district: str
    crop: str
    planting_date: datetime
    latitude: float      
    longitude: float 
    farm_size_ha: float  

# --------------------------------

@router.post("/api/farmers", response_model=FarmerModel)
async def register_farmer(request: CreateFarmerRequest):
    """Registers a new farmer with fully hashed credentials."""
    
    # 1. Check if the farmer already exists
    existing = await farmer_collection.find_one({"phone_number": request.phone_number})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # 2. Hash the Web Password (if provided)
    hashed_pwd = None
    if request.password:
        hashed_pwd = get_password_hash(request.password)
        
    # 3. HASH THE USSD PIN!
    hashed_pin = get_password_hash(request.pin)

    # 4. Create the model with the secure hashes
    new_farmer = FarmerModel(
        full_name=request.full_name,
        phone_number=request.phone_number,
        pin_hash=hashed_pin,       # <-- Save the encrypted PIN
        password_hash=hashed_pwd   # <-- Save the encrypted Password
    )
    
    farmer_dict = new_farmer.model_dump(by_alias=True, exclude={"id"})
    result = await farmer_collection.insert_one(farmer_dict)
    
    new_farmer.id = result.inserted_id
    return new_farmer

@router.post("/api/login")
async def login_farmer(request: LoginRequest):
    """
    Web Portal Login: Authenticates using Phone Number and Password.
    Returns a secure JWT token for subsequent requests.
    """
    # 1. Look up the farmer
    farmer = await farmer_collection.find_one({"phone_number": request.phone_number})
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Phone number not found.")
    
    # 2. Check if they have a web password set up
    if not farmer.get("password_hash"):
        raise HTTPException(
            status_code=403, 
            detail="Account created via USSD. Please set a web password to access the dashboard."
        )

    # 3. Verify the password using bcrypt math
    if not verify_password(request.password, farmer["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    
    # 4. Generate the JWT Access Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(farmer["_id"]), "phone": farmer["phone_number"]}, # The "subject" of the token
        expires_delta=access_token_expires
    )

    # 5. Return the Token and User Info to React
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "farmer_id": str(farmer["_id"]),
        "full_name": farmer["full_name"]
    }

# --- UNCHANGED ROUTES ---
@router.get("/api/farms/{farmer_id}")
async def get_farmer_farms(farmer_id: str):
    cursor = farm_collection.find({"farmer_id": farmer_id})
    farms = await cursor.to_list(length=50)
    for farm in farms:
        farm["_id"] = str(farm["_id"])
    return farms

@router.post("/api/farms", response_model=FarmModel)
async def register_farm(request: CreateFarmRequest):
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
    return new_farm

@router.get("/api/farms/single/{farm_id}")
async def get_single_farm(farm_id: str):
    farm = await farm_collection.find_one({"_id": ObjectId(farm_id)})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    farm["_id"] = str(farm["_id"])
    return farm

@router.get("/api/map-data")
async def get_map_data():
    farms_cursor = farm_collection.find({})
    farms = await farms_cursor.to_list(length=1000)
    
    map_markers = []
    for farm in farms:
        if "latitude" not in farm or "longitude" not in farm:
            continue 
            
        latest_pred = await prediction_collection.find_one(
            {"farm_id": str(farm["_id"])},
            sort=[("created_at", -1)] 
        )
        
        if latest_pred:
            health = latest_pred.get("health_status", "Unknown")
            predicted_yield = latest_pred.get("predicted_yield_kg_ha", 0)
            mean_ndvi = latest_pred.get("mean_ndvi", 0)
        else:
            health = "Unknown"
            predicted_yield = 0
            mean_ndvi = 0
            
        map_markers.append({
            "farm_id": str(farm["_id"]),
            "district": farm.get("district", "Unknown"),
            "crop": farm.get("crop", "Unknown"),
            "lat": farm["latitude"], 
            "lng": farm["longitude"],
            "health_status": health,
            "predicted_yield_kg_ha": predicted_yield,
            "mean_ndvi": round(mean_ndvi, 2) if isinstance(mean_ndvi, float) else mean_ndvi
        })
        
    return map_markers