from pydantic import BaseModel
from typing import List, Dict, Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class QuizRequest(BaseModel):
    topic: str
    level: str

class QuizQuestion(BaseModel):
    question: str
    options: Dict[str, str]
    correct_answer: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class SaveTextRequest(BaseModel):
    text: str


class QuizAnswerResult(BaseModel):
    question: str
    selected_answer_key: str
    selected_answer_text: str
    correct_answer_key: str
    correct_answer_text: str
    is_correct: bool
    wrong_answer: Optional[str] = None


class QuizResultRequest(BaseModel):
    topic: str
    level: str
    score: int
    total_questions: int
    questions: List[QuizAnswerResult]


class FriendRequestCreate(BaseModel):
    username: str