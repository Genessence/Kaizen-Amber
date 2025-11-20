# Amber Best Practice Portal - API Guide

Complete API reference for the Amber Best Practice & Benchmarking Portal backend.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require Bearer token authentication.

### Headers

```
Authorization: Bearer {access_token}
```

---

## Authentication Endpoints

### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@amber.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "plant",
  "plant_id": "uuid-here"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@amber.com",
  "full_name": "John Doe",
  "role": "plant",
  "plant_id": "uuid",
  "is_active": true,
  "created_at": "2025-11-20T12:00:00Z",
  "updated_at": "2025-11-20T12:00:00Z"
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@amber.com",
  "password": "password123",
  "remember_me": false
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Get Current User

```http
GET /auth/me
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@amber.com",
  "full_name": "John Doe",
  "role": "plant",
  "plant_id": "uuid",
  "plant_name": "Greater Noida (Ecotech 1)",
  "plant_short_name": "Greater Noida",
  "is_active": true,
  "created_at": "2025-11-20T12:00:00Z",
  "updated_at": "2025-11-20T12:00:00Z"
}
```

---

## Plants Endpoints

### List All Plants

```http
GET /plants?is_active=true
```

**Query Parameters:**
- `is_active` (boolean, optional): Filter by active status

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Greater Noida (Ecotech 1)",
    "short_name": "Greater Noida",
    "division": "Component",
    "is_active": true,
    "created_at": "2025-11-20T12:00:00Z",
    "updated_at": "2025-11-20T12:00:00Z"
  }
]
```

### Get Plant Details

```http
GET /plants/{plant_id}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Greater Noida (Ecotech 1)",
  "short_name": "Greater Noida",
  "division": "Component",
  "is_active": true,
  "total_practices": 26,
  "total_savings": 196.5,
  "benchmarked_count": 4,
  "monthly_practices": 3,
  "created_at": "2025-11-20T12:00:00Z",
  "updated_at": "2025-11-20T12:00:00Z"
}
```

---

## Best Practices Endpoints

### List Best Practices

```http
GET /best-practices?search=automation&category_id=uuid&limit=20&offset=0
```

**Query Parameters:**
- `category_id` (UUID, optional): Filter by category
- `plant_id` (UUID, optional): Filter by plant
- `status` (string, optional): Filter by status
- `search` (string, optional): Search in title and description
- `start_date` (date, optional): Filter by start date
- `end_date` (date, optional): Filter by end date
- `is_benchmarked` (boolean, optional): Filter benchmarked practices
- `limit` (int, optional, max 100): Page size (default 20)
- `offset` (int, optional): Page offset (default 0)
- `sort_by` (string, optional): Sort field (default submitted_date)
- `sort_order` (string, optional): asc or desc (default desc)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Smart Cart Movement & Management through AMR",
      "description": "Implementation of automated cart movement...",
      "category_id": "uuid",
      "category_name": "Automation",
      "plant_id": "uuid",
      "plant_name": "Greater Noida (Ecotech 1)",
      "submitted_by_name": "Team Production",
      "submitted_date": "2025-01-15",
      "status": "approved",
      "savings_amount": "3.2",
      "savings_currency": "lakhs",
      "is_benchmarked": true,
      "question_count": 2,
      "has_images": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Create Best Practice

```http
POST /best-practices
```

**Request Body:**
```json
{
  "title": "Smart Cart Movement through AMR",
  "description": "Automated cart movement system...",
  "category_id": "uuid",
  "problem_statement": "Manual cart movement required multiple manpower...",
  "solution": "Automated the cart movement using AMR...",
  "benefits": [
    "Improved logistics efficiency",
    "Reduced manpower requirement"
  ],
  "metrics": "Manpower saved: 5 operators",
  "implementation": "Completed in 8 weeks",
  "investment": "₹10L",
  "savings_amount": "3.2",
  "savings_currency": "lakhs",
  "savings_period": "annually",
  "area_implemented": "Press Shop to Paint Shop",
  "status": "draft"
}
```

**Response:** `201 Created`

### Get Practice Details

```http
GET /best-practices/{practice_id}
```

**Response:** `200 OK` - Full practice details with images, documents, and Q&A count

---

## Benchmarking Endpoints

### Benchmark a Practice (HQ Only)

```http
POST /benchmarking/benchmark/{practice_id}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "practice_id": "uuid",
  "benchmarked_by_user_id": "uuid",
  "benchmarked_date": "2025-11-20",
  "created_at": "2025-11-20T12:00:00Z"
}
```

### Unbenchmark a Practice (HQ Only)

```http
DELETE /benchmarking/unbenchmark/{practice_id}
```

**Response:** `200 OK`

### List Benchmarked Practices

```http
GET /benchmarking/list?limit=50&offset=0
```

**Query Parameters:**
- `plant_id` (UUID, optional)
- `category_id` (UUID, optional)
- `limit`, `offset`: Pagination

---

## Copy & Implement Endpoints

### Copy and Implement Practice

```http
POST /copy/implement
```

**Request Body:**
```json
{
  "original_practice_id": "uuid",
  "customized_title": "Modified title (optional)",
  "customized_solution": "Modified solution (optional)",
  "implementation_status": "planning"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "copied_practice": {...},
    "copy_record": {...},
    "points_awarded": {
      "origin_points": 10,
      "copier_points": 5,
      "origin_plant_id": "uuid",
      "copying_plant_id": "uuid"
    }
  },
  "message": "Practice copied successfully"
}
```

### Get My Implementations

```http
GET /copy/my-implementations
```

**Response:** List of practices copied by current user's plant

---

## Analytics Endpoints

### Dashboard Overview

```http
GET /analytics/overview?currency=lakhs
```

**Response:** `200 OK`
```json
{
  "monthly_count": 5,
  "ytd_count": 26,
  "monthly_savings": "15.8",
  "ytd_savings": "196.5",
  "stars": 4,
  "benchmarked_count": 4,
  "currency": "lakhs"
}
```

### Plant Performance

```http
GET /analytics/plant-performance?period=yearly&year=2025
```

**Query Parameters:**
- `period`: yearly or monthly
- `year` (optional): defaults to current
- `month` (optional): required if period is monthly

**Response:** `200 OK`
```json
[
  {
    "plant_id": "uuid",
    "plant_name": "Greater Noida (Ecotech 1)",
    "short_name": "Greater Noida",
    "submitted": 26
  }
]
```

### Category Breakdown

```http
GET /analytics/category-breakdown
```

**Response:** `200 OK`
```json
[
  {
    "category_id": "uuid",
    "category_name": "Automation",
    "category_slug": "automation",
    "practice_count": 37,
    "color_class": "bg-amber-50 text-amber-700",
    "icon_name": "Bot"
  }
]
```

### Star Ratings

```http
GET /analytics/star-ratings?currency=lakhs
```

**Response:** `200 OK`
```json
[
  {
    "plant_id": "uuid",
    "plant_name": "Greater Noida (Ecotech 1)",
    "monthly_savings": "15.8",
    "ytd_savings": "196.5",
    "stars": 4,
    "currency": "lakhs"
  }
]
```

---

## Leaderboard Endpoints

### Get Current Leaderboard

```http
GET /leaderboard/current?year=2025
```

**Response:** `200 OK`
```json
[
  {
    "plant_id": "uuid",
    "plant_name": "Greater Noida (Ecotech 1)",
    "total_points": 36,
    "origin_points": 20,
    "copier_points": 16,
    "rank": 1,
    "breakdown": [
      {
        "type": "Origin",
        "points": 10,
        "date": "2025-02-12",
        "bp_title": "Digital Production Control Tower",
        "bp_id": "uuid"
      }
    ]
  }
]
```

### Get Plant Breakdown

```http
GET /leaderboard/{plant_id}/breakdown?year=2025
```

**Response:** `200 OK`
```json
{
  "plant_id": "uuid",
  "plant_name": "Greater Noida (Ecotech 1)",
  "copied": [...],
  "copiedCount": 3,
  "copiedPoints": 15,
  "originated": [...],
  "originatedCount": 2,
  "originatedPoints": 20
}
```

---

## Questions Endpoints

### Get Practice Questions

```http
GET /questions/practice/{practice_id}
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "practice_id": "uuid",
    "asked_by_user_id": "uuid",
    "asked_by_name": "John Doe",
    "question_text": "What was the ROI period?",
    "answer_text": "6 months",
    "answered_by_user_id": "uuid",
    "answered_by_name": "Jane Smith",
    "answered_at": "2025-11-20T15:00:00Z",
    "created_at": "2025-11-20T12:00:00Z"
  }
]
```

### Ask Question

```http
POST /questions/practice/{practice_id}
```

**Request Body:**
```json
{
  "question_text": "What was the implementation timeline?"
}
```

**Response:** `201 Created`

### Answer Question

```http
PATCH /questions/{question_id}/answer
```

**Request Body:**
```json
{
  "answer_text": "Implementation took 8 weeks."
}
```

**Response:** `200 OK`

---

## File Upload Flow

### Step 1: Request Presigned URL

```http
POST /best-practices/upload/presigned-url
```

**Request Body:**
```json
{
  "practice_id": "uuid",
  "file_type": "image",
  "image_type": "before",
  "filename": "before_image.jpg",
  "content_type": "image/jpeg",
  "file_size": 1048576
}
```

**Response:** `200 OK`
```json
{
  "upload_url": "https://storage.azure.com/...",
  "blob_name": "practices/uuid/before_1234567890.jpg",
  "container": "best-practices",
  "expiry": "2025-11-20T13:00:00Z"
}
```

### Step 2: Upload to Azure (Client-side)

```javascript
const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': contentType
  },
  body: file
});
```

### Step 3: Confirm Upload

```http
POST /best-practices/{practice_id}/images
```

**Request Body:**
```json
{
  "practice_id": "uuid",
  "image_type": "before",
  "blob_container": "best-practices",
  "blob_name": "practices/uuid/before_1234567890.jpg",
  "blob_url": "https://storage.azure.com/...",
  "file_size": 1048576,
  "content_type": "image/jpeg"
}
```

---

## Points System

### Origin Points
- **10 points** awarded to the originating plant when their benchmarked BP is copied for the first time

### Copier Points
- **5 points** awarded to each plant that copies a benchmarked BP

### Example Flow
1. Plant A submits a BP
2. HQ benchmarks it → BP becomes available for copying
3. Plant B copies it → Plant A gets +10 points, Plant B gets +5 points
4. Plant C copies it → Plant A keeps 10 points (already awarded), Plant C gets +5 points

---

## Star Rating System

Stars are calculated based on both monthly AND YTD savings (in Lakhs):

| Stars | YTD Savings  | Monthly Savings |
|-------|--------------|-----------------|
| ⭐⭐⭐⭐⭐ | > ₹200L      | > ₹16L          |
| ⭐⭐⭐⭐   | ₹150-200L    | ₹12-16L         |
| ⭐⭐⭐     | ₹100-150L    | ₹8-12L          |
| ⭐⭐       | ₹50-100L     | ₹4-8L           |
| ⭐        | > ₹50L       | > ₹4L           |
| -        | < ₹50L       | < ₹4L           |

Both thresholds must be met to achieve the star rating.

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message"
}
```

### Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Role-Based Access Control

### Plant User Permissions
- Submit best practices for their plant
- View all practices (read-only)
- Copy benchmarked practices
- Ask questions
- Answer questions on their own practices

### HQ Admin Permissions
- All plant user permissions
- Benchmark practices
- Unbenchmark practices
- Create/update plants and categories
- Manage users
- Answer any questions
- View company-wide analytics

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit` (int, 1-100): Items per page (default 20)
- `offset` (int, >=0): Number of items to skip (default 0)

**Response Structure:**
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

## Currency Formatting

The API supports two currency formats:

- **Lakhs (L)**: Default format
  - `< 100L`: 2 decimal places
  - `>= 100L`: 1 decimal place
- **Crores (Cr)**: Always 2 decimal places

Use `?currency=lakhs` or `?currency=crores` query parameter.

---

## Testing with Swagger

Access interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Postman Collection

Import the OpenAPI schema from `http://localhost:8000/openapi.json` into Postman for a complete collection.

---

**Last Updated:** November 20, 2025

