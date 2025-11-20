"""Tests for best practices endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_create_best_practice(client: TestClient, test_user, test_plant, test_category):
    """Test creating a best practice."""
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
            "remember_me": False
        }
    )
    token = login_response.json()["access_token"]
    
    # Update user with plant
    from app.models.user import User
    from app.database import SessionLocal
    db = SessionLocal()
    user = db.query(User).filter(User.id == test_user.id).first()
    user.plant_id = test_plant.id
    db.commit()
    db.close()
    
    # Create practice
    response = client.post(
        "/api/v1/best-practices",
        json={
            "title": "Test Practice",
            "description": "Test description",
            "category_id": str(test_category.id),
            "problem_statement": "Test problem",
            "solution": "Test solution",
            "status": "draft"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Practice"
    assert data["status"] == "draft"


def test_list_best_practices(client: TestClient, test_user):
    """Test listing best practices."""
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
            "remember_me": False
        }
    )
    token = login_response.json()["access_token"]
    
    # List practices
    response = client.get(
        "/api/v1/best-practices",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert isinstance(data["data"], list)

