from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from app.database import farm_collection, prediction_collection, farmer_collection
from datetime import datetime

# --- IMPORTANT: Update these imports to match your actual backend structure ---
from app.services.weather_fetcher import get_7_day_forecast, generate_crop_advisory
# from app.routes.predictions import run_farm_prediction

router = APIRouter()

@router.post("/api/ussd", response_class=PlainTextResponse)
async def ussd_callback(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...), 
    text: str = Form("")
):
    text_array = text.split("*") if text else []
    
    # --- ROOT MENU ---
    if text == "":
        return "CON Welcome to AfriGuard\n1. Login (Injira)\n2. SignUp (Iyandikishe)"
        
    is_login = text_array[0] == "1"
    is_signup = text_array[0] == "2"
    
    logged_in_index = -1
    farmer = None

    # --- 1. LOGIN FLOW ---
    if is_login:
        if len(text_array) == 1:
            return "CON Enter PIN (Injiza umubare w'ibanga):"
        elif len(text_array) >= 2:
            pin = text_array[1]
            farmer = await farmer_collection.find_one({"phone_number": phoneNumber, "pin": pin})
            if not farmer:
                return "END Invalid PIN (Umubare w'ibanga si wo). Please try again."
            logged_in_index = 2

    # --- 2. SIGNUP FLOW ---
    elif is_signup:
        if len(text_array) == 1:
            return "CON Enter Full Name (Injiza amazina yawe):"
        elif len(text_array) == 2:
            return "CON Enter 4-digit PIN (Injiza umubare w'ibanga w'imibare 4):"
        elif len(text_array) == 3:
            name = text_array[1]
            pin = text_array[2]
            
            existing = await farmer_collection.find_one({"phone_number": phoneNumber})
            if existing:
                return "END Account already exists (Konti isanzwe ihari). Dial again and choose 1 to Login."
                
            await farmer_collection.insert_one({
                "full_name": name,
                "phone_number": phoneNumber,
                "pin": pin,
                "created_at": datetime.utcnow()
            })
            return "CON Account created (Konti yafunguwe)!\nEnter PIN to login (Injiza PIN ngo winjire):"
            
        elif len(text_array) >= 4:
            pin_attempt = text_array[3]
            farmer = await farmer_collection.find_one({"phone_number": phoneNumber, "pin": pin_attempt})
            if not farmer:
                return "END Incorrect PIN (Umubare si wo). Session ended."
            logged_in_index = 4

    else:
        return "END Invalid option (Amahitamo si yo)."

    # --- LOGGED IN MENU (DASHBOARD) ---
    if farmer and logged_in_index != -1:
        if len(text_array) == logged_in_index:
            return "CON 1. Add farm (Ongeraho ifamu)\n2. Check Farms (Reba amafamu yawe)"
            
        menu_choice = text_array[logged_in_index]
        step = len(text_array) - logged_in_index
        
        # --- A. ADD FARM FLOW ---
        if menu_choice == "1":
            if step == 1:
                return "CON Enter District (Injiza Akarere):"
            elif step == 2:
                return "CON Enter Crop (Injiza Igihingwa - urugero: Maize):"
            elif step == 3:
                return "CON Enter Farm Size in Ha (Injiza Ingano muri Hegitari):"
            elif step == 4:
                return "CON Enter Planting Date (Injiza Itariki y'itera YYYY-MM-DD):"
            elif step == 5:
                district = text_array[logged_in_index + 1]
                crop = text_array[logged_in_index + 2]
                size = text_array[logged_in_index + 3]
                date = text_array[logged_in_index + 4]
                
                await farm_collection.insert_one({
                    "farmer_id": str(farmer["_id"]),
                    "district": district,
                    "crop": crop,
                    "farm_size_ha": float(size),
                    "planting_date": date,
                    "latitude": -1.9441, 
                    "longitude": 30.0619,
                    "created_at": datetime.utcnow()
                })
                return f"CON Farm added (Ifamu yongeweho)!\nAction (Hitamo):\n1. AI Assessment (Isuzuma AI)\n2. 7-Day Weather (Iteganyagihe)"
            
            elif step == 6:
                latest_farm = await farm_collection.find_one(
                    {"farmer_id": str(farmer["_id"])}, sort=[("created_at", -1)]
                )
                action = text_array[logged_in_index + 5]
                
                if action == "1":
                    farm_id = str(latest_farm["_id"])
                    
                    # await run_farm_prediction(farm_id) 
                    
                    return "END AI Assessment complete (Isuzuma rirangiye)! Check main menu."
                    
                elif action == "2":
                    lat, lon = latest_farm.get("latitude", -1.9441), latest_farm.get("longitude", 30.0619)
                    forecast = get_7_day_forecast(lat, lon)
                    advisory = generate_crop_advisory(latest_farm["crop"], forecast["forecast_rain_mm"])
                    
                    return f"END Rain(Imvura): {forecast['forecast_rain_mm']}mm.\nTemp(Ubushyuhe): {forecast['forecast_temp_c']}C.\nAdv(Inama): {advisory[:50]}..."
                
        # --- B. CHECK FARMS FLOW ---
        elif menu_choice == "2":
            cursor = farm_collection.find({"farmer_id": str(farmer["_id"])})
            farms = await cursor.to_list(length=10)
            
            if step == 1:
                if not farms:
                    return "END No farms registered (Nta mafamu wandikishije)."
                menu = "CON Select farm (Hitamo ifamu):\n"
                for i, f in enumerate(farms):
                    menu += f"{i+1}. {f['crop']} ({f['district']})\n"
                return menu
                
            elif step == 2:
                try:
                    choice = int(text_array[logged_in_index + 1]) - 1
                    selected_farm = farms[choice]
                    return f"CON {selected_farm['crop']} Options (Amahitamo):\n1. AI Health (Reba uko imeze)\n2. Weather (Iteganyagihe)"
                except (ValueError, IndexError):
                    return "END Invalid selection (Amahitamo si yo)."
                    
            elif step == 3:
                try:
                    choice = int(text_array[logged_in_index + 1]) - 1
                    selected_farm = farms[choice]
                    farm_id = str(selected_farm["_id"])
                    action = text_array[logged_in_index + 2]
                    
                    if action == "1":
                        pred = await prediction_collection.find_one(
                            {"farm_id": farm_id}, sort=[("created_at", -1)]
                        )
                        if pred:
                            return f"END Health(Ubuzima): {pred['health_status']}\nYield(Umusaruro): {pred['total_estimated_harvest_kg']}kg\nRain(Imvura): {pred.get('forecast_rain_mm', 0)}mm"
                        else:
                            return "END No AI assessments yet (Nta suzuma rirakorwa)."
                            
                    elif action == "2":
                        lat, lon = selected_farm.get("latitude", -1.9441), selected_farm.get("longitude", 30.0619)
                        forecast = get_7_day_forecast(lat, lon)
                        advisory = generate_crop_advisory(selected_farm["crop"], forecast["forecast_rain_mm"])
                        
                        return f"END Rain(Imvura): {forecast['forecast_rain_mm']}mm.\nTemp(Ubushyuhe): {forecast['forecast_temp_c']}C.\nAdv(Inama): {advisory[:50]}..."
                        
                except (ValueError, IndexError):
                    return "END Invalid selection (Amahitamo si yo)."

    return "END Invalid input (Ibyo winjije si byo)."