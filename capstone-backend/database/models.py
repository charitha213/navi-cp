from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base
import pandas as pd
from passlib.context import CryptContext
from sqlalchemy.sql.sqltypes import DateTime
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Drug(Base):
    __tablename__ = "drugs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    pt = Column(String)  # symptoms
    dose_amt = Column(Integer)
    nda_num = Column(Integer)
    route = Column(String)
    dose_unit = Column(String)
    dose_form = Column(String)
    dose_freq = Column(String)
    dechal = Column(String)
    rechal = Column(String)
    role_cod = Column(String)
    risk_level = Column(String)

class FlaggedDrug(Base):
    __tablename__ = "flagged_drugs"
    id = Column(Integer, primary_key=True, index=True)
    drugname = Column(String, unique=True, index=True)
    risk_level = Column(String)
    suppressed = Column(Boolean, default=False)
    alternatives = Column(String)  # JSON string
    hidden_by_manager = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # Hashed password
    role = Column(String, index=True)  # "production", "doctor", "manager", "admin", "nurse", "patient"
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    department = Column(String)
    designation = Column(String)
    hospital = Column(String)
    city = Column(String)
    created_by_id = Column(Integer, ForeignKey("users.id"))  # New field to link to creator

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password)

    nurse = relationship("Nurse", back_populates="user", uselist=False)
    patient = relationship("Patient", back_populates="user", uselist=False, foreign_keys="Patient.user_id")

class Nurse(Base):
    __tablename__ = "nurses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    shift_start = Column(DateTime)
    shift_end = Column(DateTime)

    user = relationship("User", back_populates="nurse")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    address = Column(String)
    appointment_date = Column(DateTime)
    is_profile_complete = Column(Boolean, default=False)
    doctor_id = Column(Integer, ForeignKey("users.id"))  # New field for doctor assignment
    is_handled = Column(Boolean, default=False)

    user = relationship("User", back_populates="patient", foreign_keys=[user_id])

# Load df_clean at the module level
df_clean = None
try:
    df_clean = pd.read_csv("models/df_clean.csv")
    if df_clean.empty:
        raise ValueError("df_clean.csv is empty")
    print("df_clean columns:", df_clean.columns.tolist())
    print("df_clean head:", df_clean.head().to_string())
except FileNotFoundError:
    raise FileNotFoundError("models/df_clean.csv not found. Please ensure the file exists.")
except Exception as e:
    raise Exception(f"Error loading df_clean.csv: {str(e)}")