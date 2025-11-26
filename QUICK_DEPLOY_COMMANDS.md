# Quick Deployment Commands

Copy and paste these commands on your EC2 Ubuntu instance.

## Initial Setup (One-time)

```bash
# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 4. Install Nginx
sudo apt-get install -y nginx

# 5. Install PostgreSQL (if not using RDS)
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Transfer Files to EC2

**From your local machine:**

```bash
# Navigate to project directory
cd /path/to/Kaizen-Amber

# Transfer files (replace YOUR_EC2_IP and path to PEM)
scp -i /path/to/your-key.pem -r . ubuntu@YOUR_EC2_IP:/home/ubuntu/Kaizen-Amber
```

## On EC2: Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE kaizen_amber;
CREATE USER kaizen_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kaizen_amber TO kaizen_user;
ALTER USER kaizen_user CREATEDB;
\q
EOF
```

## On EC2: Configure Backend

```bash
cd /home/ubuntu/Kaizen-Amber/node-backend

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DEBUG=false
CORS_ORIGINS=["http://YOUR_EC2_PUBLIC_IP"]
DATABASE_URL=postgresql://kaizen_user:your_secure_password@localhost:5432/kaizen_amber
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=YOUR_ACCOUNT_NAME
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents
MAX_IMAGE_SIZE_MB=10
MAX_DOCUMENT_SIZE_MB=20
ALLOWED_IMAGE_TYPES=["image/jpeg","image/png","image/jpg","image/gif","image/webp"]
ALLOWED_DOCUMENT_TYPES=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
EOF

# Edit .env with your actual values
nano .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build backend
npm run build
```

## On EC2: Configure Frontend

```bash
cd /home/ubuntu/Kaizen-Amber/amber-best-flow

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "EC2 Public IP: $EC2_IP"

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://$EC2_IP/api/v1
EOF

# Install dependencies
npm install

# Build frontend
npm run build
```

## On EC2: Start Backend with PM2

```bash
cd /home/ubuntu/Kaizen-Amber

# Create logs directory
mkdir -p logs

# Start backend
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs kaizen-backend
```

## On EC2: Configure Nginx

```bash
# Copy nginx config
sudo cp /home/ubuntu/Kaizen-Amber/nginx.conf /etc/nginx/sites-available/kaizen-amber

# Create symlink
sudo ln -s /etc/nginx/sites-available/kaizen-amber /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## On EC2: Configure AWS Security Group

**In AWS Console:**
1. Go to EC2 → Instances → Select your instance
2. Click Security tab → Security Groups
3. Edit inbound rules:
   - Add: Type=HTTP, Port=80, Source=0.0.0.0/0
   - Add: Type=HTTPS, Port=443, Source=0.0.0.0/0 (optional for SSL)

## Test Deployment

```bash
# Get your EC2 public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Test backend
curl http://localhost:3000/api/v1/health || echo "Check if health endpoint exists"

# Test frontend
curl http://localhost/ | head -n 5

# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx
```

## Access Your Application

- Frontend: `http://YOUR_EC2_PUBLIC_IP`
- Backend API: `http://YOUR_EC2_PUBLIC_IP/api/v1`

## Quick Update Commands

```bash
# Update backend
cd /home/ubuntu/Kaizen-Amber/node-backend
git pull  # if using git
npm install
npm run build
npx prisma migrate deploy
pm2 restart kaizen-backend

# Update frontend
cd /home/ubuntu/Kaizen-Amber/amber-best-flow
git pull  # if using git
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting Commands

```bash
# Backend logs
pm2 logs kaizen-backend --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check if ports are in use
sudo lsof -i :3000
sudo lsof -i :80

# Restart services
pm2 restart kaizen-backend
sudo systemctl restart nginx

# Database connection test
sudo -u postgres psql -d kaizen_amber -c "SELECT 1;"
```

