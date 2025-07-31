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
    # Basic info
    name: str = Form(...),
    prod_ai: str = Form(...),  # Matches Drug model's prod_ai column
    pt: str = Form(""),
    outc_cod: str = Form(""),

    # Numeric features
    dose_amt: float = Form(0),
    nda_num: int = Form(0),

    # Categorical features
    route: str = Form("Unknown"),
    dose_unit: str = Form("Unknown"),
    dose_form: str = Form("Unknown"),
    dose_freq: str = Form("Unknown"),
    dechal: str = Form("Unknown"),
    rechal: str = Form("Unknown"),
    role_cod: str = Form("PS"),

    role: str = Depends(get_current_user_role),
    db: Session = Depends(get_db)
):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to add drugs")

    # Prepare complete feature dictionary with consistent naming
    features = {
        "drugname": name,  # Changed to match what predict_risk_level expects
        "prod_ai": prod_ai,
        "pt": pt,
        "outc_cod": outc_cod,
        "dose_amt": dose_amt,
        "nda_num": nda_num,
        "route": route,
        "dose_unit": dose_unit,
        "dose_form": dose_form,
        "dose_freq": dose_freq,
        "dechal": dechal,
        "rechal": rechal,
        "role_cod": role_cod
    }

    try:
        prediction = predict_risk_level(features)

        drug_entry = Drug(
            name=name,
            prod_ai=prod_ai,
            pt=pt,
            outc_cod=outc_cod,
            risk_level=prediction,
            dose_amt=dose_amt,
            nda_num=nda_num,
            route=route,
            dose_unit=dose_unit,
            dose_form=dose_form,
            dose_freq=dose_freq,
            dechal=dechal,
            rechal=rechal,
            role_cod=role_cod
        )

        db.add(drug_entry)
        db.commit()
        return {
            "message": "Drug added successfully",
            "risk_level": prediction,
            "drug_details": {
                "name": name,
                "active_ingredient": prod_ai,
                "symptoms": pt,
                "outcome": outc_cod
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Drug addition failed: {str(e)}"
        )

@router.post("/bulk-upload")
async def bulk_upload(file: UploadFile = File(...), role: str = Depends(get_current_user_role), db: Session = Depends(get_db)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to upload bulk data")
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_excel(file_path)
        # Ensure all expected columns are present, fill missing with defaults
        expected_columns = ["name", "prod_ai", "pt", "outc_cod", "dose_amt", "nda_num", "route", "dose_unit", "dose_form", "dose_freq", "dechal", "rechal", "role_cod"]
        for col in expected_columns:
            if col not in df.columns:
                df[col] = "Unknown" if col not in ["dose_amt", "nda_num"] else 0
        results = []
        for _, row in df.iterrows():
            features = {
                "drugname": row["name"],
                "prod_ai": row["prod_ai"],
                "pt": row.get("pt", "Unknown"),
                "outc_cod": row.get("outc_cod", "Unknown"),
                "dose_amt": float(row.get("dose_amt", 0)),
                "nda_num": int(row.get("nda_num", 0)),
                "route": row.get("route", "Unknown"),
                "dose_unit": row.get("dose_unit", "Unknown"),
                "dose_form": row.get("dose_form", "Unknown"),
                "dose_freq": row.get("dose_freq", "Unknown"),
                "dechal": row.get("dechal", "Unknown"),
                "rechal": row.get("rechal", "Unknown"),
                "role_cod": row.get("role_cod", "PS")
            }
            risk = predict_risk_level(features, df_clean)
            drug = Drug(
                name=features["drugname"],
                prod_ai=features["prod_ai"],
                pt=features["pt"],
                outc_cod=features["outc_cod"],
                risk_level=risk,
                dose_amt=features["dose_amt"],
                nda_num=features["nda_num"],
                route=features["route"],
                dose_unit=features["dose_unit"],
                dose_form=features["dose_form"],
                dose_freq=features["dose_freq"],
                dechal=features["dechal"],
                rechal=features["rechal"],
                role_cod=features["role_cod"]
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
        "name": [""],  # Required
        "prod_ai": [""],  # Required
        "pt": ["Unknown"],  # Optional, default "Unknown"
        "outc_cod": ["Unknown"],  # Optional, default "Unknown"
        "dose_amt": [0],  # Optional, default 0
        "nda_num": [0],  # Optional, default 0
        "route": ["Unknown"],  # Optional, default "Unknown"
        "dose_unit": ["Unknown"],  # Optional, default "Unknown"
        "dose_form": ["Unknown"],  # Optional, default "Unknown"
        "dose_freq": ["Unknown"],  # Optional, default "Unknown"
        "dechal": ["Unknown"],  # Optional, default "Unknown"
        "rechal": ["Unknown"],  # Optional, default "Unknown"
        "role_cod": ["PS"]  # Optional, default "PS"
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