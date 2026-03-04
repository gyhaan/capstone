import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 1. Load the secret variables from the .env file
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("No MONGODB_URL found in environment variables. Check your .env file!")

# 2. Initialize the MongoDB Client
print("Connecting to MongoDB...")
client = AsyncIOMotorClient(MONGODB_URL)

# 3. Create (or connect to) our specific database called 'crop_monitoring_db'
db = client.crop_monitoring_db

# 4. Define our exact collections so the rest of the app can easily import them
farmer_collection = db.get_collection("farmers")
farm_collection = db.get_collection("farms")
prediction_collection = db.get_collection("predictions")

print("Database connected successfully!")