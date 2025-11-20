# Complete Setup Checklist - Amber Best Practice Portal

## 📋 Everything You Need to Get Running

This checklist covers setting up both backend and frontend with all integrations.

---

## ✅ Pre-Setup Verification

### What You Already Have:
- ✅ Complete backend code (FastAPI + PostgreSQL)
- ✅ Complete frontend code (React + TypeScript)
- ✅ Full integration (API service, hooks, components)
- ✅ Comprehensive documentation

### What You Need:
- [ ] PostgreSQL installed (or AWS RDS configured)
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Azure account (free tier available)

---

## 🗄️ Part 1: Database Setup

### Option A: Local PostgreSQL

```powershell
# Create database
createdb amber_bp
```

Update .env:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/amber_bp
```

### Option B: AWS RDS (You seem to have this)

Update .env with complete connection string:
```env
DATABASE_URL=postgresql://username:password@database-1.cluster-c90q66es89vi.ap-south-1.rds.amazonaws.com:5432/dbname
```

Replace:
- `username` - your RDS master username
- `password` - your RDS master password  
- `dbname` - your database name (e.g., `amber_bp`)

### Initialize Database

```powershell
cd F:\Kaizen\backend

# Run migrations (creates all tables)
alembic upgrade head

# Seed initial data (categories, plants, default users)
python app/seed_data.py
```

**Expected Output**:
```
Creating categories... ✓
Creating plants... ✓
Creating default admin user... ✓
Creating plant users... ✓
Database seeding completed!
```

✅ **Database Ready!**

---

## ☁️ Part 2: Azure Blob Storage Setup

### Follow These Steps:

1. **Read the guide**: `AZURE_SETUP_GUIDE.md`
2. **Quick reference**: `AZURE_QUICK_REFERENCE.md`

### Quick Summary:

**In Azure Portal** (https://portal.azure.com):
1. Create Storage Account (name: `amberbp2025` or similar)
2. Create container: `best-practices` (public: Blob)
3. Create container: `supporting-documents` (public: Blob)
4. Copy connection string from Access Keys

**Update .env**:
```env
AZURE_STORAGE_CONNECTION_STRING=<your full connection string>
AZURE_STORAGE_ACCOUNT_NAME=<your account name>
```

**Test It**:
```powershell
python test_azure_connection.py
```

✅ **Azure Ready!**

---

## 🚀 Part 3: Start Backend

### 3.1 Install Dependencies (if not done)
```powershell
cd F:\Kaizen\backend
pip install -r requirements.txt
```

### 3.2 Verify .env File
Check these are configured:
- [ ] DATABASE_URL (complete with username:password@host:port/dbname)
- [ ] AZURE_STORAGE_CONNECTION_STRING (full string from Azure)
- [ ] AZURE_STORAGE_ACCOUNT_NAME (your account name)
- [ ] JWT_SECRET_KEY (any random string for testing)

### 3.3 Start Server
```powershell
python run.py
```

**Expected Output**:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3.4 Verify Backend Running
Open: http://localhost:8000/docs

You should see Swagger UI with all API endpoints!

✅ **Backend Running!**

---

## 💻 Part 4: Start Frontend

### 4.1 Install Dependencies (if not done)
```powershell
cd F:\Kaizen\amber-best-flow
npm install
```

### 4.2 Verify .env File
Check: `F:\Kaizen\amber-best-flow\.env`

Should contain:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 4.3 Start Development Server
```powershell
npm run dev
```

**Expected Output**:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4.4 Open Application
Open: http://localhost:5173

You should see the login page!

✅ **Frontend Running!**

---

## 🧪 Part 5: Test Everything

### Test 1: Login ✅
```
URL: http://localhost:5173
Email: admin@amber.com
Password: admin123
```

**Expected**: 
- Redirects to HQ Admin dashboard
- See "HQ Admin" badge
- No console errors

### Test 2: View Practices ✅
```
1. Click "View Best Practices"
2. Should see list (or "No practices found" if database empty)
3. Try search and filters
```

### Test 3: Create Practice ✅
```
1. Login as plant user: greaternoida@amber.com / plant123
2. Click "Add Best Practice"
3. Fill in:
   - Title: "Test Practice"
   - Category: Select any
   - Problem: "Test problem statement"
   - Solution: "Test solution"
