# Kaizen-Amber EC2 Deployment

This repository contains all necessary files and documentation for deploying Kaizen-Amber on AWS EC2 Ubuntu instance.

## Files Created for Deployment

1. **`ecosystem.config.js`** - PM2 configuration for managing the backend process
2. **`nginx.conf`** - Nginx reverse proxy configuration
3. **`deploy.sh`** - Automated deployment script
4. **`DEPLOYMENT_GUIDE.md`** - Comprehensive step-by-step deployment guide
5. **`QUICK_DEPLOY_COMMANDS.md`** - Quick reference commands for deployment

## Quick Start

### Step 1: Transfer Files to EC2

From your local machine:

```bash
cd /path/to/Kaizen-Amber
scp -i /path/to/your-key.pem -r . ubuntu@YOUR_EC2_IP:/home/ubuntu/Kaizen-Amber
```

### Step 2: Connect to EC2

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 3: Run Deployment Script

On EC2:

```bash
cd /home/ubuntu/Kaizen-Amber
chmod +x deploy.sh

# Make sure to configure .env file first
cd node-backend
nano .env  # Configure with your actual values

# Then run deployment
cd ..
./deploy.sh
```

### Step 4: Configure Security Group

In AWS Console, add inbound rules:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0 (optional)

### Step 5: Access Application

- Frontend: `http://YOUR_EC2_PUBLIC_IP`
- Backend API: `http://YOUR_EC2_PUBLIC_IP/api/v1`

## Manual Deployment

If you prefer manual setup, follow the detailed guide in `DEPLOYMENT_GUIDE.md` or use commands from `QUICK_DEPLOY_COMMANDS.md`.

## Environment Variables Required

### Backend (.env in node-backend/)

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Minimum 32 characters
- `JWT_REFRESH_SECRET` - Minimum 32 characters
- `CORS_ORIGINS` - JSON array with your EC2 IP/domain
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection
- `AZURE_STORAGE_ACCOUNT_NAME` - Azure Storage account name

### Frontend (.env in amber-best-flow/)

- `VITE_API_BASE_URL` - Backend API URL (e.g., `http://YOUR_EC2_IP/api/v1`)

## Architecture

```
Internet
  ↓
EC2 Instance (Ubuntu)
  ↓
Nginx (Port 80)
  ├─→ Frontend (Static files from amber-best-flow/dist)
  └─→ Backend API (Proxy to localhost:3000)
       ↓
     PM2 Process
       ↓
     Node.js Backend (Port 3000)
       ↓
     PostgreSQL Database
```

## Services

- **Nginx**: Web server and reverse proxy
- **PM2**: Process manager for Node.js backend
- **PostgreSQL**: Database (can be on EC2 or RDS)

## Useful Commands

```bash
# PM2
pm2 status
pm2 logs kaizen-backend
pm2 restart kaizen-backend

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# Database
sudo -u postgres psql -d kaizen_amber
```

## Troubleshooting

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting section.

## Next Steps

1. Setup SSL certificate (Let's Encrypt)
2. Configure domain name
3. Setup automated backups
4. Configure monitoring and alerts

