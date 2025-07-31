from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Nurse, User, Patient
from auth.auth import get_current_user
from datetime import datetime, timedelta
import pytz

router = APIRouter(prefix="/nurse", tags=["Nurse"])

@router.get("/profile")
async def get_nurse_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "nurse":
        raise HTTPException(status_code=403, detail="Not authorized")
    nurse = db.query(Nurse).filter(Nurse.user_id == current_user.id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse profile not found")
    return {
        "username": current_user.username,
        "name": current_user.name,
        "email": current_user.email,
        "shift_start": nurse.shift_start.strftime('%Y-%m-%d %H:%M:%S') if nurse.shift_start else None,
        "shift_end": nurse.shift_end.strftime('%Y-%m-%d %H:%M:%S') if nurse.shift_end else None
    }

@router.get("/appointments")
async def get_nurse_appointments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "nurse":
        raise HTTPException(status_code=403, detail="Not authorized")
    ist = pytz.timezone('Asia/Kolkata')
    today = datetime.now(ist).date()
    # Fetch appointments for the next 7 days to include upcoming appointments
    next_week = today + timedelta(days=7)
    appointments = db.query(Patient).join(User, Patient.user_id == User.id, isouter=True).filter(
        Patient.appointment_date >= today,
        Patient.appointment_date < next_week
    ).all()
    return [
        {
            "username": user.username,
            "appointment_date": p.appointment_date.astimezone(ist).isoformat(),
            "doctor_id": p.doctor_id  # Include doctor_id to track forwarded status
        } for p, user in [(p, p.user) for p in appointments]
    ]

@router.post("/forward-to-doctor/{patient_username}")
async def forward_to_doctor(patient_username: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "nurse":
        raise HTTPException(status_code=403, detail="Not authorized")
    patient = db.query(Patient).join(User, Patient.user_id == User.id, isouter=True).filter(User.username == patient_username, User.role == "patient").first()
    if not patient or not patient.is_profile_complete:
        raise HTTPException(status_code=400, detail="Patient not found or profile incomplete")
    doctor = db.query(User).filter(User.role == "doctor").first()
    if doctor:
        patient.doctor_id = doctor.id
        db.commit()
    return {"message": f"Patient {patient_username} forwarded to doctor with id {doctor.id if doctor else 'none'}"}