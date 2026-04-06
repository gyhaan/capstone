from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from app.database import farm_collection, prediction_collection, farmer_collection
from datetime import datetime

# --- IMPORTANT: Update these imports to match the actual backend structure ---
from app.services.weather_fetcher import get_7_day_forecast, generate_crop_advisory
from app.security import verify_password
# from app.routes.predictions import run_farm_prediction

router = APIRouter()

# Mapping of Rwandan districts to their central GPS coordinates
RWANDA_DISTRICT_COORDS = {
    "gasabo": {"lat": -1.8841, "lon": 30.1306}, "kicukiro": {"lat": -1.9906, "lon": 30.1306},
    "nyarugenge": {"lat": -1.9846, "lon": 30.0331}, "bugesera": {"lat": -2.2033, "lon": 30.1556},
    "gatsibo": {"lat": -1.6030, "lon": 30.3168}, "kayonza": {"lat": -1.8606, "lon": 30.5186},
    "kirehe": {"lat": -2.2683, "lon": 30.6558}, "ngoma": {"lat": -2.1624, "lon": 30.4325},
    "nyagatare": {"lat": -1.2982, "lon": 30.3242}, "rwamagana": {"lat": -1.9487, "lon": 30.4347},
    "gisagara": {"lat": -2.6241, "lon": 29.8155}, "huye": {"lat": -2.5967, "lon": 29.7394},
    "kamonyi": {"lat": -2.0155, "lon": 29.8972}, "muhanga": {"lat": -2.0814, "lon": 29.7528},
    "nyamagabe": {"lat": -2.4673, "lon": 29.4795}, "nyanza": {"lat": -2.3512, "lon": 29.7505},
    "nyaruguru": {"lat": -2.7161, "lon": 29.5303}, "ruhango": {"lat": -2.2267, "lon": 29.7788},
    "karongi": {"lat": -2.1554, "lon": 29.3515}, "ngororero": {"lat": -1.8596, "lon": 29.5442},
    "nyabihu": {"lat": -1.6427, "lon": 29.4975}, "nyamasheke": {"lat": -2.3551, "lon": 29.1550},
    "rubavu": {"lat": -1.6750, "lon": 29.2744}, "rusizi": {"lat": -2.5594, "lon": 28.9419},
    "rutsiro": {"lat": -1.9167, "lon": 29.3167}, "burera": {"lat": -1.4398, "lon": 29.8459},
    "gakenke": {"lat": -1.6961, "lon": 29.7828}, "gicumbi": {"lat": -1.6030, "lon": 30.0619},
    "musanze": {"lat": -1.4998, "lon": 29.6349}, "rulindo": {"lat": -1.7457, "lon": 29.9880}
}

