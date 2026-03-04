import os
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import the shared state and the scheduler
from app.state import ml_components
from app.scheduler.cron_tasks import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: Load the Model ---
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "ml_models", "crop_yield_model.pkl")
    
    print("Booting up server...")
    print(f"Loading Machine Learning Model from {model_path}...")
    
    try:
        # Load the model into the shared state dictionary
        ml_components["model"] = joblib.load(model_path)
        print("SUCCESS: AI Model successfully loaded into memory! Ready for predictions.")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not load the ML model. Error: {e}")
    
    # --- Startup: Start the Background Scheduler ---
    scheduler.start()
    print("SUCCESS: Background Automation Scheduler is running!")
    
    yield # Server is active
    
    # --- Shutdown: Clean up ---
    scheduler.shutdown()
    ml_components.clear()
    print("Server shutting down. Memory cleared and scheduler stopped.")

# Initialize the API
app = FastAPI(title="Rwanda Crop Monitoring API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IMPORTANT: We import routes AFTER defining lifespan to ensure 
# the state is available when the routes are registered.
from app.routes import predictions, farmers, ussd

app.include_router(predictions.router)
app.include_router(farmers.router)
app.include_router(ussd.router)

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "message": "Welcome to the Crop Monitoring API! The backend is running perfectly."
    }