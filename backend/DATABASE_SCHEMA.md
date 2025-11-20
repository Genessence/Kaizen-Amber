# Database Schema Documentation

Complete database schema for Amber Best Practice Portal.

## Overview

- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Total Tables**: 11
- **Design Philosophy**: No database enums (VARCHAR with Pydantic validation)

---

## Entity Relationship Diagram

```
┌──────────────┐          ┌──────────────────┐
│   plants     │◄─────────│     users        │
└──────────────┘          └──────────────────┘
       ▲                           │
       │                           │
       │                           │ submitted_by
       │ plant_id                  │
       │                           ▼
       │                  ┌──────────────────┐
       │                  │ best_practices   │
       │                  └──────────────────┘
       │                    │ │ │        │
       │                    │ │ │        └───────────────┐
       │                    │ │ │                        │
       │       ┌────────────┘ │ └──────────┐             │
       │       │              │            │             │
       │       ▼              ▼            ▼             ▼
       │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  │ images  │  │documents │  │questions │  │benchmarked│
       │  └─────────┘  └──────────┘  └──────────┘  └──────────┘
       │                                                  │
       │                                                  │
       │                  ┌───────────────────────────────┘
       │                  │ original_practice
       │                  ▼
       │           ┌──────────────┐
       └───────────│copied_practices│
  copying_plant    └──────────────┘

       ┌──────────────┐
       │monthly_savings│
       └──────────────┘
              ▲
              │ plant_id
              │
       ┌──────────────┐
       │leaderboard_   │
       │  entries     │
       └──────────────┘
```

---

## Tables

### 1. users

Stores user accounts for both plant users and HQ administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| email | VARCHAR | UNIQUE, NOT NULL, Index | User email |
| hashed_password | VARCHAR | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR | NOT NULL | User's full name |
| role | VARCHAR | NOT NULL | 'plant' or 'hq' |
| plant_id | UUID | FK(plants.id), NULL | Associated plant (NULL for HQ) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_users_id` on (id)
- `ix_users_email` on (email) UNIQUE

**Validation (Pydantic):**
- role: Must be 'plant' or 'hq'
- plant_id: Required for role='plant'

---

### 2. plants

Manufacturing plants across the organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| name | VARCHAR | NOT NULL | Full plant name |
| short_name | VARCHAR | NOT NULL | Short display name |
| division | VARCHAR | NOT NULL | Division (e.g., "Component") |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_plants_id` on (id)

**Example Data:**
- Greater Noida (Ecotech 1)
- Kanchipuram
- Rajpura

---

### 3. categories

Best practice categories for classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| name | VARCHAR | NOT NULL | Category name |
| slug | VARCHAR | UNIQUE, NOT NULL, Index | URL-friendly slug |
| color_class | VARCHAR | NOT NULL | Tailwind CSS color class |
| icon_name | VARCHAR | NOT NULL | Lucide icon name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `ix_categories_id` on (id)
- `ix_categories_slug` on (slug) UNIQUE

**Fixed Categories:**
- Safety, Quality, Productivity, Cost
- Automation, Digitalisation, ESG, Other

---

### 4. best_practices

