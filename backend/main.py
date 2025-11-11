from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import os

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
  extra_body={},
  model="deepseek/deepseek-chat-v3.1:free",
  messages=[
              {"role": "system", "content": "You are a tutor for a university student in software development"},
              {"role": "user", "content": userMessage}
            ]
)
    ai_reply = response.choices[0].message.content
    return {"reply": ai_reply}