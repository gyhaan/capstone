import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId

from app.main import app 

client = TestClient(app)

@patch("app.routes.predictions.prediction_collection")
@patch("app.routes.predictions.farm_collection")
@patch("app.routes.predictions.get_live_weather")
@patch("app.routes.predictions.get_live_ndvi")
@patch("app.routes.predictions.get_7_day_forecast")
@patch("app.routes.predictions.generate_crop_advisory")
@patch.dict("app.routes.predictions.ml_components", {"model": MagicMock()})
def test_generate_prediction(
    mock_advisory, 
    mock_forecast, 
    mock_ndvi, 
    mock_weather, 
    mock_farm_collection, 
    mock_prediction_collection
):
    mock_farm_collection.find_one = AsyncMock(return_value={
        "_id": ObjectId("507f191e810c19729de860ea"),
        "district": "Gasabo",
        "crop": "Maize",
        "farmer_id": "507f1f77bcf86cd799439011",
        "latitude": -1.8841,
        "longitude": 30.1306,
        "farm_size_ha": 2.0
    })
    
    mock_weather.return_value = {"Total_Rainfall_mm": 120.5, "Average_Temp_C": 24.5}
    mock_ndvi.return_value = 0.65
    mock_forecast.return_value = {"forecast_rain_mm": 15.0, "forecast_temp_c": 25.0}
    mock_advisory.return_value = "Conditions are optimal."
    
    from app.routes.predictions import ml_components
    ml_components["model"].predict.return_value = [1800.0]
    
    mock_insert = AsyncMock()
    mock_insert.inserted_id = ObjectId("607f191e810c19729de860ea")
    mock_prediction_collection.insert_one = mock_insert
    
    payload = {"farm_id": "507f191e810c19729de860ea"}
    response = client.post("/api/predict", json=payload)
    
    assert response.status_code == 200
    assert response.json()["health_status"] in ["Green", "Yellow", "Red"]
    assert response.json()["predicted_yield_kg_ha"] == 1800.0

@patch("app.routes.predictions.prediction_collection")
def test_get_farm_predictions(mock_prediction_collection):
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[
        {
            "_id": ObjectId("607f191e810c19729de860ea"),
            "farm_id": "507f191e810c19729de860ea",
            "health_status": "Green",
            "predicted_yield_kg_ha": 1800.0
        }
    ])
    mock_prediction_collection.find.return_value = mock_cursor
    
    response = client.get("/api/predictions/farm/507f191e810c19729de860ea")
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["health_status"] == "Green"
    
@patch("app.routes.predictions.farm_collection")
@patch("app.routes.predictions.get_7_day_forecast")
@patch("app.routes.predictions.generate_crop_advisory")
def test_get_farm_advisory(mock_advisory, mock_forecast, mock_farm_collection):
    mock_farm_collection.find_one = AsyncMock(return_value={
        "_id": ObjectId("507f191e810c19729de860ea"),
        "district": "Gasabo",
        "crop": "Maize",
        "latitude": -1.8841,
        "longitude": 30.1306
    })
    
    mock_forecast.return_value = {"forecast_rain_mm": 12.0, "forecast_temp_c": 26.0}
    mock_advisory.return_value = "Irrigate lightly."
    
    response = client.get("/api/farms/507f191e810c19729de860ea/advisory")
    
    assert response.status_code == 200
    assert response.json()["forecast_rain_mm"] == 12.0
    assert response.json()["crop_advisory"] == "Irrigate lightly."