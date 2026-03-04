from pydantic import BaseModel, Field, GetCoreSchemaHandler, ConfigDict
from pydantic_core import core_schema
from typing import Any
from datetime import datetime
from bson import ObjectId

# 1. New V2-Compatible PyObjectId
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x), return_schema=core_schema.str_schema()
            ),
        )

    @classmethod
    def validate(cls, v) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

# 2. Updated Farmer Model
class FarmerModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    full_name: str
    phone_number: str
    pin: str = Field(..., min_length=4, max_length=4) # Forces a 4-digit PIN
    registered_at: datetime = Field(default_factory=datetime.utcnow)

# 3. Updated Farm Model
class FarmModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    farmer_id: str
    district: str
    crop: str
    planting_date: datetime
    latitude: float
    longitude: float
    farm_size_ha: float

# 4. Updated Prediction Model
class PredictionModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    farm_id: str
    farmer_id: str
    season: str
    total_rainfall_mm: float
    average_temp_c: float
    mean_ndvi: float
    ndvi_start_date: str
    predicted_yield_kg_ha: float
    total_estimated_harvest_kg: float
    baseline_yield_kg_ha: float
    health_status: str
    forecast_rain_mm: float
    forecast_temp_c: float
    crop_advisory: str
    created_at: datetime = Field(default_factory=datetime.utcnow)