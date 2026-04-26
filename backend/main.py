from fastapi import FastAPI, Request, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime, timedelta
from database import SessionLocal, engine
from mongodb import connect_to_mongo, close_mongo_connection, get_mongo_db
from schemas import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, QuizRequest, QuizResponse, SaveTextRequest, QuizResultRequest, FriendRequestCreate
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
    # Try MongoDB connect on startup.
    connect_to_mongo(raise_on_error=False)


@app.on_event("shutdown")
def shutdown_event():
    # Close MongoDB when app stops.
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
ai_model = "deepseek/deepseek-v4-pro"
print("Loaded API KEY:" , bool(apiKey))

models.Base.metadata.create_all(bind=engine)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key = apiKey,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_username(token: str = Depends(oauth2_scheme)):
    # Read username from token.
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
    # Get user message.
    data = await request.json()
    userMessage = data.get("message", "")
    # Send message to AI.
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
    # Open DB session for request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check for existing user.
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(user.password)

    # Save new user with hashed password.
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
    # Find user by username.
    db_user = db.query(models.User).filter(models.User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    # Create login token.
    token = create_access_token({"sub": db_user.username})

    return {"access_token": token, "token_type": "bearer"}


@app.get("/me")
def me(username: str = Depends(get_current_username)):
    return {"username": username}

@app.post("/forgot-password/request")
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Use same reply for any email.
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if user:
        # Create and save 6-digit code.
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
    # Check reset code and expiry.
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not user.reset_code or not user.reset_code_expires:
        raise HTTPException(status_code=400, detail="Invalid reset request")

    if user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    if user.reset_code_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code has expired")

    # Save new password and clear reset code.
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

    # Remove markdown before JSON parse.
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

@app.post("/generate-quiz-from-pdf", response_model=QuizResponse)
async def generate_quiz_from_pdf(file: UploadFile = File(...)):
    """
    Extract text from a PDF file and generate quiz questions from the extracted content.
    """
    try:
        contents = await file.read()
        file_stream = io.BytesIO(contents)

        try:
            pdf_document = fitz.open(stream=file_stream, filetype="pdf")
            extracted_text = ""
            for page_num in range(len(pdf_document)):
                extracted_text += pdf_document[page_num].get_text()
            pdf_document.close()
        except Exception as pdf_error:
            raise HTTPException(
                status_code=400,
                detail=f"Could not process file as PDF: {str(pdf_error)}",
            )

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the PDF",
            )

        prompt = f"""
You are an education quiz generator.
Generate 10 multiple choice questions based only on the following PDF content.
    Ignore titles, chapter headings, table of contents, page numbers, captions, footers, headers, repeated boilerplate, and any other non-essential text that should not be tested.
    Focus only on the meaningful educational content that a student should actually be questioned on.

Rules:
- Each question must have exactly 4 answer options
- Only ONE answer is correct
- Return JSON ONLY in this exact example format:
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

PDF Content:
{extracted_text}
"""

        response = client.responses.create(
            model=ai_model,
            input=[
                {
                    "role": "system",
                    "content": "You are an educational quiz generator.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating quiz from PDF: {str(e)}",
        )

@app.post("/extract-text-from-image")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extract text from image files using PyMuPDF, then send to AI for summarization.
    """
    try:
        contents = await file.read()
        file_stream = io.BytesIO(contents)
        extracted_text = ""
        
        try:
            # Read file as PDF.
            pdf_document = fitz.open(stream=file_stream, filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                extracted_text += page.get_text()
            pdf_document.close()
        except Exception as pdf_error:
            raise HTTPException(
                status_code=400,
                detail=f"Could not process file as PDF: {str(pdf_error)}"
            )
        
        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the image"
            )
        
        prompt = f"""Please analyze the following text and provide:
                     1. A concise summary (3-5 sentences)
                     2. Key points (as a bullet list, max 6 points)

                     Text:
                     {extracted_text}

                     Format your response as JSON with keys "summary" and "key_points" (array).
                 """
        
        response = client.chat.completions.create(
            extra_body={"skip_special_tokens": True},
            model=ai_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes text and extracts key points. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        ai_response = response.choices[0].message.content
        
        try:
            json_match = re.search(r'\{[\s\S]*\}', ai_response)
            if json_match:
                result = json.loads(json_match.group(0))
            else:
                result = json.loads(ai_response)
        except json.JSONDecodeError:
            result = {
                "summary": ai_response,
                "key_points": []
            }
        
        return {
            "filename": file.filename,
            "summary": result.get("summary", ""),
            "key_points": result.get("key_points", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@app.post("/save-text-to-profile")
async def save_text_to_profile(data: SaveTextRequest, username: str = Depends(get_current_username)):
    """
    Save AI-generated text to user's profile in MongoDB
    """
    try:
        # Save text in MongoDB.
        db = get_mongo_db()
        
        # Get or create user's saved texts collection
        users_collection = db["users"]
        
        # Create a new saved text document
        saved_text_doc = {
            "username": username,
            "text": data.text,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into collection
        result = users_collection.insert_one(saved_text_doc)
        
        return {
            "message": "Text saved to profile successfully",
            "saved_text_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving text: {str(e)}"
        )

@app.get("/get-saved-texts")
async def get_saved_texts(username: str = Depends(get_current_username)):
    """
    Retrieve all saved texts for the current user from MongoDB
    """
    try:
        # Get this user's saved texts.
        db = get_mongo_db()
        users_collection = db["users"]
        
        saved_texts = list(users_collection.find({"username": username}))
        
        # Convert ids and dates to strings.
        for text in saved_texts:
            text["_id"] = str(text["_id"])
            text["created_at"] = text["created_at"].isoformat()
            text["updated_at"] = text["updated_at"].isoformat()
        
        return {
            "saved_texts": saved_texts,
            "count": len(saved_texts)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving saved texts: {str(e)}"
        )

@app.delete("/delete-saved-text/{text_id}")
async def delete_saved_text(text_id: str, username: str = Depends(get_current_username)):
    """
    Delete a saved text - only the owner can delete it
    """
    try:
        from bson import ObjectId
        # Delete only if user owns it.
        db = get_mongo_db()
        users_collection = db["users"]
        
        try:
            object_id = ObjectId(text_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid text ID")
        
        result = users_collection.delete_one({
            "_id": object_id,
            "username": username
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Text not found or not authorized")
        
        return {"message": "Text deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting text: {str(e)}"
        )


@app.post("/save-quiz-result-to-profile")
async def save_quiz_result_to_profile(data: QuizResultRequest, username: str = Depends(get_current_username)):
    """
    Save a completed quiz result to the current user's profile in MongoDB.
    """
    try:
        db = get_mongo_db()
        quiz_results_collection = db["quiz_results"]

        quiz_result_doc = {
            "username": username,
            "topic": data.topic,
            "level": data.level,
            "score": data.score,
            "total_questions": data.total_questions,
            "questions": [question.dict() for question in data.questions],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = quiz_results_collection.insert_one(quiz_result_doc)

        return {
            "message": "Quiz result saved successfully",
            "quiz_result_id": str(result.inserted_id),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving quiz result: {str(e)}",
        )


@app.get("/get-quiz-results")
async def get_quiz_results(username: str = Depends(get_current_username)):
    """
    Retrieve all quiz results for the current user from MongoDB.
    """
    try:
        db = get_mongo_db()
        quiz_results_collection = db["quiz_results"]

        quiz_results = list(
            quiz_results_collection.find({"username": username}).sort("created_at", -1)
        )

        for quiz_result in quiz_results:
            quiz_result["_id"] = str(quiz_result["_id"])
            if quiz_result.get("created_at"):
                quiz_result["created_at"] = quiz_result["created_at"].isoformat()
            if quiz_result.get("updated_at"):
                quiz_result["updated_at"] = quiz_result["updated_at"].isoformat()

        return {
            "quiz_results": quiz_results,
            "count": len(quiz_results),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving quiz results: {str(e)}",
        )


@app.delete("/delete-quiz-result/{quiz_result_id}")
async def delete_quiz_result(quiz_result_id: str, username: str = Depends(get_current_username)):
    """
    Delete a saved quiz result belonging to the current user.
    """
    try:
        from bson import ObjectId

        db = get_mongo_db()
        quiz_results_collection = db["quiz_results"]

        try:
            object_id = ObjectId(quiz_result_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid quiz result ID")

        result = quiz_results_collection.delete_one({
            "_id": object_id,
            "username": username,
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Quiz result not found or not authorized")

        return {"message": "Quiz result deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting quiz result: {str(e)}",
        )


@app.get("/quiz-leaderboard")
def get_quiz_leaderboard(db: Session = Depends(get_db)):
    """
    Return all users ranked by average quiz result percentage.
    Users with no quiz results are included with an average of 0.
    """
    try:
        db_mongo = get_mongo_db()
        quiz_results_collection = db_mongo["quiz_results"]

        quiz_results = list(quiz_results_collection.find({}))
        users = db.query(models.User).all()

        aggregates = {}
        for result in quiz_results:
            username = result.get("username")
            if not username:
                continue

            score = result.get("score", 0) or 0
            total_questions = result.get("total_questions", 0) or 0

            if username not in aggregates:
                aggregates[username] = {"score_sum": 0, "question_sum": 0, "quiz_count": 0}

            aggregates[username]["score_sum"] += score
            aggregates[username]["question_sum"] += total_questions
            aggregates[username]["quiz_count"] += 1

        leaderboard = []
        for user in users:
            user_aggregate = aggregates.get(user.username, {"score_sum": 0, "question_sum": 0, "quiz_count": 0})
            average_score = 0
            if user_aggregate["question_sum"] > 0:
                average_score = (user_aggregate["score_sum"] / user_aggregate["question_sum"]) * 100

            leaderboard.append({
                "username": user.username,
                "average_score": round(average_score, 1),
                "quiz_count": user_aggregate["quiz_count"],
            })

        leaderboard.sort(key=lambda item: (-item["average_score"], item["username"].lower()))

        return {
            "leaderboard": leaderboard,
            "count": len(leaderboard),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving quiz leaderboard: {str(e)}",
        )


@app.post("/friends/request")
def send_friend_request(payload: FriendRequestCreate, username: str = Depends(get_current_username), db: Session = Depends(get_db)):
    # Get current user and target user.
    from_user = db.query(models.User).filter(models.User.username == username).first()
    target_user = db.query(models.User).filter(models.User.username == payload.username).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="Username does not exist")

    if not from_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    if target_user.id == from_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself")

    user_one_id = min(from_user.id, target_user.id)
    user_two_id = max(from_user.id, target_user.id)

    existing_friendship = db.query(models.Friendship).filter(
        models.Friendship.user_one_id == user_one_id,
        models.Friendship.user_two_id == user_two_id,
    ).first()

    if existing_friendship:
        raise HTTPException(status_code=400, detail="You are already friends")

    existing_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.from_user_id == from_user.id,
        models.FriendRequest.to_user_id == target_user.id,
        models.FriendRequest.status == "pending",
    ).first()

    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already sent")

    reverse_pending_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.from_user_id == target_user.id,
        models.FriendRequest.to_user_id == from_user.id,
        models.FriendRequest.status == "pending",
    ).first()

    if reverse_pending_request:
        raise HTTPException(status_code=400, detail="This user has already sent you a friend request")

    # Create pending request.
    request = models.FriendRequest(
        from_user_id=from_user.id,
        to_user_id=target_user.id,
        status="pending",
    )
    db.add(request)
    db.commit()

    return {"message": "Friend request sent"}


@app.get("/friends/requests")
def get_incoming_friend_requests(username: str = Depends(get_current_username), db: Session = Depends(get_db)):
    # Get pending requests for user.
    current_user = db.query(models.User).filter(models.User.username == username).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    requests = db.query(models.FriendRequest).filter(
        models.FriendRequest.to_user_id == current_user.id,
        models.FriendRequest.status == "pending",
    ).all()

    # Add sender names.
    results = []
    for request in requests:
        sender = db.query(models.User).filter(models.User.id == request.from_user_id).first()
        if sender:
            results.append({
                "request_id": request.id,
                "from_username": sender.username,
                "created_at": request.created_at.isoformat() if request.created_at else None,
            })

    return {"requests": results}


@app.post("/friends/requests/{request_id}/accept")
def accept_friend_request(request_id: int, username: str = Depends(get_current_username), db: Session = Depends(get_db)):
    # Check request belongs to user.
    current_user = db.query(models.User).filter(models.User.username == username).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    request = db.query(models.FriendRequest).filter(
        models.FriendRequest.id == request_id,
        models.FriendRequest.to_user_id == current_user.id,
        models.FriendRequest.status == "pending",
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")

    user_one_id = min(request.from_user_id, request.to_user_id)
    user_two_id = max(request.from_user_id, request.to_user_id)

    existing_friendship = db.query(models.Friendship).filter(
        models.Friendship.user_one_id == user_one_id,
        models.Friendship.user_two_id == user_two_id,
    ).first()

    # Create friendship on accept.
    if not existing_friendship:
        friendship = models.Friendship(user_one_id=user_one_id, user_two_id=user_two_id)
        db.add(friendship)

    request.status = "accepted"
    db.commit()

    return {"message": "Friend request accepted"}


@app.get("/friends/list")
def get_friends_list(username: str = Depends(get_current_username), db: Session = Depends(get_db)):
    # Get all friendships for user.
    current_user = db.query(models.User).filter(models.User.username == username).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    friendships = db.query(models.Friendship).filter(
        (models.Friendship.user_one_id == current_user.id) |
        (models.Friendship.user_two_id == current_user.id)
    ).all()

    # Convert friend ids to names.
    friend_usernames = []
    for friendship in friendships:
        friend_id = friendship.user_two_id if friendship.user_one_id == current_user.id else friendship.user_one_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        if friend:
            friend_usernames.append(friend.username)

    return {"friends": friend_usernames}


@app.delete("/friends/{friend_username}")
def unfriend_user(friend_username: str, username: str = Depends(get_current_username), db: Session = Depends(get_db)):
    # Get both users first.
    current_user = db.query(models.User).filter(models.User.username == username).first()
    friend_user = db.query(models.User).filter(models.User.username == friend_username).first()

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not friend_user:
        raise HTTPException(status_code=404, detail="Friend username does not exist")

    user_one_id = min(current_user.id, friend_user.id)
    user_two_id = max(current_user.id, friend_user.id)

    friendship = db.query(models.Friendship).filter(
        models.Friendship.user_one_id == user_one_id,
        models.Friendship.user_two_id == user_two_id,
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend not found")

    # Delete friendship and old requests.
    db.delete(friendship)

    db.query(models.FriendRequest).filter(
        (
            (models.FriendRequest.from_user_id == current_user.id) &
            (models.FriendRequest.to_user_id == friend_user.id)
        ) |
        (
            (models.FriendRequest.from_user_id == friend_user.id) &
            (models.FriendRequest.to_user_id == current_user.id)
        )
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "Successfully unfriended"}