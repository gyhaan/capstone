import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from bson import ObjectId

# Adjust this import to point to your main FastAPI app instance
from app.main import app 

client = TestClient(app)

@patch("app.routes.farmers.farmer_collection")
def test_register_farmer(mock_farmer_collection):
    mock_farmer_collection.find_one = AsyncMock(return_value=None)
    mock_insert = AsyncMock()
    mock_insert.inserted_id = ObjectId("507f1f77bcf86cd799439011")
    mock_farmer_collection.insert_one = mock_insert
    
    payload = {
        "full_name": "John Doe",
        "phone_number": "+250780000000",
        "pin": "1234"
    }
    
    response = client.post("/api/farmers", json=payload)
    
    assert response.status_code == 200
    assert response.json()["full_name"] == "John Doe"

@patch("app.routes.farmers.farmer_collection")
def test_login_farmer_success(mock_farmer_collection):
    mock_farmer_collection.find_one = AsyncMock(return_value={
        "_id": ObjectId("507f1f77bcf86cd799439011"),
        "full_name": "John Doe",
        "phone_number": "+250780000000",
        "pin": "1234"
    })
    
    payload = {
        "phone_number": "+250780000000",
        "pin": "1234"
    }
    
    response = client.post("/api/login", json=payload)
    
    assert response.status_code == 200
    assert response.json()["message"] == "Login successful"
    assert response.json()["full_name"] == "John Doe"

@patch("app.routes.farmers.farm_collection")
def test_register_farm(mock_farm_collection):
    mock_insert = AsyncMock()
    mock_insert.inserted_id = ObjectId("507f191e810c19729de860ea")
    mock_farm_collection.insert_one = mock_insert
    
    payload = {
        "farmer_id": "507f1f77bcf86cd799439011",
        "district": "Gasabo",
        "crop": "Maize",
        "planting_date": "2026-03-01T00:00:00",
        "latitude": -1.8841,
        "longitude": 30.1306,
        "farm_size_ha": 2.5
    }
    
    response = client.post("/api/farms", json=payload)
    
    assert response.status_code == 200
    assert response.json()["district"] == "Gasabo"

@patch("app.routes.farmers.farm_collection")
@patch("app.routes.farmers.prediction_collection")
def test_get_map_data(mock_prediction_collection, mock_farm_collection):
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId("507f191e810c19729de860ea"),
            "farmer_id": "507f1f77bcf86cd799439011",
            "district": "Gasabo",
            "crop": "Maize",
            "latitude": -1.8841,
            "longitude": 30.1306
        }
    ])
    mock_farm_collection.find.return_value = mock_cursor
    
    mock_prediction_collection.find_one = AsyncMock(return_value={
        "health_status": "Green",
        "predicted_yield_kg_ha": 1500.0,
        "mean_ndvi": 0.65
    })
    
    response = client.get("/api/map-data")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["health_status"] == "Green"
    assert data[0]["predicted_yield_kg_ha"] == 1500.0