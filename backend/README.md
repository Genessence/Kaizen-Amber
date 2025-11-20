# Amber Best Practice & Benchmarking Portal - Backend API

FastAPI backend for the Amber Best Practice & Benchmarking Portal.

## Tech Stack

- **Framework**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Azure Blob Storage
- **Migrations**: Alembic

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_SECRET_KEY: A secure random key
# - AZURE_STORAGE_CONNECTION_STRING: Your Azure storage credentials
```

### 3. Setup PostgreSQL Database

```bash
# Option 1: Using PostgreSQL CLI
createdb amber_bp

# Option 2: Using pgAdmin or any PostgreSQL client
# Create a database named 'amber_bp'
```

### 4. Run Database Migrations

```bash
# Apply migrations to create all tables
alembic upgrade head
```

### 5. Seed Initial Data

```bash
# Populate categories, plants, and default users
python app/seed_data.py
```

This will create:
- 8 categories (Safety, Quality, Productivity, Cost, Automation, Digitalisation, ESG, Other)
- 7 plants (Greater Noida, Kanchipuram, Rajpura, Shahjahanpur, Supa, Ranjangaon, Ponneri)
- Default HQ admin: `admin@amber.com` / `admin123`
- Default plant users: `{plantname}@amber.com` / `plant123`

⚠️ **IMPORTANT**: Change default passwords before production use!

### 6. Run Development Server

```bash
# Option 1: Using the run script
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/    # API endpoints
│   ├── core/                # Security, dependencies
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
├── tests/                   # Test suite
└── requirements.txt         # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Best Practices
- `GET /api/v1/best-practices` - List best practices
- `POST /api/v1/best-practices` - Create best practice
- `GET /api/v1/best-practices/{id}` - Get best practice details
- `PATCH /api/v1/best-practices/{id}` - Update best practice

### Benchmarking
- `POST /api/v1/benchmarking/benchmark/{id}` - Benchmark a practice
- `GET /api/v1/benchmarking/list` - List benchmarked practices

### Analytics
- `GET /api/v1/analytics/overview` - Dashboard overview
- `GET /api/v1/analytics/plant-performance` - Plant performance stats
- `GET /api/v1/analytics/cost-savings` - Cost savings analysis

### Leaderboard
- `GET /api/v1/leaderboard/current` - Current leaderboard
- `GET /api/v1/leaderboard/{plant_id}/breakdown` - Plant breakdown

## Testing

```bash
pytest
pytest --cov=app tests/
```

## Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## License

Proprietary - Amber Enterprises India Limited

