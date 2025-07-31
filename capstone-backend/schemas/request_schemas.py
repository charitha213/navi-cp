from pydantic import BaseModel
from typing import List, Optional

class DrugInput(BaseModel):
    drugname: str
    dose_amt: float
    nda_num: Optional[float]
    route: str
    dose_unit: str
    dose_form: str
    dose_freq: str
    role_cod: str
    pt: str
    dechal: str
    rechal: str
    lot_num: Optional[str] = None

class FlaggedDrug(BaseModel):
    drugname: str
    risk_level: str

class DrugRequest(BaseModel):
    drugname: str

class DrugSearchRequest(BaseModel):
    query: str

# For Admin - Single drug input
class DrugInput(BaseModel):
    drugname: str
    prod_ai: str
    pt: Optional[str] = None
    outc_cod: Optional[str] = None

class FlagDrugRequest(BaseModel):
    drugname: str

# New model for deleting an operator
class DeleteOperatorRequest(BaseModel):
    username: str

class DeleteDoctorRequest(BaseModel):
    username: str