# --- TRANSLATION DICTIONARY ---
LANG = {
    "en": {
        "main_menu": "Welcome to AfriGuard\n1. Login\n2. SignUp\n3. Privacy Policy",
        "enter_pin": "Enter PIN:",
        "invalid_pin_try": "Invalid PIN. Please try again.",
        "invalid_pin_end": "Incorrect PIN. Session ended.",
        "enter_name": "Enter Full Name:",
        "enter_signup_pin": "Enter 4-digit PIN:",
        "account_exists": "Account exists. Dial again to Login.",
        "account_created": "Account created!\nEnter PIN to login:",
        "privacy": "Privacy:\nWe use GPS & phone for AI crop alerts only. Data is secure & not sold.\nFull terms on website.",
        "invalid_option": "Invalid option.",
        "dash_menu": "1. Add farm\n2. Check Farms",
        "enter_district": "Enter District:",
        "enter_crop": "Enter Crop (e.g. Maize):",
        "enter_size": "Enter Farm Size in Ha:",
        "enter_date": "Enter Planting Date (YYYY-MM-DD):",
        "farm_added": "Farm added!\nAction:\n1. AI Assessment\n2. 7-Day Weather",
        "ai_complete": "AI Assessment complete! Check main menu.",
        "rain": "Rain",
        "temp": "Temp",
        "adv": "Adv",
        "no_farms": "No farms registered.",
        "select_farm": "Select farm:\n",
        "farm_options": "Options:\n1. AI Health\n2. Weather",
        "invalid_selection": "Invalid selection.",
        "health": "Health",
        "yield": "Yield",
        "no_ai": "No AI assessments yet."
    },
    "rw": {
        "main_menu": "Ikaze kuri AfriGuard\n1. Injira\n2. Iyandikishe\n3. Amabwiriza y'Ibanga",
        "enter_pin": "Injiza umubare w'ibanga:",
        "invalid_pin_try": "Umubare w'ibanga si wo. Ongera.",
        "invalid_pin_end": "Umubare w'ibanga si wo. Ubusabe buhagaze.",
        "enter_name": "Injiza amazina yawe:",
        "enter_signup_pin": "Injiza umubare w'ibanga (imibare 4):",
        "account_exists": "Konti irahari. Ongera ukande *...# uhitemo 1.",
        "account_created": "Konti yafunguwe!\nInjiza PIN ngo winjire:",
        "privacy": "Ibanga:\nKonti yawe ikoreshwa gusa mu isuzuma rya AI. Amakuru ararinzwe.\nSoma byose kurubuga.",
        "invalid_option": "Amahitamo si yo.",
        "dash_menu": "1. Ongeraho ifamu\n2. Reba amafamu yawe",
        "enter_district": "Injiza Akarere:",
        "enter_crop": "Injiza Igihingwa (urugero: Maize):",
        "enter_size": "Injiza Ingano (Hegitari):",
        "enter_date": "Itariki y'itera (YYYY-MM-DD):",
        "farm_added": "Ifamu yongeweho!\nHitamo:\n1. Isuzuma AI\n2. Iteganyagihe",
        "ai_complete": "Isuzuma rirangiye! Reba ahabanza.",
        "rain": "Imvura",
        "temp": "Ubushyuhe",
        "adv": "Inama",
        "no_farms": "Nta mafamu wandikishije.",
        "select_farm": "Hitamo ifamu:\n",
        "farm_options": "Amahitamo:\n1. Reba uko imeze(AI)\n2. Iteganyagihe",
        "invalid_selection": "Amahitamo si yo.",
        "health": "Ubuzima",
        "yield": "Umusaruro",
        "no_ai": "Nta suzuma rirakorwa."
    }
}

