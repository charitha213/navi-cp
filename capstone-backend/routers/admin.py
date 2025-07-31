from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import FileResponse

from schemas.request_schemas import DeleteDoctorRequest
from services.prediction_service import predict_risk_level, df_clean
from database.models import Drug, User, Nurse
from database.db import get_db
import pandas as pd
import shutil
import os
from passlib.context import CryptContext
from auth.auth import create_access_token, get_current_user, get_current_user_role
from datetime import timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup")
async def signup_admin(
    username: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    department: str = Form(None),
    designation: str = Form(None),
    hospital: str = Form(None),
    city: str = Form(None),
    db: Session = Depends(get_db)
):
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        raise HTTPException(status_code=403, detail="An admin user already exists. Use /admin/token to log in.")

    existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = pwd_context.hash(password)

    new_admin = User(
        username=username,
        password=hashed_password,
        role="admin",
        name=name,
        email=email,
        phone=phone,
        department=department,
        designation=designation,
        hospital=hospital,
        city=city
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {"message": "Admin user created successfully. Use /admin/token to log in."}

@router.post("/add-doctor")
@router.post("/add-nurse")
async def add_user(
    username: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    department: str = Form(...),
    designation: str = Form(...),
    hospital: str = Form(...),
    city: str = Form(...),
    role: str = Form(..., description="Role can be 'doctor' or 'nurse'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to add users")
    if role not in ["doctor", "nurse"]:
        raise HTTPException(status_code=400, detail="Role must be 'doctor' or 'nurse'")
    existing = db.query(User).filter_by(username=username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = pwd_context.hash(password)
    new_user = User(
        username=username,
        password=hashed_password,
        role=role,
        name=name,
        email=email,
        phone=phone,
        department=department,
        designation=designation,
        hospital=hospital,
        city=city,
        created_by_id=current_user.id
    )
    db.add(new_user)
    db.flush()  # Ensure user_id is generated
    if role == "nurse":
        new_nurse = Nurse(user_id=new_user.id, shift_start=None, shift_end=None)
        db.add(new_nurse)
    db.commit()
    db.refresh(new_user)
    return {"message": f"{role.capitalize()} added successfully", "user_id": new_user.id}

@router.post("/add-drug")
async def add_single_drug(
    name: str = Form(...),
    prod_ai: str = Form(...),
    pt: str = Form(""),
    outc_cod: str = Form(""),
    role: str = Depends(get_current_user_role),
    db: Session = Depends(get_db)
):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to add drugs")
    features = {
        "name": name,
        "prod_ai": prod_ai,
        "pt": pt,
        "outc_cod": outc_cod,
    }
    prediction = predict_risk_level(features, df_clean)

    drug_entry = Drug(
        name=name,
        prod_ai=prod_ai,
        pt=pt,
        outc_cod=outc_cod,
        risk_level=prediction
    )
    db.add(drug_entry)
    db.commit()
    return {"message": "Drug added", "risk_level": prediction}

@router.post("/bulk-upload")
async def bulk_upload(file: UploadFile = File(...), role: str = Depends(get_current_user_role), db: Session = Depends(get_db)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to upload bulk data")
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_excel(file_path)
        results = []
        for _, row in df.iterrows():
            features = row.to_dict()
            risk = predict_risk_level(features, df_clean)
            drug = Drug(
                name=features["name"],
                prod_ai=features["prod_ai"],
                pt=features.get("pt", ""),
                outc_cod=features.get("outc_cod", ""),
                risk_level=risk
            )
            db.add(drug)
            results.append({**features, "risk_level": risk})
        db.commit()
        return {"message": "Bulk upload successful", "data": results}
    finally:
        db.close()
        os.remove(file_path)

@router.get("/download-template")
async def download_template(role: str = Depends(get_current_user_role), db: Session = Depends(get_db)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to download template")
    template_data = {
        "name": [""],
        "prod_ai": [""],
        "pt": [""],
        "outc_cod": [""]
    }
    df = pd.DataFrame(template_data)
    file_path = "drug_template.xlsx"
    df.to_excel(file_path, index=False)
    return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=file_path)

@router.delete("/delete-doctor")
async def delete_doctor(
    request: DeleteDoctorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete doctors")
    doctor = db.query(User).filter(User.username == request.username, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"message": f"Doctor {request.username} deleted successfully"}