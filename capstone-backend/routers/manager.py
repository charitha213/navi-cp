from fastapi import APIRouter
from schemas.response_schemas import FlaggedDrugsResponse
from services.utils import get_flagged_drugs, suppress_drug

router = APIRouter()

@router.get("/flagged", response_model=FlaggedDrugsResponse)
def get_flagged():
    return FlaggedDrugsResponse(drugs=get_flagged_drugs())

@router.post("/suppress")
def suppress_drug_by_manager(drugname: str):
    suppress_drug(drugname)
    return {"message": f"{drugname} suppressed successfully"}