@router.post("/api/ussd", response_class=PlainTextResponse)
async def ussd_callback(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...), 
    text: str = Form("")
):
    text_array = text.split("*") if text else []
    
    # --- 0. LANGUAGE SELECTION ---
    if text == "":
        return "CON Choose Language / Hitamo Ururimi:\n1. English\n2. Kinyarwanda"
        
    lang_code = "en" if text_array[0] == "1" else ("rw" if text_array[0] == "2" else None)
    
    if not lang_code:
        return "END Invalid language selection / Ururimi rusabwe ntiruhari."

    t = LANG[lang_code] # Load the correct dictionary based on choice
    
    # If they only picked a language, show the main menu in that language
    if len(text_array) == 1:
        return f"CON {t['main_menu']}"
        
    # --- Action selection is now shifted to index 1 ---
    action = text_array[1]
    is_login = action == "1"
    is_signup = action == "2"
    is_privacy = action == "3"
    
    logged_in_index = -1
    farmer = None

    # --- 1. LOGIN FLOW ---
    if is_login:
        if len(text_array) == 2:
            return f"CON {t['enter_pin']}"
        
        elif len(text_array) >= 3:
            user_input_pin = text_array[2]
            
            # 1. Fetch the farmer ONLY by their phone number
            farmer = await farmer_collection.find_one({"phone_number": phoneNumber})
            
            # 2. Check if farmer exists, then securely verify the bcrypt hash!
            # We use .get("pin_hash", "") as a safe fallback just in case
            if not farmer or not verify_password(user_input_pin, farmer.get("pin_hash", "")):
                return f"END {t['invalid_pin_try']}"
                
            # 3. Success! Move them forward in the menu
            logged_in_index = 3

    # --- 2. SIGNUP FLOW ---
    elif is_signup:
        if len(text_array) == 2:
            return f"CON {t['enter_name']}"
        elif len(text_array) == 3:
            return f"CON {t['enter_signup_pin']}"
        elif len(text_array) == 4:
            name = text_array[2]
            pin = text_array[3]
            
            existing = await farmer_collection.find_one({"phone_number": phoneNumber})
            if existing:
                return f"END {t['account_exists']}"
                
            await farmer_collection.insert_one({
                "full_name": name,
                "phone_number": phoneNumber,
                "pin": pin,
                "created_at": datetime.utcnow()
            })
            return f"CON {t['account_created']}"
            
        elif len(text_array) >= 5:
            pin_attempt = text_array[4]
            farmer = await farmer_collection.find_one({"phone_number": phoneNumber, "pin": pin_attempt})
            if not farmer:
                return f"END {t['invalid_pin_end']}"
            logged_in_index = 5

    # --- 3. PRIVACY POLICY FLOW ---
    elif is_privacy:
        return f"END {t['privacy']}"

    else:
        return f"END {t['invalid_option']}"

    # --- LOGGED IN MENU (DASHBOARD) ---
    if farmer and logged_in_index != -1:
        if len(text_array) == logged_in_index:
            return f"CON {t['dash_menu']}"
            
        menu_choice = text_array[logged_in_index]
        step = len(text_array) - logged_in_index
        
        # --- A. ADD FARM FLOW ---
        if menu_choice == "1":
            if step == 1:
                return f"CON {t['enter_district']}"
            elif step == 2:
                return f"CON {t['enter_crop']}"
            elif step == 3:
                return f"CON {t['enter_size']}"
            elif step == 4:
                return f"CON {t['enter_date']}"
            elif step == 5:
                district = text_array[logged_in_index + 1]
                crop = text_array[logged_in_index + 2]
                size = text_array[logged_in_index + 3]
                date = text_array[logged_in_index + 4]
                
                clean_district = district.strip().lower()
                coords = RWANDA_DISTRICT_COORDS.get(clean_district, {"lat": -1.9441, "lon": 30.0619})
                
                await farm_collection.insert_one({
                    "farmer_id": str(farmer["_id"]),
                    "district": district.strip().title(), 
                    "crop": crop.strip().title(),
                    "farm_size_ha": float(size),
                    "planting_date": date,
                    "latitude": coords["lat"], 
                    "longitude": coords["lon"],
                    "created_at": datetime.utcnow()
                })
                return f"CON {t['farm_added']}"
            
            elif step == 6:
                latest_farm = await farm_collection.find_one(
                    {"farmer_id": str(farmer["_id"])}, sort=[("created_at", -1)]
                )
                action = text_array[logged_in_index + 5]
                
                if action == "1":
                    farm_id = str(latest_farm["_id"])
                    # await run_farm_prediction(farm_id) 
                    return f"END {t['ai_complete']}"
                    
                elif action == "2":
                    lat, lon = latest_farm.get("latitude", -1.9441), latest_farm.get("longitude", 30.0619)
                    forecast = get_7_day_forecast(lat, lon)
                    advisory = generate_crop_advisory(latest_farm["crop"], forecast["forecast_rain_mm"])
                    
                    return f"END {t['rain']}: {forecast['forecast_rain_mm']}mm.\n{t['temp']}: {forecast['forecast_temp_c']}C.\n{t['adv']}: {advisory[:50]}..."
                
        # --- B. CHECK FARMS FLOW ---
        elif menu_choice == "2":
            cursor = farm_collection.find({"farmer_id": str(farmer["_id"])})
            farms = await cursor.to_list(length=10)
            
            if step == 1:
                if not farms:
                    return f"END {t['no_farms']}"
                menu = f"CON {t['select_farm']}"
                for i, f in enumerate(farms):
                    menu += f"{i+1}. {f['crop']} ({f['district']})\n"
                return menu
                
            elif step == 2:
                try:
                    choice = int(text_array[logged_in_index + 1]) - 1
                    selected_farm = farms[choice]
                    return f"CON {selected_farm['crop']} {t['farm_options']}"
                except (ValueError, IndexError):
                    return f"END {t['invalid_selection']}"
                    
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
                            return f"END {t['health']}: {pred['health_status']}\n{t['yield']}: {pred['total_estimated_harvest_kg']}kg\n{t['rain']}: {pred.get('forecast_rain_mm', 0)}mm"
                        else:
                            return f"END {t['no_ai']}"
                            
                    elif action == "2":
                        lat, lon = selected_farm.get("latitude", -1.9441), selected_farm.get("longitude", 30.0619)
                        forecast = get_7_day_forecast(lat, lon)
                        advisory = generate_crop_advisory(selected_farm["crop"], forecast["forecast_rain_mm"])
                        
                        return f"END {t['rain']}: {forecast['forecast_rain_mm']}mm.\n{t['temp']}: {forecast['forecast_temp_c']}C.\n{t['adv']}: {advisory[:50]}..."
                        
                except (ValueError, IndexError):
                    return f"END {t['invalid_selection']}"

    return f"END {t['invalid_option']}"