# Amber Best Practice Portal - Complete Setup Guide

This guide will walk you through setting up the backend API from scratch.

## Prerequisites

- Python 3.10 or higher
- PostgreSQL 12 or higher
- Azure Storage Account
- Git (optional)

---

## Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn (web framework)
- SQLAlchemy and PostgreSQL driver
- Alembic (database migrations)
- Python-JOSE and Passlib (JWT authentication)
- Azure Storage Blob (file storage)
- Pytest (testing)

---

## Step 2: Setup PostgreSQL Database

### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL**: Download from https://www.postgresql.org/download/
2. **Create Database**:
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE amber_bp;
   \q
   
   # Or using createdb command
   createdb amber_bp
   ```

### Option B: Docker PostgreSQL

```bash
docker run --name amber-postgres \
  -e POSTGRES_DB=amber_bp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

---

## Step 3: Setup Azure Blob Storage

1. **Create Storage Account** in Azure Portal
2. **Create Containers**:
   - `best-practices` (for before/after images)
   - `supporting-documents` (for PDF files)
3. **Get Connection String**:
   - Azure Portal → Storage Account → Access Keys
   - Copy "Connection string"

---

## Step 4: Configure Environment Variables

Create `.env` file in the `backend` directory:

```env
# Application
APP_NAME=Amber Best Practice Portal
APP_VERSION=1.0.0
DEBUG=true
CORS_ORIGINS=["http://localhost:5173"]

# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/amber_bp

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-characters-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccountname;AccountKey=yourkey==;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=youraccountname
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents

# File Upload
MAX_IMAGE_SIZE_MB=10
MAX_DOCUMENT_SIZE_MB=20
ALLOWED_IMAGE_TYPES=["image/jpeg","image/png","image/jpg"]
ALLOWED_DOCUMENT_TYPES=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Generate Secure JWT Secret Key

```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## Step 5: Initialize Database

### Run Migrations

```bash
# Create all database tables
alembic upgrade head
```

This creates 11 tables:
- users
- plants
- categories
- best_practices
- practice_images
- practice_documents
- benchmarked_practices
- copied_practices
- practice_questions
- monthly_savings
- leaderboard_entries

---

## Step 6: Seed Initial Data

```bash
python app/seed_data.py
```

This populates:

### Categories (8)
- Safety, Quality, Productivity, Cost
- Automation, Digitalisation, ESG, Other

### Plants (7)
- Greater Noida (Ecotech 1)
- Kanchipuram
- Rajpura
- Shahjahanpur
- Supa
- Ranjangaon
- Ponneri

### Default Users

**HQ Admin:**
- Email: `admin@amber.com`
- Password: `admin123`
- Role: HQ Administrator

**Plant Users:**
- Email: `greaternoida@amber.com` (password: `plant123`)
- Email: `kanchipuram@amber.com` (password: `plant123`)
- Email: `rajpura@amber.com` (password: `plant123`)
- And so on for each plant...

⚠️ **Security Warning**: Change these default passwords immediately in production!

---

## Step 7: Start the Server

### Development Mode

```bash
# Option 1: Using run script (recommended)
python run.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at: `http://localhost:8000`

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Step 8: Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0"
}
```

### Access API Documentation

1. Open browser: `http://localhost:8000/docs`
2. You should see Swagger UI with all endpoints
3. Try the `/auth/login` endpoint with default credentials

### Test Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@amber.com",
    "password": "admin123",
    "remember_me": false
  }'
```

You should receive access and refresh tokens.

---

## Step 9: Connect Frontend

Update your frontend `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Update API calls in frontend to use the base URL.

---

## Common Issues & Solutions

### Issue: Database Connection Error

**Error**: `connection to server at "localhost" failed`

**Solutions**:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env
3. Ensure database `amber_bp` exists
4. Verify username/password are correct

### Issue: Alembic Migration Fails

**Error**: `Target database is not up to date`

**Solution**:
```bash
# Check current migration
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head
```

### Issue: Azure Storage Connection Fails

**Error**: `Unable to connect to Azure Storage`

**Solutions**:
1. Verify AZURE_STORAGE_CONNECTION_STRING is correct
2. Check if containers exist in Azure Portal
3. Verify storage account firewall settings
4. Test connection string format

### Issue: Import Errors

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```bash
# Ensure you're in the backend directory
cd backend

# Or add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"  # Linux/Mac
set PYTHONPATH=%PYTHONPATH%;%cd%  # Windows CMD
```

---

## Database Management

### Create New Migration

```bash
# After modifying models
alembic revision --autogenerate -m "Add new field"

# Review the generated migration file
# Apply migration
alembic upgrade head
```

### Rollback Migration

```bash
# Rollback one step
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>
```

### Reset Database (Development Only)

```bash
# Drop all tables
alembic downgrade base

# Recreate all tables
alembic upgrade head

# Reseed data
python app/seed_data.py
```

---

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
```

### Run with Coverage

```bash
pytest --cov=app tests/
```

---

## Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Set DEBUG=false in .env
- [ ] Use strong JWT_SECRET_KEY (32+ characters)
- [ ] Configure proper CORS_ORIGINS
- [ ] Setup Azure Storage with proper access controls
- [ ] Use environment variables (not .env file)
- [ ] Enable HTTPS
- [ ] Configure database connection pooling
- [ ] Setup logging and monitoring
- [ ] Run migrations on production database
- [ ] Seed initial data
- [ ] Configure reverse proxy (nginx/traefik)

### Environment Variables (Production)

Set these as system environment variables, not in .env file:

```bash
export DATABASE_URL="postgresql://user:pass@prod-db:5432/amber_bp"
export JWT_SECRET_KEY="your-production-secret-key"
export AZURE_STORAGE_CONNECTION_STRING="..."
export DEBUG="false"
export CORS_ORIGINS='["https://yourdomain.com"]'
```

### Run Production Server

```bash
# With Gunicorn (recommended)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Or with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Endpoints Overview

See `API_GUIDE.md` for detailed endpoint documentation.

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Best Practices
- `GET /api/v1/best-practices` - List (with filters)
- `POST /api/v1/best-practices` - Create
- `GET /api/v1/best-practices/{id}` - Get details
- `PATCH /api/v1/best-practices/{id}` - Update

### Benchmarking
- `POST /api/v1/benchmarking/benchmark/{id}` - Benchmark
- `GET /api/v1/benchmarking/list` - List benchmarked

### Copy & Implement
- `POST /api/v1/copy/implement` - Copy practice
- `GET /api/v1/copy/my-implementations` - My copies

### Analytics
- `GET /api/v1/analytics/overview` - Dashboard stats
- `GET /api/v1/analytics/plant-performance` - Plant stats
- `GET /api/v1/analytics/star-ratings` - Star ratings

### Leaderboard
- `GET /api/v1/leaderboard/current` - Leaderboard
- `GET /api/v1/leaderboard/{plant_id}/breakdown` - Details

### Questions
- `GET /api/v1/questions/practice/{id}` - Get Q&A
- `POST /api/v1/questions/practice/{id}` - Ask question
- `PATCH /api/v1/questions/{id}/answer` - Answer

---

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **API Guide**: See `API_GUIDE.md`
- **Frontend Documentation**: See `../amber-best-flow/DOCUMENTATION.md`

---

**Version**: 1.0.0  
**Last Updated**: November 20, 2025  
**Maintained By**: Development Team
