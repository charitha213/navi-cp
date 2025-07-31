from fastapi import APIRouter, HTTPException, Depends
from fastapi.params import Form
from pydantic import BaseModel
from typing import List
from database.db import get_db
from database.models import FlaggedDrug, User, df_clean
import json
import pandas as pd
from sqlalchemy.orm import Session
from auth.auth import get_current_user, get_current_user_role
from passlib.context import CryptContext

from schemas.request_schemas import DeleteOperatorRequest

router = APIRouter(prefix="/production", tags=["Production"])

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class FlagDrugRequest(BaseModel):
    drugname: str


class SearchRequest(BaseModel):
    query: str


class UpdateAlternativesRequest(BaseModel):
    alternatives: List[str]


class UserRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    role: str = "production"  # Default to production for operator signup


@router.post("/add-manager")
async def add_manager(
    username: str,
    password: str,
    name: str,
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Require authenticated admin
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add managers")
    existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = pwd_context.hash(password)
    new_user = User(
        username=username,
        password=hashed_password,
        role="manager",
        name=name,
        email=email,
        created_by_id=current_user.id  # Set creator as current admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"Manager {name} created successfully. Use /admin/token to log in."}

@router.post("/production/add_user")
async def add_production_operator(
    user: UserRequest,
    manager_role: str = Depends(get_current_user_role),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Require authenticated manager
):
    if manager_role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can add production operators")
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=user.username,
        password=hashed_password,
        role=user.role,
        name=user.name,
        email=user.email,
        created_by_id=current_user.id  # Set creator as current manager
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"Production operator {user.name} added successfully by manager. Use /admin/token to log in."}

# Operator Endpoints
@router.post("/production/search")
async def search_drugs(request: SearchRequest, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role not in ["production", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to search drugs")
    query = request.query.lower()
    if not query:
        return []

    if df_clean is None or df_clean.empty:
        raise HTTPException(status_code=500, detail="Drug data not loaded")

    matched = df_clean[df_clean['drugname'].str.lower().str.contains(query)]
    results = (
        matched[['drugname', 'risk_level']]
        .drop_duplicates('drugname')
        .head(15)
        .to_dict(orient='records')
    )
    return results


@router.post("/production/flag")
async def flag_drug(data: FlagDrugRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "production":
        raise HTTPException(status_code=403, detail="Only production operators can flag drugs")
    existing = db.query(FlaggedDrug).filter_by(drugname=data.drugname).first()
    if existing:
        raise HTTPException(status_code=400, detail="Drug already flagged")

    matching_row = df_clean[df_clean['drugname'].str.lower() == data.drugname.lower()]
    if matching_row.empty:
        raise HTTPException(status_code=404, detail="Drug not found in dataset")

    risk_level = matching_row.iloc[0]['risk_level']
    alternatives = []
    if risk_level == 'high':
        high_risk_route = matching_row.iloc[0]['route']
        low_risk_options = df_clean[df_clean['risk_level'] == 'low']
        alternatives = low_risk_options[low_risk_options['route'] == high_risk_route]['drugname'].head(5).tolist()
        if not alternatives:
            alternatives = ["No suitable alternatives found"]

    flagged = FlaggedDrug(
        drugname=data.drugname,
        risk_level=risk_level,
        suppressed=False,
        alternatives=json.dumps(alternatives),
        hidden_by_manager=False
    )
    db.add(flagged)
    db.commit()
    return {"message": "Drug flagged successfully", "drugname": data.drugname, "risk_level": risk_level}


@router.get("/production/flagged")
async def get_flagged_drugs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    flagged = db.query(FlaggedDrug).all()
    return [
        {
            "drugname": f.drugname,
            "risk_level": f.risk_level,
            "suppressed": f.suppressed,
            "alternatives": json.loads(f.alternatives),
            "hidden_by_manager": f.hidden_by_manager
        }
        for f in flagged
    ]


@router.delete("/production/delete/{drugname}")
async def delete_flagged_drug(drugname: str, db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "production":
        raise HTTPException(status_code=403, detail="Only production operators can delete flagged drugs")
    drug = db.query(FlaggedDrug).filter_by(drugname=drugname).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Flagged drug not found")
    db.delete(drug)
    db.commit()
    return {"message": f"Flagged drug {drugname} deleted successfully"}


# Manager Endpoints
@router.post("/production/suppress/{drugname}")
async def suppress_drug(drugname: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can suppress drugs")
    drug = db.query(FlaggedDrug).filter_by(drugname=drugname).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    drug.suppressed = True
    db.commit()
    return {"message": "Drug suppressed"}


@router.post("/production/unsuppress/{drugname}")
async def unsuppress_drug(drugname: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can unsuppress drugs")
    drug = db.query(FlaggedDrug).filter_by(drugname=drugname).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    drug.suppressed = False
    db.commit()
    return {"message": "Drug unsuppressed"}


@router.post("/production/update_alternatives/{drugname}")
async def update_alternatives(drugname: str, data: UpdateAlternativesRequest, db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can update alternatives")
    drug = db.query(FlaggedDrug).filter_by(drugname=drugname).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    drug.alternatives = json.dumps(data.alternatives)
    db.commit()
    return {"message": f"Alternatives updated for {drugname}", "alternatives": data.alternatives}


@router.post("/production/hide/{drugname}")
async def hide_drug(drugname: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = get_current_user_role(current_user)
    if role != "manager":
        raise HTTPException(status_code=403, detail="Only managers can hide drugs")
    drug = db.query(FlaggedDrug).filter_by(drugname=drugname).first()
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    drug.hidden_by_manager = True
    db.commit()
    return {"message": f"Drug {drugname} hidden by manager"}


@router.get("/production/profile")
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {
        "username": current_user.username,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

    if current_user.role == "doctor":
        reporting_admin = db.query(User).filter(
            User.id == current_user.created_by_id).first() if current_user.created_by_id else None
        profile_data["reporting"] = {
            "adminName": reporting_admin.name if reporting_admin else "No Admin Assigned",
            "adminEmail": reporting_admin.email if reporting_admin else "N/A"
        }
    elif current_user.role == "production":
        reporting_manager = db.query(User).filter(
            User.id == current_user.created_by_id).first() if current_user.created_by_id else None
        profile_data["reporting"] = {
            "managerName": reporting_manager.name if reporting_manager else "No Manager Assigned",
            "managerEmail": reporting_manager.email if reporting_manager else "N/A"
        }

    return profile_data


@router.delete("/delete-operator")
async def delete_operator(
    request:    DeleteOperatorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized to delete production operators")
    operator = db.query(User).filter(User.username == request.username, User.role == "production").first()
    if not operator:
        raise HTTPException(status_code=404, detail="Production operator not found")
    db.delete(operator)
    db.commit()
    return {"message": f"Production operator {request.username} deleted successfully"}