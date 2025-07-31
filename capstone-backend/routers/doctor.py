from fastapi import APIRouter, Depends, HTTPException
from schemas.request_schemas import DrugInput, DrugRequest, DrugSearchRequest
from services.prediction_service import predict_risk_level, recommend_alternatives, df_clean
from auth.auth import get_current_user, get_current_user_role
from database.db import get_db
from sqlalchemy.orm import Session
from database.models import User, Patient
from datetime import datetime, timedelta
import pytz
from pydantic import BaseModel  # Import Pydantic BaseModel

router = APIRouter(prefix="/doctor", tags=["Doctor"])

# Define a Pydantic model for the request body
class MarkHandledRequest(BaseModel):
    patient_username: str

@router.post("/alternatives")
def get_alternatives(request: DrugRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    role = get_current_user_role(current_user)
    if role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")

    result = recommend_alternatives(request.drugname, df_clean)
    return result

@router.post("/search")
def search_drugs(request: DrugSearchRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    role = get_current_user_role(current_user)
    if role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")

    query = request.query.lower()
    if not query:
        return []

    matched = df_clean[df_clean['drugname'].str.lower().str.contains(query)]

    results = (
        matched[['drugname', 'risk_level']]
        .drop_duplicates('drugname')
        .head(15)
        .to_dict(orient='records')
    )

    return results

@router.get("/appointments")
async def get_doctor_appointments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = get_current_user_role(current_user)
    if role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    ist = pytz.timezone('Asia/Kolkata')
    today = datetime.now(ist).date()
    current_doctor_id = current_user.id
    appointments = db.query(Patient).join(User, Patient.doctor_id == User.id, isouter=True).filter(
        Patient.doctor_id == current_doctor_id,
        Patient.appointment_date >= today,
        Patient.appointment_date < today + timedelta(days=7)  # Extended to 7 days for future appointments
    ).all()
    return [
        {
            "username": user.username,
            "appointment_date": p.appointment_date.astimezone(ist).isoformat(),
            "is_handled": p.is_handled  # Include is_handled in the response
        } for p, user in [(p, p.user) for p in appointments]
    ]

@router.post("/mark-handled")
async def mark_appointment_handled(request: MarkHandledRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = get_current_user_role(current_user)
    if role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    patient = db.query(Patient).join(User, Patient.user_id == User.id).filter(User.username == request.patient_username, User.role == "patient").first()
    if not patient or patient.doctor_id != current_user.id:
        raise HTTPException(status_code=400, detail="Patient not found or not assigned to this doctor")
    patient.is_handled = True
    db.commit()
    return {"message": f"Appointment for {request.patient_username} marked as handled"}