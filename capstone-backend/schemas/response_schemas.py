from pydantic import BaseModel
from typing import List

# For doctor view
class RiskPredictionResponse(BaseModel):
    risk_level: str
    alternatives: List[str]

# For admin single prediction response
class AdminSinglePredictionResponse(BaseModel):
    drugname: str
    risk_level: str
    message: str = "Drug added successfully"

# For bulk upload response
class BulkUploadResponse(BaseModel):
    added: int
    skipped: int
    message: str

class FlaggedDrugResponse(BaseModel):
    drugname: str
    risk_level: str
    suppressed: bool

    class Config:
        orm_mode = True
