from pydantic import BaseModel
from typing import List, Dict

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


class FriendRequestCreate(BaseModel):
    username: str