Core table for best practice submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| title | VARCHAR | NOT NULL, Index | Practice title |
| description | TEXT | NOT NULL | Short description |
| category_id | UUID | FK(categories.id), NOT NULL | Category reference |
| submitted_by_user_id | UUID | FK(users.id), NOT NULL | Submitter reference |
| plant_id | UUID | FK(plants.id), NOT NULL | Plant reference |
| problem_statement | TEXT | NOT NULL | Problem description |
| solution | TEXT | NOT NULL | Solution description |
| benefits | JSONB | NULL | Array of benefit strings |
| metrics | TEXT | NULL | Metrics and KPIs |
| implementation | TEXT | NULL | Implementation details |
| investment | TEXT | NULL | Investment information |
| savings_amount | NUMERIC(12,2) | NULL | Savings amount |
| savings_currency | VARCHAR | NULL | 'lakhs' or 'crores' |
| savings_period | VARCHAR | NULL | 'monthly' or 'annually' |
| area_implemented | VARCHAR | NULL | Implementation area |
| status | VARCHAR | NOT NULL, DEFAULT 'draft' | Status |
| submitted_date | DATE | NULL, Index | Submission date |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_best_practices_id` on (id)
- `ix_best_practices_title` on (title)
- `ix_best_practices_submitted_date` on (submitted_date)
- `idx_best_practices_plant_date` on (plant_id, submitted_date DESC)
- `idx_best_practices_category` on (category_id)
- `idx_best_practices_status` on (status) WHERE is_deleted = false

**Validation (Pydantic):**
- status: 'draft', 'submitted', 'approved', 'revision_required'
- savings_currency: 'lakhs', 'crores'
- savings_period: 'monthly', 'annually'

---

### 5. practice_images

Before/after images stored in Azure Blob Storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| practice_id | UUID | FK(best_practices.id) CASCADE, NOT NULL | Practice reference |
| image_type | VARCHAR | NOT NULL | 'before' or 'after' |
| blob_container | VARCHAR | NOT NULL | Azure container name |
| blob_name | VARCHAR | NOT NULL | Azure blob name/path |
| blob_url | TEXT | NOT NULL | Public/SAS URL |
| file_size | INTEGER | NOT NULL | File size in bytes |
| content_type | VARCHAR | NOT NULL | MIME type |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT now() | Upload timestamp |

**Validation (Pydantic):**
- image_type: 'before', 'after'
- content_type: Must be in ALLOWED_IMAGE_TYPES

---

### 6. practice_documents

Supporting documents (PDFs, etc.) stored in Azure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| practice_id | UUID | FK(best_practices.id) CASCADE, NOT NULL | Practice reference |
| document_name | VARCHAR | NOT NULL | Original filename |
| blob_container | VARCHAR | NOT NULL | Azure container |
| blob_name | VARCHAR | NOT NULL | Azure blob name |
| blob_url | TEXT | NOT NULL | Public/SAS URL |
| file_size | INTEGER | NOT NULL | File size in bytes |
| content_type | VARCHAR | NOT NULL | MIME type |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT now() | Upload timestamp |

---

### 7. benchmarked_practices

Tracks which practices are benchmarked (exceptional).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| practice_id | UUID | FK(best_practices.id), UNIQUE, NOT NULL | Practice reference |
| benchmarked_by_user_id | UUID | FK(users.id), NOT NULL | HQ admin who benchmarked |
| benchmarked_date | DATE | NOT NULL | Benchmarking date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `ix_benchmarked_practices_id` on (id)
- `ix_benchmarked_practices_practice_id` on (practice_id) UNIQUE
- `idx_benchmarked_practices_date` on (benchmarked_date DESC)

**Business Rules:**
- Only HQ admins can benchmark
- Each practice can only be benchmarked once
- Benchmarked practices can be copied by other plants

---

### 8. copied_practices

Tracks when practices are copied between plants.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| original_practice_id | UUID | FK(best_practices.id), NOT NULL | Original BP |
| copied_practice_id | UUID | FK(best_practices.id), NOT NULL | New copied BP |
| copying_plant_id | UUID | FK(plants.id), NOT NULL | Plant that copied |
| copied_date | DATE | NOT NULL | Copy date |
| implementation_status | VARCHAR | NOT NULL, DEFAULT 'planning' | Status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `ix_copied_practices_id` on (id)
- `idx_copied_practices_original_plant` on (original_practice_id, copying_plant_id)

**Validation (Pydantic):**
- implementation_status: 'planning', 'in_progress', 'completed'

**Business Rules:**
- Only benchmarked practices can be copied
- Creates new best_practice entry for copying plant
- Updates leaderboard (origin +10 pts first time, copier +5 pts)

---

### 9. practice_questions

Q&A system for best practices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| practice_id | UUID | FK(best_practices.id) CASCADE, NOT NULL | Practice reference |
| asked_by_user_id | UUID | FK(users.id), NOT NULL | User who asked |
| question_text | TEXT | NOT NULL | Question content |
| answer_text | TEXT | NULL | Answer content |
| answered_by_user_id | UUID | FK(users.id), NULL | User who answered |
| answered_at | TIMESTAMP | NULL | Answer timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `ix_practice_questions_id` on (id)
- `idx_practice_questions_practice` on (practice_id, created_at DESC)

---

### 10. monthly_savings

Aggregated monthly savings per plant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| plant_id | UUID | FK(plants.id), NOT NULL, Index | Plant reference |
| year | INTEGER | NOT NULL | Year |
| month | INTEGER | NOT NULL | Month (1-12) |
| total_savings | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Total savings |
| savings_currency | VARCHAR | NOT NULL, DEFAULT 'lakhs' | Currency format |
| practice_count | INTEGER | NOT NULL, DEFAULT 0 | Number of practices |
| stars | INTEGER | NOT NULL, DEFAULT 0 | Star rating (0-5) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints:**
- UNIQUE (plant_id, year, month)

**Indexes:**
- `ix_monthly_savings_id` on (id)
- `ix_monthly_savings_plant_id` on (plant_id)
- `idx_monthly_savings_plant_year` on (plant_id, year, month DESC)

**Calculated Fields:**
- total_savings: Sum of all approved practices for the month
- stars: Calculated using star rating algorithm

---

### 11. leaderboard_entries

Points leaderboard per plant per year.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Index | Unique identifier |
| plant_id | UUID | FK(plants.id), NOT NULL, Index | Plant reference |
| year | INTEGER | NOT NULL | Year |
| total_points | INTEGER | NOT NULL, DEFAULT 0 | Total points |
| origin_points | INTEGER | NOT NULL, DEFAULT 0 | Points as origin |
| copier_points | INTEGER | NOT NULL, DEFAULT 0 | Points as copier |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints:**
- UNIQUE (plant_id, year)

**Indexes:**
- `ix_leaderboard_entries_id` on (id)
- `ix_leaderboard_entries_plant_id` on (plant_id)
- `idx_leaderboard_year_points` on (year, total_points DESC)

**Points System:**
- Origin: +10 pts when benchmarked BP is first copied
- Copier: +5 pts for each BP copied

---

## Relationships

### users ↔ plants
- One-to-Many: A plant can have many users
- Plant users must have plant_id set
- HQ admins have plant_id = NULL

### users ↔ best_practices
- One-to-Many: A user can submit many practices
- submitted_by_user_id references users

### plants ↔ best_practices
- One-to-Many: A plant can have many practices
- plant_id references plants

### categories ↔ best_practices
- One-to-Many: A category can have many practices
- category_id references categories

### best_practices ↔ practice_images
- One-to-Many: A practice can have multiple images
- CASCADE delete: Deleting practice deletes images

### best_practices ↔ practice_documents
- One-to-Many: A practice can have multiple documents
- CASCADE delete: Deleting practice deletes documents

### best_practices ↔ benchmarked_practices
- One-to-One: A practice can only be benchmarked once
- practice_id is UNIQUE in benchmarked_practices

### best_practices ↔ copied_practices
- One-to-Many: A practice can be copied multiple times
- Tracks both original and copied practice IDs

### best_practices ↔ practice_questions
- One-to-Many: A practice can have many questions
- CASCADE delete: Deleting practice deletes questions

### plants ↔ monthly_savings
- One-to-Many: A plant has monthly savings records
- UNIQUE constraint on (plant_id, year, month)

### plants ↔ leaderboard_entries
- One-to-Many: A plant has yearly leaderboard entries
- UNIQUE constraint on (plant_id, year)

---

## Indexes Strategy

### Performance Indexes

1. **Search Indexes**: title (for text search)
2. **Filter Indexes**: category_id, plant_id, status
3. **Sort Indexes**: submitted_date DESC
4. **Composite Indexes**: (plant_id, submitted_date) for common queries
5. **Unique Indexes**: email, slug, practice_id (in benchmarked_practices)

### Query Optimization

Most common queries are optimized with indexes:
- List practices by plant and date
- Filter practices by category
- Find benchmarked practices
- Get Q&A for a practice
- Calculate monthly savings per plant
- Get leaderboard rankings

---

## Data Types Explained

### UUID
- Universal unique identifiers
- Generated using uuid.uuid4()
- 128-bit values
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### NUMERIC(12,2)
- Precision: 12 total digits
- Scale: 2 decimal places
- Range: -9,999,999,999.99 to 9,999,999,999.99
- Used for savings amounts

### JSONB
- JSON data stored as binary
- Indexable and queryable
- Used for benefits array
- Example: `["Benefit 1", "Benefit 2"]`

### VARCHAR vs TEXT
- VARCHAR: Short strings with length limits
- TEXT: Unlimited length text
- VARCHAR used for: title, email, status
- TEXT used for: description, problem_statement, solution

---

## Constraints

### Primary Keys
- All tables use UUID as primary key
- Auto-generated using uuid.uuid4()

### Foreign Keys
- Cascade deletes where appropriate
- NULL allowed for optional relationships

### Unique Constraints
- Email (users)
- Slug (categories)
- practice_id (benchmarked_practices)
- (plant_id, year, month) in monthly_savings
- (plant_id, year) in leaderboard_entries

### Check Constraints
None at database level - all validation in Pydantic schemas

---

## Soft Deletes

The `best_practices` table uses soft deletes:
- `is_deleted` flag instead of hard DELETE
- Queries filter by `WHERE is_deleted = false`
- Preserves data for audit and analytics
- Cascading deletes still apply to images/documents/questions

---

## Migration Files

### Current Migrations

1. `001_initial_schema.py` - Create all tables

### Creating New Migrations

```bash
# Make model changes in app/models/
# Generate migration
alembic revision --autogenerate -m "Description"

