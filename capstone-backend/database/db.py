from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL
DATABASE_URL = "sqlite:///./drugs.db"  # Adjust if using a different database

# Create engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # For SQLite multi-thread support
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()