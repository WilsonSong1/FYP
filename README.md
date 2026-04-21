 AI Tutoring Application

**FastAPI · Ionic React · PostgreSQL · MongoDB Atlas · OpenRouter AI**

---

## Project Overview

This project is a **full-stack AI tutoring application** built for my Final Year Project.
It allows users to:

* Create an account (sign up)
* Log in securely
* Reset their password via email verification
* Chat with an AI tutor
* Store user credentials securely in a PostgreSQL database

The backend is built using **FastAPI**, while the frontend is built using **Ionic React**.
The AI functionality is powered via **OpenRouter (DeepSeek models)**.

---

## Tech Stack

### Backend

* **FastAPI** – REST API
* **PostgreSQL** – Database
* **SQLAlchemy** – ORM
* **Passlib + bcrypt** – Password hashing
* **JWT (python-jose)** – Authentication
* **OpenRouter API** – AI responses
* **SMTP (Gmail)** – Password reset emails

### Frontend

* **Ionic React**
* **React Router**
* **Fetch API**
* **CSS**

---

## Project Structure

```
FYP/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── auth.py
│   ├── schemas.py
│   ├── email_utils.py
│   ├── .env
│   └── venv/
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Login.tsx
    │   │   ├── Signup.tsx
    │   │   ├── ForgotPassword.tsx
    │   │   └── ResetPassword.tsx
    │   ├── App.tsx
    │   └── Home.css
    └── package.json
```

---

## Features Implemented

### Authentication

* User signup with hashed passwords
* Secure login with JWT tokens
* Password reset via email with 6-digit verification code
* Password expiration and validation

### AI Chat

* User-to-AI chat interface
* Messages sent to FastAPI backend
* AI responses generated via OpenRouter (DeepSeek)
* Chat displayed in a messenger-style UI

### Database

* PostgreSQL used for:

  * User credentials
  * Password reset codes
* Secure storage (no plaintext passwords)

---

##  How to Run the Project

### 1 Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pymongo
uvicorn main:app --reload
```

Add these environment variables in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=fyp
```

Backend will run at:

```
http://127.0.0.1:8000
```

---

### 2 Frontend Setup

```bash
cd frontend
npm install
ionic serve
```

Frontend will run at:

```
http://localhost:8100
```

---