4. Upload before/after images (optional)
5. Click "Submit"
```

**Expected**:
- Success toast appears
- Practice saved to PostgreSQL
- Images uploaded to Azure (if selected)
- Practice appears in list
- Dashboard counts increment

### Test 4: Benchmark Practice (HQ Only) ✅
```
1. Login as HQ admin
2. Go to Practice List
3. Click on a practice
4. Click "Mark as Benchmark"
```

**Expected**:
- Practice benchmarked in database
- Badge appears
- Benchmarked count updates

### Test 5: Copy & Implement ✅
```
1. Login as different plant user
2. View benchmarked practices
3. Click "Copy & Implement"
4. Modify and submit
```

**Expected**:
- New practice created
- Points awarded
- Leaderboard updates
- Toast shows points earned

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check**:
```powershell
# Is PostgreSQL/RDS accessible?
psql -h database-1.cluster-c90q66es89vi.ap-south-1.rds.amazonaws.com -U username -d dbname

# Are dependencies installed?
pip list | findstr fastapi

# Check .env file
cat .env
```

**Common Issues**:
- ❌ DATABASE_URL format wrong → Add `postgresql://user:pass@host:port/db`
- ❌ Port 8000 in use → Change port or kill process
- ❌ Azure connection fails → Run `test_azure_connection.py`

### Frontend Won't Start

**Check**:
```powershell
# Are dependencies installed?
npm list | findstr react

# Check .env file
cat .env
```

**Common Issues**:
- ❌ Port 5173 in use → Will auto-assign different port
- ❌ Node version old → Update to Node 18+

### Login Fails

**Check**:
- ✅ Backend is running at http://localhost:8000
- ✅ Database has seeded data (`python app/seed_data.py`)
- ✅ Credentials correct: admin@amber.com / admin123
- ✅ No CORS errors in browser console

### Images Don't Upload

**Check**:
- ✅ Azure connection string in .env is complete
- ✅ Containers exist in Azure Portal
- ✅ Run `python test_azure_connection.py`
- ✅ Check browser Network tab for errors

---

## 📊 System Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  localhost:5173     │
└──────────┬──────────┘
           │ HTTP/REST API
           ↓
┌─────────────────────┐
│  FastAPI Backend    │
│  localhost:8000     │
└─────┬──────────┬────┘
      │          │
      ↓          ↓
┌──────────┐  ┌──────────────┐
│PostgreSQL│  │ Azure Blob   │
│ Database │  │   Storage    │
│(RDS/Local)  │  (Images/Docs)│
└──────────┘  └──────────────┘
```

---

## 🎯 Success Criteria

Your setup is complete when:

✅ **Database**:
- [ ] Database created
- [ ] Migrations run successfully
- [ ] Seed data loaded
- [ ] Can connect from backend

✅ **Azure**:
- [ ] Storage account created
- [ ] Both containers exist
- [ ] Connection string in .env
- [ ] Test script passes

✅ **Backend**:
- [ ] Starts without errors
- [ ] http://localhost:8000/docs shows Swagger UI
- [ ] Can login via API
- [ ] Health check works

✅ **Frontend**:
- [ ] Starts without errors
- [ ] Login page loads
- [ ] Can login successfully
- [ ] Dashboard shows data
- [ ] Can create practices
- [ ] Images upload

---

## 📚 Documentation Reference

| What | Where |
|------|-------|
| **Azure Setup** | `AZURE_SETUP_GUIDE.md` ← Full detailed guide |
| **Azure Quick Ref** | `AZURE_QUICK_REFERENCE.md` ← Quick lookup |
| **Backend Setup** | `backend/QUICK_START.md` |
| **API Reference** | `backend/API_GUIDE.md` |
| **Database Schema** | `backend/DATABASE_SCHEMA.md` |
| **Integration Status** | `README.md` |
| **Deployment** | `backend/DEPLOYMENT_GUIDE.md` |

---

## 🚀 Quick Start Commands

### Every Time You Develop:

**Terminal 1 - Backend**:
```powershell
cd F:\Kaizen\backend
python run.py
```

**Terminal 2 - Frontend**:
```powershell
cd F:\Kaizen\amber-best-flow
npm run dev
```

**Open**: http://localhost:5173  
**Login**: admin@amber.com / admin123

---

## 📞 Need Help?

### Setup Issues:
1. **Database**: Check DATABASE_URL format
2. **Azure**: Run `python test_azure_connection.py`
3. **Backend**: Check logs in terminal
4. **Frontend**: Check browser console (F12)

### Step-by-Step Guides:
- **Azure**: `AZURE_SETUP_GUIDE.md` (detailed walkthrough)
- **Backend**: `backend/SETUP_GUIDE.md`
- **Testing**: `backend/QUICK_START.md`

---

## ✨ After Setup Complete

You can:
- ✅ Create best practices
- ✅ Upload images to Azure
- ✅ Benchmark practices
- ✅ Copy & implement with points
- ✅ View real-time analytics
- ✅ Use leaderboard

**Everything will work end-to-end!** 🎉

---

**Next**: Follow `AZURE_SETUP_GUIDE.md` for detailed Azure setup  
**Then**: Run through this checklist  
**Finally**: Start using your application!

