# Amber Best Practice Portal - Node.js Backend

High-performance Node.js backend built with Express.js, TypeScript, and Prisma ORM for the Amber Best Practice Portal.

## Features

- **RESTful API** with 50+ endpoints
- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (Plant User / HQ Admin)
- **Azure Blob Storage** integration for file uploads
- **PostgreSQL Database** with Prisma ORM
- **Type-safe** throughout (TypeScript + Prisma)
- **Comprehensive Error Handling**
- **Request Validation** with Zod
- **Performance Optimized** queries

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Storage**: Azure Blob Storage
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Azure Storage Account (for file uploads)

## Installation

1. **Clone and navigate to the backend directory**
   ```bash
   cd node-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration:
   - Database connection string
   - JWT secrets
   - Azure Storage credentials
   - CORS origins

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations** (if needed)
   ```bash
   npm run prisma:migrate
   ```

## Running the Server

### Development
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `GET /me` - Get current user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `POST /change-password` - Change password

### Plants (`/api/v1/plants`)
- `GET /` - List all plants
- `GET /active` - Get active plants
- `GET /:id` - Get plant with statistics

### Categories (`/api/v1/categories`)
- `GET /` - List categories with practice counts
- `GET /:id` - Get category details

### Best Practices (`/api/v1/best-practices`)
- `GET /` - List practices (with filters)
- `POST /` - Create practice
- `GET /:id` - Get practice details
- `PATCH /:id` - Update practice
- `DELETE /:id` - Delete practice
- `GET /my-practices` - Get user's practices
- `GET /recent` - Get recent practices

### Benchmarking (`/api/v1/benchmarking`)
- `POST /benchmark/:id` - Benchmark a practice (HQ only)
- `DELETE /unbenchmark/:id` - Unbenchmark a practice (HQ only)
- `GET /list` - List benchmarked practices
- `GET /recent` - Get recent benchmarked practices
- `GET /copies/:id` - Get practice copies
- `GET /total-count` - Get total benchmarked count
- `GET /copy-spread` - Get copy spread data

### Copy & Implement (`/api/v1/copy-implement`)
- `POST /copy` - Copy and implement a practice
- `GET /my-implementations` - Get user's implementations
- `GET /deployment-status` - Get deployment status

### Questions (`/api/v1/questions`)
- `GET /practice/:practiceId` - Get questions for a practice
- `POST /practice/:practiceId` - Ask a question
- `POST /answer/:questionId` - Answer a question
- `DELETE /:questionId` - Delete question

### Leaderboard (`/api/v1/leaderboard`)
- `GET /` - Get leaderboard
- `GET /plant/:plantId` - Get plant breakdown
- `POST /recalculate` - Recalculate leaderboard

### Analytics (`/api/v1/analytics`)
- `GET /dashboard/overview` - Dashboard overview
- `GET /dashboard/unified` - Unified dashboard (optimized)
- `GET /plant-performance` - Plant performance metrics
- `GET /category-breakdown` - Category breakdown
- `GET /cost-savings` - Cost savings analysis
- `GET /cost-analysis` - Detailed cost analysis
- `GET /plant-monthly-breakdown/:plantId` - Monthly breakdown
- `GET /star-ratings` - Star ratings
- `GET /plant-monthly-trend/:plantId` - Monthly trends
- `GET /benchmark-stats` - Benchmark statistics
- `POST /recalculate-savings` - Recalculate savings

### Uploads (`/api/v1/uploads`)
- `POST /presigned-url` - Generate presigned URL
- `POST /confirm-image/:practiceId` - Confirm image upload
- `POST /confirm-document/:practiceId` - Confirm document upload
- `GET /images/:practiceId` - Get practice images
- `DELETE /images/:imageId` - Delete image

### Notifications (`/api/v1/notifications`)
- `GET /` - Get notifications
- `GET /unread-count` - Get unread count
- `PATCH /:id/read` - Mark as read
- `PATCH /read-all` - Mark all as read

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection
- `CORS_ORIGINS` - Allowed CORS origins (JSON array)

## Database Schema

The backend uses Prisma ORM with the following main tables:
- `users` - User accounts
- `plants` - Manufacturing plants
- `categories` - Best practice categories
- `best_practices` - Best practice submissions
- `practice_images` - Practice images
- `practice_documents` - Practice documents
- `benchmarked_practices` - Benchmark tracking
- `copied_practices` - Copy relationships
- `practice_questions` - Q&A system
- `monthly_savings` - Monthly savings aggregation
- `leaderboard_entries` - Leaderboard points

See `prisma/schema.prisma` for the complete schema.

## Project Structure

```
node-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/         # Business logic services
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## Development

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

## Performance Optimizations

- Connection pooling with Prisma
- Optimized database queries with proper indexes
- Unified dashboard endpoint (single query instead of multiple)
- Response compression
- Efficient JWT verification

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Zod
- CORS configuration
- Helmet.js security headers

## API Compatibility

This backend maintains compatibility with the existing frontend API contracts. All endpoints match the structure expected by `amber-best-flow/src/services/api.ts`.

## License

ISC

