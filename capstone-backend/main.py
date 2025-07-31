from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import doctor, admin, production, nurse, patient

app = FastAPI(
    title="Drug Risk Prediction API",
    description="API for classifying drug risk levels and suggesting alternatives",
    version="1.0.0"
)

# CORS settings — allow frontend to call backend
origins = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(doctor.router, prefix="/doctor", tags=["Doctor"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(production.router, prefix="/production", tags=["Production"])
app.include_router(nurse.router, prefix="/nurse", tags=["Nurse"])
app.include_router(patient.router, prefix="/patient", tags=["Patient"])

@app.get("/")
def read_root():
    return {"message": "Drug Risk Prediction API is running."}