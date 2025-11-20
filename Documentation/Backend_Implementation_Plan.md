# Backend API & Database Development Plan

## Overview

Build a FastAPI backend with PostgreSQL database and Azure Blob Storage integration to power the Amber Best Practice & Benchmarking Portal for Amber Enterprises India Limited.

## Tech Stack

- **Backend Framework**: Python/FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Azure Blob Storage
- **Migration Tool**: Alembic
- **No Database Enums**: All validations in Pydantic schemas

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Backend Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration & environment variables
│   ├── database.py             # Database connection setup
│   ├── models/                 # SQLAlchemy models (no enums)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── category.py
│   │   ├── best_practice.py
│   │   ├── practice_image.py
│   │   ├── benchmarked_practice.py
│   │   ├── copied_practice.py
│   │   ├── practice_question.py
│   │   ├── monthly_savings.py
│   │   └── leaderboard_entry.py
│   ├── schemas/                # Pydantic schemas with Literal validation
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── plant.py
│   │   ├── category.py
│   │   ├── best_practice.py
│   │   ├── benchmarking.py
│   │   ├── copy.py
│   │   ├── question.py
│   │   ├── analytics.py
│   │   └── leaderboard.py
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── plants.py
│   │   │   │   ├── categories.py
│   │   │   │   ├── best_practices.py
│   │   │   │   ├── analytics.py
│   │   │   │   ├── benchmarking.py
│   │   │   │   ├── copy.py
│   │   │   │   ├── questions.py
│   │   │   │   └── leaderboard.py
│   │   │   └── api.py          # API router aggregation
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── dependencies.py     # FastAPI dependencies (auth, rbac)
│   │   └── azure_storage.py    # Azure Blob Storage client
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── best_practice_service.py
│   │   ├── benchmarking_service.py
│   │   ├── leaderboard_service.py
│   │   ├── analytics_service.py
│   │   └── savings_calculator.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── currency.py         # Lakhs/Crores formatting
│       └── date_helpers.py
├── alembic/                    # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_best_practices.py
│   └── test_analytics.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
└── pytest.ini
```

### 1.2 Install Dependencies

```txt
# Core
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0

# Database
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Azure
azure-storage-blob==12.19.0
azure-identity==1.15.0

# Testing
pytest==7.4.4
pytest-asyncio==0.21.1
httpx==0.26.0

