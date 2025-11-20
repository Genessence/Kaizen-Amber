"""Tests for analytics endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_get_overview(client: TestClient, test_user, test_plant):
    """Test dashboard overview."""
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
    
    # Get overview
    response = client.get(
        "/api/v1/analytics/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "monthly_count" in data
    assert "ytd_count" in data
    assert "stars" in data


def test_get_category_breakdown(client: TestClient, test_user):
    """Test category breakdown."""
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
    
    # Get category breakdown
    response = client.get(
        "/api/v1/analytics/category-breakdown",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

