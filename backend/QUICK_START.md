# Quick Start Guide - Amber Best Practice Portal Backend

Get the backend up and running in 5 minutes!

## Prerequisites Check

- ✅ Python 3.10+
- ✅ PostgreSQL running
- ✅ Azure Storage Account ready

---

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd F:\Kaizen\backend
pip install -r requirements.txt
```

### 2. Configure Environment (1 min)

Edit `F:\Kaizen\backend\.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/amber_bp
JWT_SECRET_KEY=your-secret-key-min-32-chars
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
```

### 3. Initialize Database (2 min)

```bash
# Create database (if not exists)
createdb amber_bp

# Run migrations
alembic upgrade head

# Seed data (categories, plants, default users)
python app/seed_data.py
```

### 4. Start Server (30 sec)

```bash
python run.py
```

✅ Server running at: `http://localhost:8000`

### 5. Test API (30 sec)

Open browser: `http://localhost:8000/docs`

Try logging in:
- Email: `admin@amber.com`
- Password: `admin123`

---

## Default Credentials

### HQ Admin
```
Email: admin@amber.com
Password: admin123
```

### Plant Users
```
Email: greaternoida@amber.com
Password: plant123

Email: kanchipuram@amber.com
Password: plant123

(etc. for all 7 plants)
```

⚠️ **Change these in production!**

---

## Quick Test with cURL

### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@amber.com",
    "password": "admin123",
    "remember_me": false
  }'
```

Copy the `access_token` from response.

### 2. List Plants

```bash
curl http://localhost:8000/api/v1/plants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. List Categories

```bash
curl http://localhost:8000/api/v1/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Docker Quick Start

```bash
cd F:\Kaizen\backend

# Start PostgreSQL + API
docker-compose up -d

# Run migrations
docker-compose exec api alembic upgrade head

# Seed data
docker-compose exec api python app/seed_data.py

# View logs
docker-compose logs -f api
```

Server running at: `http://localhost:8000`

---

## Troubleshooting

### Server won't start

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check if database exists
psql -U postgres -l | grep amber_bp

# Check Python dependencies
pip list | grep fastapi
```

### Database connection error

1. Verify DATABASE_URL in `.env`
2. Check PostgreSQL is running: `pg_ctl status`
3. Test connection: `psql -U postgres -d amber_bp`

### Azure upload fails

1. Verify AZURE_STORAGE_CONNECTION_STRING is correct
2. Check containers exist in Azure Portal
3. Test Azure connection in Python:
   ```python
   from azure.storage.blob import BlobServiceClient
   client = BlobServiceClient.from_connection_string("your-connection-string")
   print(list(client.list_containers()))
   ```

---

## Next Steps

1. ✅ Backend is running
2. → Update frontend API base URL
3. → Test login from frontend
4. → Test creating a best practice
5. → Test file uploads
6. → Deploy to production

---

## Support

- **API Docs**: http://localhost:8000/docs
- **Detailed Setup**: See `SETUP_GUIDE.md`
- **API Reference**: See `API_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

---

**Ready to go!** 🚀

