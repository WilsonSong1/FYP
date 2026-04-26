from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

# JWT settings from .env.
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# Use bcrypt for password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    # Trim password to safe bcrypt length.
    password = safe_password(password)
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    # Trim password the same way as hash step.
    plain_password = safe_password(plain_password)

    # Stop early if hash format looks wrong.
    if not isinstance(hashed_password, str) or not hashed_password.startswith("$2"):
        return False

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_days=1):
    # Build token data with expiry time.
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def safe_password(password: str) -> str:
    # bcrypt only uses the first 72 chars.
    return password[:72]