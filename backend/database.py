from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load DB settings from .env.
load_dotenv("./.env")

# DB connection string.
DATABASE_URL = os.getenv("DATABASE_URL")

# Main DB engine.
engine = create_engine(DATABASE_URL)
# Create DB sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models.
Base = declarative_base()