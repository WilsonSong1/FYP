from typing import Optional
import os

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

load_dotenv("./.env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "fyp")

mongo_client: Optional[MongoClient] = None
mongo_db: Optional[Database] = None


def connect_to_mongo() -> None:
    global mongo_client, mongo_db

    if mongo_client is not None and mongo_db is not None:
        return

    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    mongo_client.admin.command("ping")
    mongo_db = mongo_client[MONGODB_DB_NAME]



def close_mongo_connection() -> None:
    global mongo_client, mongo_db

    if mongo_client is not None:
        mongo_client.close()

    mongo_client = None
    mongo_db = None



def get_mongo_db() -> Database:
    if mongo_db is None:
        raise RuntimeError("MongoDB is not connected. Ensure startup completed successfully.")

    return mongo_db
