from fastapi import FastAPI, Request, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime, timedelta
from database import SessionLocal, engine
from mongodb import connect_to_mongo, close_mongo_connection
from schemas import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, QuizRequest, QuizResponse
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from emailUtil import  send_reset_code_email
import random
import os
import models
import json
import re
import io
import fitz

load_dotenv()

app = FastAPI()


@app.on_event("startup")
def startup_event():
    connect_to_mongo(raise_on_error=False)


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()

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
ai_model = "google/gemma-4-26b-a4b-it:free"
print("Loaded API KEY:" , bool(apiKey))

models.Base.metadata.create_all(bind=engine)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key = apiKey,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_username(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@app.get("/")
def root():
    return {"message": "CORS is working"}


@app.get("/mongo-health")
def mongo_health():
    try:
        connect_to_mongo(raise_on_error=True)
        return {"status": "ok", "database": "mongodb"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(exc)}")

@app.get("/api/data")
def get_data():
    return{"data": [1, 2, 3, 4]}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    userMessage = data.get("message", "")
    response = client.chat.completions.create(
    extra_body={"skip_special_tokens": True},
    model= ai_model,
    messages=[
              {"role": "system", "content": "You are a tutor for students. Explain concepts clearly, step by step, "
                                            "in simple language, and make sure the student understands the answer."},
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


@app.get("/me")
def me(username: str = Depends(get_current_username)):
    return {"username": username}

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
        model= ai_model,
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


@app.post("/extract-text-from-image")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text from image files using PyMuPDF.
    Supports PDF and image formats.
    """
    print(f"\n{'='*80}")
    print(f"START: Extract text from image - {file.filename}")
    print(f"{'='*80}")
    
    try:
        # Read the uploaded file
        contents = await file.read()
        print(f"[DEBUG] File size: {len(contents)} bytes")
        print(f"[DEBUG] File content type: {file.content_type}")
        
        file_stream = io.BytesIO(contents)
        extracted_text = ""
        
        # Try to open as PDF first (works for PDF and image files)
        print(f"[DEBUG] Attempting to open file as PDF...")
        try:
            pdf_document = fitz.open(stream=file_stream, filetype="pdf")
            print(f"[DEBUG] Successfully opened as PDF")
            page_count = len(pdf_document)
            print(f"[DEBUG] Document has {page_count} pages")
            
            for page_num in range(page_count):
                page = pdf_document[page_num]
                text = page.get_text()
                print(f"[DEBUG] Page {page_num} extracted {len(text)} characters")
                extracted_text += text
            
            pdf_document.close()
            print(f"[DEBUG] Total extracted text length: {len(extracted_text)} characters")
            
        except Exception as pdf_error:
            print(f"[DEBUG] PDF open failed: {str(pdf_error)}")
            print(f"[DEBUG] Attempting to open file as image...")
            
            # If PDF fails, try as image
            file_stream.seek(0)
            try:
                pdf_document = fitz.open(stream=file_stream, filetype="image")
                print(f"[DEBUG] Successfully opened as image")
                page_count = len(pdf_document)
                print(f"[DEBUG] Document has {page_count} pages")
                
                for page_num in range(page_count):
                    page = pdf_document[page_num]
                    text = page.get_text()
                    print(f"[DEBUG] Page {page_num} extracted {len(text)} characters")
                    extracted_text += text
                
                pdf_document.close()
                print(f"[DEBUG] Total extracted text length: {len(extracted_text)} characters")
                
            except Exception as img_error:
                print(f"[ERROR] Image open failed: {str(img_error)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not process file: {str(img_error)}"
                )
        
        # Print to console
        print(f"\n{'='*80}")
        print(f"EXTRACTED TEXT FROM: {file.filename}")
        print(f"{'='*80}")
        if extracted_text.strip():
            print(extracted_text)
        else:
            print("[WARNING] No text was extracted from the file")
        print(f"{'='*80}\n")
        
        return {"extracted_text": extracted_text, "filename": file.filename}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting text: {str(e)}"
        )