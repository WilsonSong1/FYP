from typing import Optional
import os
import logging

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

logger = logging.getLogger(__name__)

# Load MongoDB settings from .env.
load_dotenv("./.env")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "fyp")

# Shared Mongo client and database.
mongo_client: Optional[MongoClient] = None
mongo_db: Optional[Database] = None


def connect_to_mongo(raise_on_error: bool = True) -> bool:
    global mongo_client, mongo_db

    # Use existing connection if ready.
    if mongo_client is not None and mongo_db is not None:
        return True

    try:
        # Create client and ping database.
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[MONGODB_DB_NAME]
        logger.info("Connected to MongoDB database '%s'", MONGODB_DB_NAME)
        return True
    except Exception as exc:
        mongo_client = None
        mongo_db = None
        logger.warning("MongoDB connection failed: %s", exc)

        if raise_on_error:
            raise

        return False


def close_mongo_connection() -> None:
    global mongo_client, mongo_db

    # Close client if it exists.
    if mongo_client is not None:
        mongo_client.close()

    mongo_client = None
    mongo_db = None


def get_mongo_db() -> Database:
    # Stop if database is not connected.
    if mongo_db is None:
        raise RuntimeError("MongoDB is not connected. Check MONGODB_URI or MONGODB_URL in backend/.env.")

    return mongo_db