AI Tutoring Application

**FastAPI · Ionic React · PostgreSQL · MongoDB · OpenRouter AI**

---

## Project Overview

This project is a full-stack AI tutoring application built for a Final Year Project.

Core capabilities include:

* account registration and login
* password reset via email code verification
* AI tutoring chat
* quiz generation by topic and level
* extracting and summarizing text from uploaded files
* saving AI-generated text to user profiles
* basic social features (friend requests and friends list)

Backend services are implemented with FastAPI and SQLAlchemy, while the frontend is an Ionic React app. AI responses are generated through OpenRouter.

---

## Tech Stack

### Backend

* FastAPI (REST API)
* SQLAlchemy + PostgreSQL (relational data)
* PyMongo + MongoDB (saved text documents)
* Passlib + bcrypt (password hashing)
* python-jose (JWT authentication)
* OpenAI SDK with OpenRouter endpoint (AI responses)
* PyMuPDF (file text extraction)
* SMTP (password reset email delivery)

### Frontend

* **Ionic React**
* **React Router**
* **Fetch API**
* **CSS**

---

## Project Structure

```
FYP/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── mongodb.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── emailUtil.py
│   └── tests/
│       └── test.py
│
└── frontend/
  └── FYP/
    ├── package.json
    └── src/
      ├── App.tsx
      └── pages/
        ├── Home.tsx
        ├── Login.tsx
        ├── Signup.tsx
        ├── ForgotPassword.tsx
        ├── ResetPassword.tsx
        ├── ChatBot.tsx
        ├── Quiz.tsx
        ├── QuizGenerate.tsx
        ├── QuizFromImage.tsx
        ├── SavedTexts.tsx
        ├── Profile.tsx
        └── FriendsPage.tsx
```

---

## Setup Instructions

### Prerequisites

Install the following before running the project:

* Python 3.10+
* Node.js 18+ and npm
* PostgreSQL (running locally or remotely)
* MongoDB (running locally or remotely)

---

### 1. Backend Setup (FastAPI)

From the project root:

```
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary pymongo python-dotenv passlib bcrypt python-jose openai pymupdf pytest
```

Create or update `backend/.env` with your values:

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fyp
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=fyp

AIKEY=your_openrouter_api_key

SECRET_KEY=your_long_random_secret_key

SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password_or_app_password
FROM_EMAIL=your_email@example.com
```

Run the backend server:

```
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at:

* API base URL: `http://127.0.0.1:8000`
* Interactive docs: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup (Ionic React + Vite)

Open a new terminal, then run:

```
cd frontend/FYP
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`). Open it in your browser.

Note: the frontend currently calls backend endpoints on `http://127.0.0.1:8000`, so keep the backend running while using the app.

---

### 3. Running Both Services Together

Use two terminals:

1. Terminal A: run FastAPI in `backend/`
2. Terminal B: run Vite in `frontend/FYP/`

---

## Features Implemented

### Authentication

* user signup with duplicate username/email checks
* secure login with JWT bearer token generation
* protected profile identity endpoint (`/me`)
* forgot-password email workflow with 6-digit code and expiry

### AI Learning Tools

* tutoring chat endpoint (`/chat`)
* quiz generation endpoint (`/generate-quiz`) returning structured MCQs
* upload-based text extraction and AI summarization (`/extract-text-from-image`)

### Saved Texts

* save AI-generated text to MongoDB (`/save-text-to-profile`)
* fetch saved texts by logged-in user (`/get-saved-texts`)
* delete saved text by id with ownership checks (`/delete-saved-text/{text_id}`)

### Friends System

* send friend requests
* view incoming friend requests
* accept pending friend requests
* list friends
* unfriend existing friends

---

## Data Storage

### PostgreSQL

* users
* friend_requests
* friendships

### MongoDB

* saved profile texts (stored in `users` collection with username linkage)

---

## Testing

Current backend tests (`backend/tests/test.py`) cover:

* login error handling
* payload validation behavior
* base endpoint responses

Frontend repository also includes unit and e2e test tooling (Vitest and Cypress).

---

