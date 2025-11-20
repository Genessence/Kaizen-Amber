"""Pytest configuration and fixtures."""

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db() -> Generator:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db: TestingSessionLocal) -> TestClient:
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def test_user(db: TestingSessionLocal):
    """Create a test user."""
    from app.models.user import User
    from app.core.security import get_password_hash
    
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        role="plant",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_plant(db: TestingSessionLocal):
    """Create a test plant."""
    from app.models.plant import Plant
    
    plant = Plant(
        name="Test Plant",
        short_name="Test",
        division="Component",
        is_active=True
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@pytest.fixture
def test_category(db: TestingSessionLocal):
    """Create a test category."""
    from app.models.category import Category
    
    category = Category(
        name="Quality",
        slug="quality",
        color_class="bg-blue-50 text-blue-700",
        icon_name="CheckCircle"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

