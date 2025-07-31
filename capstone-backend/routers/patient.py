from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Patient, User
from auth.auth import create_access_token, get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/patient", tags=["Patient"])

class PatientSignupRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    phone: str

@router.post("/signup")
async def patient_signup(request: PatientSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter((User.username == request.username) | (User.email == request.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed_password = pwd_context.hash(request.password)
    new_user = User(username=request.username, password=hashed_password, role="patient", name=request.name, email=request.email, phone=request.phone)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    new_patient = Patient(user_id=new_user.id, age=None, address=None, is_profile_complete=False)
    db.add(new_patient)
    db.commit()
    return {"message": "Patient signed up successfully. Please complete your profile."}

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username, User.role == "patient").first()
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profile")
async def get_patient_profile(username: str = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["patient", "doctor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if username and current_user.role == "doctor":
        user = db.query(User).filter(User.username == username, User.role == "patient").first()
        if not user:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    else:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
    return {
        "username": user.username if username else current_user.username,
        "name": user.name if username else current_user.name,
        "email": user.email if username else current_user.email,
        "phone": user.phone if username else current_user.phone,
        "age": patient.age,
        "address": patient.address,
        "is_profile_complete": patient.is_profile_complete
    }

class PatientProfileUpdateRequest(BaseModel):
    age: int
    address: str

@router.put("/profile")
async def update_patient_profile(request: PatientProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    patient.age = request.age
    patient.address = request.address
    patient.is_profile_complete = True
    db.commit()
    return {"message": "Profile updated successfully"}

class AppointmentRequest(BaseModel):
    appointment_date: datetime

@router.post("/book-appointment")
async def book_appointment(request: AppointmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient.is_profile_complete:
        raise HTTPException(status_code=400, detail="Complete your profile before booking an appointment")
    patient.appointment_date = request.appointment_date
    db.commit()
    return {"message": "Appointment booked successfully"}

@router.get("/appointments")
async def get_patient_appointments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Not authorized")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "appointments": [
            {
                "appointment_date": patient.appointment_date.isoformat() if patient.appointment_date else None
            }
        ] if patient.appointment_date else []
    }