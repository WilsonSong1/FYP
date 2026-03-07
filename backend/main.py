from fastapi import FastAPI, Request, Depends, HTTPException, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime, timedelta
from database import SessionLocal, engine
from schemas import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, QuizRequest, QuizResponse
from auth import hash_password, verify_password, create_access_token
from emailUtil import  send_reset_code_email
import random
import os
import models
import json
import re

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
    model="qwen/qwen3-next-80b-a3b-instruct:free",
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

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(data: QuizRequest):
    topic = data.topic
    level = data.level

    prompt = f"""
You are an education quiz generator
Generate 10 multiple choice questions on the topic "{topic}"
for a student at "{level}" level.

Rules:
-Each question must have exactly 4 answer options
-Only ONE answer is correct
-Return JSON ONLY in this exact example format:
[
  {{
    "question": "...",
    "options": {{
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    }},
    "correct_answer": "A"
  }}
]
Do not include explanations or extra text.
"""
    
    response = client.responses.create(
        model="deepseek/deepseek-r1-0528:free",
        input=[
            {
                "role": "system",
                "content": "You are an educational quiz generator."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )


    quiz_text = response.output_text

    cleaned = quiz_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    match = re.search(r"\[[\s\S]*\]", cleaned)
    if match:
        cleaned = match.group(0).strip()

    try:
        questions = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Quiz generator returned invalid JSON. Try again.",
        )

    return {"questions": questions}