# Utilities
python-dateutil==2.8.2
```

---

## Phase 2: Database Schema Design

### 2.1 Core Tables (All fields use VARCHAR instead of enums)

**users**

- id (UUID, PK)
- email (VARCHAR, unique, indexed)
- hashed_password (VARCHAR)
- full_name (VARCHAR)
- role (VARCHAR: 'plant' | 'hq' - validated in Pydantic)
- plant_id (UUID, FK, nullable for HQ users)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

**plants**

- id (UUID, PK)
- name (VARCHAR, e.g., "Greater Noida (Ecotech 1)")
- short_name (VARCHAR, e.g., "Greater Noida")
- division (VARCHAR, e.g., "Component")
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

**categories**

- id (UUID, PK)
- name (VARCHAR: Safety, Quality, Productivity, Cost, Automation, Digitalisation, ESG, Other)
- slug (VARCHAR, unique, indexed)
- color_class (VARCHAR, UI color styling)
- icon_name (VARCHAR, Lucide icon name)
- created_at (TIMESTAMP WITH TIME ZONE)

**best_practices**

- id (UUID, PK)
- title (VARCHAR, indexed for search)
- description (TEXT)
- category_id (UUID, FK → categories)
- submitted_by_user_id (UUID, FK → users)
- plant_id (UUID, FK → plants)
- problem_statement (TEXT)
- solution (TEXT)
- benefits (JSONB, array of strings)
- metrics (TEXT)
- implementation (TEXT)
- investment (TEXT)
- savings_amount (NUMERIC(12,2))
- savings_currency (VARCHAR: 'lakhs' | 'crores' - validated in Pydantic)
- savings_period (VARCHAR: 'monthly' | 'annually' - validated in Pydantic)
- area_implemented (VARCHAR)
- status (VARCHAR: 'draft' | 'submitted' | 'approved' | 'revision_required' - validated in Pydantic)
- submitted_date (DATE, indexed)
- is_deleted (BOOLEAN, default false, for soft delete)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

**practice_images**

- id (UUID, PK)
- practice_id (UUID, FK → best_practices, ON DELETE CASCADE)
- image_type (VARCHAR: 'before' | 'after' - validated in Pydantic)
- blob_container (VARCHAR, Azure container name)
- blob_name (VARCHAR, Azure blob file name)
- blob_url (TEXT, public/SAS URL)
- file_size (INTEGER, bytes)
- content_type (VARCHAR, MIME type)
- uploaded_at (TIMESTAMP WITH TIME ZONE)

**practice_documents**

- id (UUID, PK)
- practice_id (UUID, FK → best_practices, ON DELETE CASCADE)
- document_name (VARCHAR, original filename)
- blob_container (VARCHAR)
- blob_name (VARCHAR)
- blob_url (TEXT)
- file_size (INTEGER)
- content_type (VARCHAR)
- uploaded_at (TIMESTAMP WITH TIME ZONE)

**benchmarked_practices**

- id (UUID, PK)
- practice_id (UUID, FK → best_practices, unique, indexed)
- benchmarked_by_user_id (UUID, FK → users)
- benchmarked_date (DATE)
- created_at (TIMESTAMP WITH TIME ZONE)

**copied_practices**

- id (UUID, PK)
- original_practice_id (UUID, FK → best_practices)
- copied_practice_id (UUID, FK → best_practices)
- copying_plant_id (UUID, FK → plants)
- copied_date (DATE)
- implementation_status (VARCHAR: 'planning' | 'in_progress' | 'completed' - validated in Pydantic)
- created_at (TIMESTAMP WITH TIME ZONE)
- INDEX on (original_practice_id, copying_plant_id)

**practice_questions**

- id (UUID, PK)
- practice_id (UUID, FK → best_practices, ON DELETE CASCADE, indexed)
- asked_by_user_id (UUID, FK → users)
- question_text (TEXT)
- answer_text (TEXT, nullable)
- answered_by_user_id (UUID, FK → users, nullable)
- answered_at (TIMESTAMP WITH TIME ZONE, nullable)
- created_at (TIMESTAMP WITH TIME ZONE)

**monthly_savings**

- id (UUID, PK)
- plant_id (UUID, FK → plants, indexed)
- year (INTEGER)
- month (INTEGER, 1-12)
- total_savings (NUMERIC(12,2))
- savings_currency (VARCHAR: 'lakhs' | 'crores')
- practice_count (INTEGER)
- stars (INTEGER, 0-5)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
- UNIQUE (plant_id, year, month)

**leaderboard_entries**

- id (UUID, PK)
- plant_id (UUID, FK → plants, indexed)
- year (INTEGER)
- total_points (INTEGER, default 0)
- origin_points (INTEGER, default 0)
- copier_points (INTEGER, default 0)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
- UNIQUE (plant_id, year)

### 2.2 Database Indexes

```sql
-- Search & filtering
CREATE INDEX idx_best_practices_title ON best_practices USING gin(to_tsvector('english', title));
CREATE INDEX idx_best_practices_plant_date ON best_practices(plant_id, submitted_date DESC);
CREATE INDEX idx_best_practices_category ON best_practices(category_id);
CREATE INDEX idx_best_practices_status ON best_practices(status) WHERE is_deleted = false;

-- Benchmarking queries
CREATE INDEX idx_benchmarked_practices_date ON benchmarked_practices(benchmarked_date DESC);

-- Q&A queries
CREATE INDEX idx_practice_questions_practice ON practice_questions(practice_id, created_at DESC);

-- Analytics queries
CREATE INDEX idx_monthly_savings_plant_year ON monthly_savings(plant_id, year, month DESC);
CREATE INDEX idx_leaderboard_year_points ON leaderboard_entries(year, total_points DESC);
```

---

## Phase 3: Authentication System

### 3.1 JWT Authentication Implementation

**Core Security Features**:

- Password hashing with bcrypt (10 rounds)
- JWT access tokens (30 minutes expiry)
- JWT refresh tokens (7 days expiry)
- Token blacklisting support
- Role-based access control (RBAC) decorators

**Security Utilities** (`core/security.py`):

```python
from typing import Literal

UserRole = Literal["plant", "hq"]

