from fastapi import FastAPI, Request, Depends, HTTPException, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime, timedelta
from database import SessionLocal, engine
from schemas import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest
from auth import hash_password, verify_password, create_access_token
from emailUtil import  send_reset_code_email
import random
import os
import models

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

apiKey = os.getenv("AIKEY")
print("Loaded API KEY:" , bool(apiKey))

models.Base.metadata.create_all(bind=engine)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key = apiKey
)

@app.get("/")
def root():
    return {"message": "CORS is working"}

@app.get("/api/data")
def get_data():
    return{"data": [1, 2, 3, 4]}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    userMessage = data.get("message", "")
    response = client.chat.completions.create(
    extra_body={"skip_special_tokens": True},
    model="nousresearch/hermes-3-llama-3.1-405b:free",
  messages=[
              {"role": "system", "content": "You are a tutor for a university student in software development"},
              {"role": "user", "content": userMessage}
            ]
)
    ai_reply = response.choices[0].message.content
    return {"reply": ai_reply}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Account created successfully"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    token = create_access_token({"sub": db_user.username})

    return {"access_token": token, "token_type": "bearer"}

@app.post("/forgot-password/request")
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if user:
        code = f"{random.randint(0, 999999):06d}"
        user.reset_code = code
        user.reset_code_expires = datetime.utcnow() + timedelta(minutes=10)
        db.commit()

        try:
            send_reset_code_email(user.email, code)
        except Exception as e:
            print("Error sending email:", e)
            raise HTTPException(status_code=500, detail="Could not send email")

    return {"message": "If that email exists, a reset code has been sent."}

@app.post("/forgot-password/reset")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not user.reset_code or not user.reset_code_expires:
        raise HTTPException(status_code=400, detail="Invalid reset request")

    if user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    if user.reset_code_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code has expired")

    user.password_hash = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()

    return {"message": "Password updated successfully"}