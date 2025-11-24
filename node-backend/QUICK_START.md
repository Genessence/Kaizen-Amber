# Quick Start Guide

## Starting the Server

1. **Make sure you're in the node-backend directory**
   ```powershell
   cd node-backend
   ```

2. **Generate Prisma Client** (if not already done)
   ```powershell
   npm run prisma:generate
   ```

3. **Start the development server**
   ```powershell
   npm run dev
   ```

4. **Verify the server is running**
   - Open browser: http://localhost:8000/health
   - Should see: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### Port 8000 Already in Use

If you get an error that port 8000 is already in use:

**Option 1: Stop the old FastAPI backend**
```powershell
# Find and stop the Python process using port 8000
netstat -ano | findstr :8000
# Note the PID, then:
taskkill /PID <PID> /F
```

**Option 2: Change the backend port**
Edit `node-backend/.env`:
```
PORT=3000
```
Then update frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Database Connection Error

If you see database connection errors:
1. Verify `DATABASE_URL` in `.env` is correct
2. Check if PostgreSQL is running
3. Verify network connectivity to the database

### CORS Errors

If you see CORS errors:
1. Make sure your frontend origin is in `CORS_ORIGINS` in `.env`
2. Default includes: `http://localhost:5173`, `http://localhost:8080`
3. Restart the server after changing CORS_ORIGINS

### Common Issues

**"Cannot find module '@prisma/client'"**
```powershell
npm install
npm run prisma:generate
```

**"JWT_SECRET_KEY must be at least 32 characters"**
- Make sure `.env` has `JWT_SECRET_KEY` set (at least 32 chars)
- Make sure `.env` has `JWT_REFRESH_SECRET` set (at least 32 chars)

**TypeScript errors**
```powershell
npm run build
# Check for compilation errors
```

## Testing the API

Once the server is running, test the login endpoint:

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Test login (replace with actual credentials)
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@amber.com","password":"admin123","remember_me":false}'
```

## Server Logs

The server will output logs to the console. Watch for:
- ✅ "Database connected successfully"
- ✅ "Server running on port 8000"
- ❌ Any error messages

## Next Steps

After the server starts successfully:
1. Test login from the frontend
2. Verify API endpoints are responding
3. Check database queries are working