def verify_password(plain_password: str, hashed_password: str) -> bool
def get_password_hash(password: str) -> str
def create_access_token(data: dict, expires_delta: timedelta) -> str
def create_refresh_token(data: dict) -> str
def verify_token(token: str) -> dict
```

**RBAC Dependencies** (`core/dependencies.py`):

```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User
async def require_hq_admin(current_user: User = Depends(get_current_active_user)) -> User
async def require_plant_user(current_user: User = Depends(get_current_active_user)) -> User
```

### 3.2 Auth Endpoints (`api/v1/endpoints/auth.py`)

```
POST   /api/v1/auth/register       # Register new user (requires invite token or HQ approval)
POST   /api/v1/auth/login          # Login (returns access + refresh tokens)
POST   /api/v1/auth/refresh        # Refresh access token using refresh token
POST   /api/v1/auth/logout         # Logout (blacklist tokens)
GET    /api/v1/auth/me             # Get current user profile with plant info
PATCH  /api/v1/auth/me             # Update current user profile
POST   /api/v1/auth/change-password # Change password
```

---

## Phase 4: Core API Endpoints

### 4.1 Plants API (`api/v1/endpoints/plants.py`)

```
GET    /api/v1/plants                    # List all plants (with is_active filter)
GET    /api/v1/plants/{id}               # Get plant details with stats
GET    /api/v1/plants/active             # Get active plants only
GET    /api/v1/plants/inactive           # Get inactive plants (HQ only)
POST   /api/v1/plants                    # Create plant (HQ only)
PATCH  /api/v1/plants/{id}               # Update plant (HQ only)
PATCH  /api/v1/plants/{id}/activate      # Activate plant (HQ only)
PATCH  /api/v1/plants/{id}/deactivate    # Deactivate plant (HQ only)
```

### 4.2 Categories API (`api/v1/endpoints/categories.py`)

```
GET    /api/v1/categories          # List all categories
GET    /api/v1/categories/{id}     # Get category details with BP count
POST   /api/v1/categories          # Create category (HQ only)
PATCH  /api/v1/categories/{id}     # Update category (HQ only)
```

### 4.3 Best Practices API (`api/v1/endpoints/best_practices.py`)

```
GET    /api/v1/best-practices                    # List with filters & pagination
       Query params: 
       - category_id, plant_id, status, search (text)
       - start_date, end_date
       - is_benchmarked (bool)
       - limit (default 20), offset (default 0)
       - sort_by (submitted_date, title), sort_order (asc, desc)

GET    /api/v1/best-practices/{id}               # Get single BP with all details
POST   /api/v1/best-practices                    # Create new BP
PATCH  /api/v1/best-practices/{id}               # Update BP (owner or HQ only)
DELETE /api/v1/best-practices/{id}               # Soft delete BP (owner or HQ only)

GET    /api/v1/best-practices/my-practices       # Get current user's plant BPs
GET    /api/v1/best-practices/recent             # Recent BPs (last 10)
GET    /api/v1/best-practices/{id}/statistics    # View count, copy count, Q&A count
```

### 4.4 Benchmarking API (`api/v1/endpoints/benchmarking.py`)

```
POST   /api/v1/benchmarking/benchmark/{id}      # Benchmark a BP (HQ only)
       - Creates benchmarked_practices entry
       - Updates leaderboard for origin plant (+10 points potential)

DELETE /api/v1/benchmarking/unbenchmark/{id}    # Remove benchmark (HQ only)
       - Deletes benchmarked_practices entry
       - Recalculates leaderboard

GET    /api/v1/benchmarking/list                # List all benchmarked BPs
       Query params: plant_id, category_id, limit, offset

GET    /api/v1/benchmarking/recent              # Recent benchmarked BPs (last 10)

GET    /api/v1/benchmarking/{id}/copies         # Get plants that copied this BP
       Returns: list of copying plants with dates

GET    /api/v1/benchmarking/total-count         # Total benchmarked BPs count

GET    /api/v1/benchmarking/copy-spread         # Horizontal deployment status
       Returns: BPs with origin plant and copy count
```

### 4.5 Copy & Implement API (`api/v1/endpoints/copy.py`)

```
POST   /api/v1/copy/implement                   # Copy and implement a benchmarked BP
       Body: {
         original_practice_id: UUID,
         customized_title: str (optional),
         customized_solution: str (optional),
         implementation_status: str
       }
       - Creates new best_practice with copied data
       - Creates copied_practices entry
       - Updates leaderboard:
         - Origin plant: +10 points (if not already awarded)
         - Copying plant: +5 points

