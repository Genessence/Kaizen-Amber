"""Wrapper script to seed the database."""

import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Now import and run the seed script
from app.seed_data import seed_database

if __name__ == "__main__":
    seed_database()


