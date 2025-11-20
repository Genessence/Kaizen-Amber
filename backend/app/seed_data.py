"""Seed script to populate initial data."""

import uuid
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models.plant import Plant
from app.models.category import Category
from app.models.user import User
from app.core.security import get_password_hash


def create_categories(db: Session):
    """Create default categories."""
    categories = [
        {
            "name": "Safety",
            "slug": "safety",
            "color_class": "bg-red-50 text-red-700 border-red-200",
            "icon_name": "Shield"
        },
        {
            "name": "Quality",
            "slug": "quality",
            "color_class": "bg-blue-50 text-blue-700 border-blue-200",
            "icon_name": "Target"
        },
        {
            "name": "Productivity",
            "slug": "productivity",
            "color_class": "bg-purple-50 text-purple-700 border-purple-200",
            "icon_name": "Zap"
        },
        {
            "name": "Cost",
            "slug": "cost",
            "color_class": "bg-green-50 text-green-700 border-green-200",
            "icon_name": "IndianRupee"
        },
        {
            "name": "Automation",
            "slug": "automation",
            "color_class": "bg-amber-50 text-amber-700 border-amber-200",
            "icon_name": "Bot"
        },
        {
            "name": "Digitalisation",
            "slug": "digitalisation",
            "color_class": "bg-indigo-50 text-indigo-700 border-indigo-200",
            "icon_name": "Cpu"
        },
        {
            "name": "ESG",
            "slug": "esg",
            "color_class": "bg-emerald-50 text-emerald-700 border-emerald-200",
            "icon_name": "LineChart"
        },
        {
            "name": "Other",
            "slug": "other",
            "color_class": "bg-gray-50 text-gray-700 border-gray-200",
            "icon_name": "Settings"
        }
    ]
    
    print("Creating categories...")
    for cat_data in categories:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            print(f"  - Created category: {cat_data['name']}")
        else:
            print(f"  - Category already exists: {cat_data['name']}")
    
    db.commit()
    print("Categories created successfully!\n")


def create_plants(db: Session):
    """Create default plants."""
    plants = [
        {
            "name": "Greater Noida (Ecotech 1)",
            "short_name": "Greater Noida",
            "division": "Component"
        },
        {
            "name": "Kanchipuram",
            "short_name": "Kanchipuram",
            "division": "Component"
        },
        {
            "name": "Rajpura",
            "short_name": "Rajpura",
            "division": "Component"
        },
        {
            "name": "Shahjahanpur",
            "short_name": "Shahjahanpur",
            "division": "Component"
        },
        {
            "name": "Supa",
            "short_name": "Supa",
            "division": "Component"
        },
        {
            "name": "Ranjangaon",
            "short_name": "Ranjangaon",
            "division": "Component"
        },
        {
            "name": "Ponneri",
            "short_name": "Ponneri",
            "division": "Component"
        }
    ]
    
    print("Creating plants...")
    for plant_data in plants:
        existing = db.query(Plant).filter(Plant.name == plant_data["name"]).first()
        if not existing:
            plant = Plant(**plant_data, is_active=True)
            db.add(plant)
            print(f"  - Created plant: {plant_data['name']}")
        else:
            print(f"  - Plant already exists: {plant_data['name']}")
    
    db.commit()
    print("Plants created successfully!\n")


def create_default_admin(db: Session):
    """Create default HQ admin user."""
    print("Creating default admin user...")
    
    existing = db.query(User).filter(User.email == "admin@amber.com").first()
    if not existing:
        admin = User(
            email="admin@amber.com",
            hashed_password=get_password_hash("admin123"),  # Change in production!
            full_name="HQ Administrator",
            role="hq",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("  - Created admin user: admin@amber.com (password: admin123)")
        print("  - ⚠️  IMPORTANT: Change this password in production!")
    else:
        print("  - Admin user already exists")
    
    print()


def create_default_plant_users(db: Session):
    """Create default plant users for each plant."""
    print("Creating default plant users...")
    
    plants = db.query(Plant).all()
    
    for plant in plants:
        email = f"{plant.short_name.lower().replace(' ', '')}@amber.com"
        existing = db.query(User).filter(User.email == email).first()
        
        if not existing:
            user = User(
                email=email,
                hashed_password=get_password_hash("plant123"),  # Change in production!
                full_name=f"{plant.name} User",
                role="plant",
                plant_id=plant.id,
                is_active=True
            )
            db.add(user)
            print(f"  - Created plant user: {email} (password: plant123)")
        else:
            print(f"  - Plant user already exists: {email}")
    
    db.commit()
    print("Plant users created successfully!\n")


def seed_database():
    """Main seed function."""
    print("\n" + "="*60)
    print("  Amber Best Practice Portal - Database Seeding")
    print("="*60 + "\n")
    
    # Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!\n")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Seed data
        create_categories(db)
        create_plants(db)
        create_default_admin(db)
        create_default_plant_users(db)
        
        print("="*60)
        print("  Database seeding completed successfully!")
        print("="*60 + "\n")
        
        print("Default Credentials:")
        print("-" * 60)
        print("  HQ Admin:")
        print("    Email: admin@amber.com")
        print("    Password: admin123")
        print()
        print("  Plant Users (all plants):")
        print("    Email: {plantname}@amber.com")
        print("    Password: plant123")
        print("    Example: greaternoida@amber.com")
        print("-" * 60)
        print("\n⚠️  IMPORTANT: Change these passwords before production use!\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}\n")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