GET    /api/v1/copy/my-implementations          # Get BPs copied by current user's plant

GET    /api/v1/copy/deployment-status           # Horizontal deployment status
       Query params: limit, offset
       Returns: BPs with copy counts and plant list

GET    /api/v1/copy/{original_id}/copies        # Get all copies of a specific BP
```

### 4.6 Analytics API (`api/v1/endpoints/analytics.py`)

```
GET    /api/v1/analytics/overview               # Dashboard overview stats
       For Plant User: only their plant
       For HQ Admin: company-wide
       Returns: {
         monthly_count: int,
         ytd_count: int,
         monthly_savings: decimal,
         ytd_savings: decimal,
         stars: int,
         benchmarked_count: int
       }

GET    /api/v1/analytics/plant-performance      # Plant-wise BP submissions
       Query params: period (yearly|monthly), year, month (if monthly)
       Returns: list of plants with submission counts

GET    /api/v1/analytics/category-breakdown     # Category-wise BP counts
       Query params: plant_id (optional), year (optional)
       Returns: category counts

GET    /api/v1/analytics/cost-savings           # Cost savings by plant
       Query params: period (yearly|monthly), currency (lakhs|crores)
       Returns: plant-wise savings data

GET    /api/v1/analytics/cost-analysis          # Detailed cost analysis
       Returns: {
         current_month_breakdown: [{plant, savings}],
         ytd_breakdown: [{plant, savings}],
         monthly_trends: [{month, plant, savings}]
       }

GET    /api/v1/analytics/cost-analysis/{plant_id}/monthly
       # Monthly cost breakdown for a specific plant
       Returns: list of months with practices and savings

GET    /api/v1/analytics/star-ratings           # Star ratings based on savings
       Returns: [{plant, monthly_savings, ytd_savings, stars}]

GET    /api/v1/analytics/star-ratings/{plant_id}/monthly-trend
       # Monthly savings and stars trend for a plant
       Returns: 12-month trend

GET    /api/v1/analytics/benchmark-stats        # Benchmark BPs per plant (current month)
       Returns: [{plant, benchmarked_count}]
```

### 4.7 Leaderboard API (`api/v1/endpoints/leaderboard.py`)

```
GET    /api/v1/leaderboard/current              # Current year leaderboard
       Query params: year (optional, defaults to current)
       Returns: [{
         plant_id, plant_name,
         total_points, origin_points, copier_points,
         rank,
         breakdown: [{type: "Origin"|"Copier", points, date, bp_title}]
       }]

GET    /api/v1/leaderboard/{plant_id}/breakdown # Detailed breakdown for a plant
       Returns: {
         copied: [{bp_title, points, date}],
         originated: [{bp_title, copies_count, points}]
       }

POST   /api/v1/leaderboard/recalculate          # Recalculate leaderboard (HQ only)
       Recalculates all points from scratch
```

### 4.8 Questions API (`api/v1/endpoints/questions.py`)

```
GET    /api/v1/questions/practice/{id}          # Get Q&A for a practice
       Returns: list of questions with answers (sorted by date)

POST   /api/v1/questions/practice/{id}          # Ask a question
       Body: {question_text: str}

PATCH  /api/v1/questions/{id}/answer            # Answer a question
       Body: {answer_text: str}
       Authorization: practice owner or HQ admin

DELETE /api/v1/questions/{id}                   # Delete question
       Authorization: question asker or HQ admin
