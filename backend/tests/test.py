from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth import hash_password
from database import Base
from main import app, get_db
from models import User

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def setup_test_user():
    db = TestingSessionLocal()
    db.add(
        User(
            username="validuser",
            email="validuser@example.com",
            password_hash=hash_password("correctpassword"),
        )
    )
    db.commit()
    db.close()


app.dependency_overrides[get_db] = override_get_db


def test_login_with_wrong_password_returns_400():
    Base.metadata.create_all(bind=engine)
    setup_test_user()

    client = TestClient(app)
    response = client.post(
        "/login",
        json={"username": "validuser", "password": "wrongpassword"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect password"

    Base.metadata.drop_all(bind=engine)


def test_login_with_wrong_username_returns_400():
    Base.metadata.create_all(bind=engine)
    setup_test_user()

    client = TestClient(app)
    response = client.post(
        "/login",
        json={"username": "unknownuser", "password": "correctpassword"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid username"

    Base.metadata.drop_all(bind=engine)