# Review and edit generated file
# Apply migration
alembic upgrade head
```

---

## Seeding Data

The seed script (`app/seed_data.py`) populates:

### Categories (8 total)
```sql
INSERT INTO categories (name, slug, color_class, icon_name)
VALUES
  ('Safety', 'safety', 'bg-red-50...', 'Shield'),
  ('Quality', 'quality', 'bg-blue-50...', 'Target'),
  ...
```

### Plants (7 total)
```sql
INSERT INTO plants (name, short_name, division, is_active)
VALUES
  ('Greater Noida (Ecotech 1)', 'Greater Noida', 'Component', true),
  ...
```

### Default Users
- 1 HQ admin
- 7 plant users (one per plant)

---

## Query Examples

### Get all benchmarked practices
```sql
SELECT bp.*, bp_mark.benchmarked_date
FROM best_practices bp
JOIN benchmarked_practices bp_mark ON bp.id = bp_mark.practice_id
WHERE bp.is_deleted = false
ORDER BY bp_mark.benchmarked_date DESC;
```

### Get leaderboard for 2025
```sql
SELECT p.name, lb.total_points, lb.origin_points, lb.copier_points
FROM leaderboard_entries lb
JOIN plants p ON lb.plant_id = p.id
WHERE lb.year = 2025
ORDER BY lb.total_points DESC;
```

### Get monthly savings for a plant
```sql
SELECT year, month, total_savings, stars
FROM monthly_savings
WHERE plant_id = 'plant-uuid-here'
ORDER BY year DESC, month DESC;
```

---

## Database Size Estimates

### Expected Data Volume (1 year)

- **users**: ~50 records (~10 KB)
- **plants**: ~10 records (~2 KB)
- **categories**: 8 records (~1 KB)
- **best_practices**: ~500 records (~500 KB)
- **practice_images**: ~1,000 records (~50 KB)
- **practice_documents**: ~500 records (~25 KB)
- **benchmarked_practices**: ~150 records (~10 KB)
- **copied_practices**: ~200 records (~15 KB)
- **practice_questions**: ~100 records (~50 KB)
- **monthly_savings**: ~84 records (~5 KB)
- **leaderboard_entries**: ~10 records (~2 KB)

**Total Database Size**: ~1-2 MB (excluding blob storage)  
**Blob Storage**: ~5-10 GB (images and documents)

---

## Backup & Maintenance

### Daily Backups

```bash
# Backup database
pg_dump -U postgres amber_bp > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres amber_bp < backup_20251120.sql
```

### Maintenance Tasks

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE amber_bp;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Last Updated**: November 20, 2025  
**Schema Version**: 1.0.0