```

### 4.9 Users API (`api/v1/endpoints/users.py`)

```
GET    /api/v1/users                    # List users (HQ only)
GET    /api/v1/users/{id}               # Get user details (HQ only)
PATCH  /api/v1/users/{id}               # Update user (HQ only)
PATCH  /api/v1/users/{id}/activate      # Activate user (HQ only)
PATCH  /api/v1/users/{id}/deactivate    # Deactivate user (HQ only)
```

---

## Phase 5: Azure Blob Storage Integration

### 5.1 Azure Storage Client Setup (`core/azure_storage.py`)

**Configuration**:

```python
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
AZURE_STORAGE_CONTAINER_PRACTICES = "best-practices"
AZURE_STORAGE_CONTAINER_DOCUMENTS = "supporting-documents"
```

**Client Functions**:

```python
async def upload_blob(container: str, blob_name: str, data: bytes, content_type: str) -> str
async def delete_blob(container: str, blob_name: str) -> bool
async def generate_sas_url(container: str, blob_name: str, expiry_hours: int = 24) -> str
async def get_blob_properties(container: str, blob_name: str) -> dict
```

**Blob Naming Convention**:

- Practices images: `practices/{practice_id}/{type}_{timestamp}.{ext}`
        - Example: `practices/a1b2c3.../before_1234567890.jpg`
- Documents: `documents/{practice_id}/{filename}_{timestamp}.{ext}`

### 5.2 File Upload Flow

**Two-Step Upload Process**:

1. **Request Pre-Signed Upload URL**:
   ```
   POST /api/v1/upload/presigned-url
   Body: {
     practice_id: UUID,
     file_type: "image" | "document",
     image_type: "before" | "after" (if file_type is image),
     filename: str,
     content_type: str,
     file_size: int
   }
   Response: {
     upload_url: str (SAS URL),
     blob_name: str,
     container: str,
     expiry: datetime
   }
   ```

2. **Confirm Upload**:
   ```
   POST /api/v1/best-practices/{id}/images
   Body: {
     image_type: "before" | "after",
     blob_name: str,
     blob_container: str,
     file_size: int,
     content_type: str
   }
   ```


**Direct Upload Alternative**:

```
POST /api/v1/best-practices/{id}/upload-image
Content-Type: multipart/form-data
Form: {
  image_type: "before" | "after",
  file: binary
}
# Backend handles direct upload to Azure
```

### 5.3 Image & Document Endpoints

```
POST   /api/v1/upload/presigned-url         # Get pre-signed URL for upload
POST   /api/v1/best-practices/{id}/images   # Confirm image upload
POST   /api/v1/best-practices/{id}/documents # Confirm document upload
DELETE /api/v1/best-practices/{id}/images/{image_id} # Delete image
DELETE /api/v1/best-practices/{id}/documents/{doc_id} # Delete document
GET    /api/v1/best-practices/{id}/images   # List all images
GET    /api/v1/best-practices/{id}/documents # List all documents
```

---

## Phase 6: Business Logic & Calculations

### 6.1 Leaderboard Point System (`services/leaderboard_service.py`)

**Points Allocation**:

- **Origin Points**: 10 points per benchmarked BP when it gets copied
        - Only awarded once per BP, not for each copy
        - Awarded when first copy is made
- **Copier Points**: 5 points per benchmarked BP copied
        - Awarded to each plant that copies

**Calculation Logic**:

```python
async def update_leaderboard_on_benchmark(practice_id: UUID):
    # When BP is benchmarked, prepare for future origin points
    pass

async def update_leaderboard_on_copy(original_practice_id: UUID, copying_plant_id: UUID):
    # Award points to both origin and copier plants
    # Origin: +10 (if first copy)
    # Copier: +5
    pass

async def recalculate_full_leaderboard(year: int):
    # Recalculate from scratch for data integrity
    pass
```

### 6.2 Star Rating System (`services/savings_calculator.py`)

**Star Calculation Algorithm**:

```python
def calculate_stars(monthly_savings: Decimal, ytd_savings: Decimal) -> int:
    # Both thresholds must be met
    if ytd_savings > 200 and monthly_savings > 16:
        return 5
    elif 150 <= ytd_savings <= 200 and 12 <= monthly_savings <= 16:
        return 4
    elif 100 <= ytd_savings <= 150 and 8 <= monthly_savings <= 12:
        return 3
    elif 50 <= ytd_savings <= 100 and 4 <= monthly_savings <= 8:
        return 2
    elif ytd_savings > 50 and monthly_savings > 4:
        return 1
    return 0
```

**Note**: All values in Lakhs (L)

### 6.3 Monthly Savings Aggregation

**Scheduled Job** (can use APScheduler or manual trigger):

```python
async def aggregate_monthly_savings(year: int, month: int):
    # For each plant
    # 1. Sum savings_amount from all approved BPs submitted in that month
    # 2. Count number of BPs
    # 3. Calculate stars based on monthly and YTD totals
    # 4. Upsert into monthly_savings table
    pass
```

**Trigger Points**:

- Scheduled job (e.g., daily or end of month)
- Manual trigger via API endpoint (HQ only)
- Real-time update when BP status changes to approved

### 6.4 Currency Formatting Utilities (`utils/currency.py`)

**Formatting Rules** (following frontend logic):

```python
def format_currency(amount: Decimal, decimal_places: int, currency_format: str) -> str:
    # Lakhs format:
    #   - < 100L: 2 decimal places (truncated)
    #   - >= 100L: 1 decimal place (truncated)
    # Crores format: always 2 decimal places (truncated)
    # NO ROUNDING - truncate only
    pass

def convert_to_crores(lakhs: Decimal) -> Decimal:
    return lakhs / 100

def truncate_decimal(value: Decimal, places: int) -> Decimal:
    # Truncate without rounding
    pass
```

---

## Phase 7: Testing & Documentation

### 7.1 API Testing (`tests/`)

**Test Categories**:

- **Unit Tests**: Models, schemas, utilities
- **Integration Tests**: Endpoints with database
- **Authentication Tests**: JWT, RBAC
- **File Upload Tests**: Azure Blob Storage mocking
- **Business Logic Tests**: Leaderboard calculations, star ratings

**Test Coverage Goal**: 80%+

**Sample Test Structure**:

```python
# tests/test_best_practices.py
async def test_create_best_practice(client: AsyncClient, auth_headers: dict):
async def test_list_best_practices_with_filters(client: AsyncClient):
async def test_copy_implement_updates_leaderboard(client: AsyncClient):
async def test_benchmark_bp_requires_hq_admin(client: AsyncClient):
```

### 7.2 API Documentation

**Auto-Generated**:

- FastAPI built-in Swagger UI at `/docs`
- ReDoc at `/redoc`
- OpenAPI JSON schema at `/openapi.json`

**Custom Documentation**:

- `README.md`: Setup instructions
- `API_GUIDE.md`: Endpoint examples and workflows
- `DEPLOYMENT.md`: Production deployment guide

---

## Phase 8: Deployment Preparation

### 8.1 Environment Configuration (`.env`)

```env
# Application
APP_NAME=Amber Best Practice Portal
APP_VERSION=1.0.0
DEBUG=false
CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/amber_bp
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=youraccount
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents

# File Upload
MAX_IMAGE_SIZE_MB=10
MAX_DOCUMENT_SIZE_MB=20
ALLOWED_IMAGE_TYPES=["image/jpeg","image/png","image/jpg"]
ALLOWED_DOCUMENT_TYPES=["application/pdf","application/msword"]

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 8.2 Database Migrations

**Alembic Setup**:

```bash
# Initialize
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

**Migration Best Practices**:

- Always review auto-generated migrations
- Add data migrations separately
- Test migrations on staging first
- Keep migrations reversible

### 8.3 Docker Setup (Optional)

**Dockerfile**:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: amber_bp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## Implementation Priority & Phases

### Phase 1 (Foundation) - Week 1

- Setup project structure
- Database models and migrations
- Authentication system
- Basic CRUD for users and plants

### Phase 2 (Core Features) - Week 2

- Best practices CRUD
- Azure Blob Storage integration
- Image upload functionality
- Categories management

### Phase 3 (Advanced Features) - Week 3

- Benchmarking system
- Copy & implement functionality
- Leaderboard calculations
- Q&A system

### Phase 4 (Analytics) - Week 4

- Analytics endpoints
- Savings calculations
- Star ratings
- Monthly aggregations

### Phase 5 (Testing & Polish) - Week 5

- Comprehensive testing
- Documentation
- Performance optimization
- Deployment preparation

---

## Key Implementation Notes

1. **No Database Enums**: All enum-like fields use VARCHAR with Pydantic Literal validation
2. **Azure Blob Storage**: Replace all S3 references with Azure Blob Storage
3. **Soft Deletes**: Best practices use `is_deleted` flag instead of hard delete
4. **Pagination**: All list endpoints support limit/offset pagination
5. **RBAC**: Strict role-based access control on all endpoints
6. **Currency Formatting**: Lakhs/Crores with truncation (no rounding)
7. **Star Ratings**: Based on both monthly AND YTD thresholds
8. **Leaderboard**: Origin points awarded once when first copied
9. **Search**: Full-text search on best practice titles
10. **Indexes**: Strategic indexes for performance on large datasets

---

## API Response Format Standards

**Success Response**:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {...}
  }
}
```

**Paginated Response**:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

This comprehensive plan covers all features from the documentation and is ready for implementation with PostgreSQL (no enums) and Azure Blob Storage.