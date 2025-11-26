# AWS EC2 Deployment Guide for Kaizen-Amber

This guide will help you deploy both the backend and frontend of Kaizen-Amber on an AWS EC2 Ubuntu instance.

## Prerequisites

- AWS EC2 instance running Ubuntu (20.04 or later)
- PEM file downloaded and accessible
- Domain name (optional, you can use EC2 public IP)
- PostgreSQL database (can be on EC2 or RDS)
- Azure Storage account credentials (for file uploads)

## Step 1: Connect to Your EC2 Instance

```bash
# Set proper permissions for your PEM file
chmod 400 /path/to/your-key.pem

# Connect to EC2 instance (replace with your EC2 public IP)
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## Step 2: Initial Server Setup

Once connected to your EC2 instance, run these commands:

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y git curl build-essential

# Install PostgreSQL (if not using RDS)
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE kaizen_amber;
CREATE USER kaizen_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kaizen_amber TO kaizen_user;
\q
EOF
```

## Step 3: Transfer Project Files to EC2

From your local machine, transfer the project to EC2:

```bash
# From your local machine, navigate to project directory
cd /path/to/Kaizen-Amber

# Transfer files to EC2 (replace with your EC2 IP)
scp -i /path/to/your-key.pem -r . ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/Kaizen-Amber
```

Alternatively, you can clone from Git if your repository is accessible:

```bash
# On EC2 instance
cd /home/ubuntu
git clone YOUR_REPOSITORY_URL Kaizen-Amber
cd Kaizen-Amber
```

## Step 4: Install Node.js and Dependencies

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## Step 5: Configure Backend Environment

```bash
cd /home/ubuntu/Kaizen-Amber/node-backend

# Copy example env file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

**Important environment variables to set:**

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET_KEY`: A secure random string (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Another secure random string
- `CORS_ORIGINS`: Array with your EC2 IP or domain (e.g., `["http://YOUR_EC2_IP"]`)
- `AZURE_STORAGE_CONNECTION_STRING`: Your Azure Storage connection string
- `AZURE_STORAGE_ACCOUNT_NAME`: Your Azure Storage account name

Example `.env` file:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGINS=["http://YOUR_EC2_PUBLIC_IP"]
DATABASE_URL=postgresql://kaizen_user:your_secure_password@localhost:5432/kaizen_amber
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long-here
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
```

## Step 6: Setup Database

```bash
cd /home/ubuntu/Kaizen-Amber/node-backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database if you have seed scripts
# npm run seed
```

## Step 7: Build Backend

```bash
cd /home/ubuntu/Kaizen-Amber/node-backend

# Build TypeScript
npm run build
```

## Step 8: Configure Frontend

```bash
cd /home/ubuntu/Kaizen-Amber/amber-best-flow

# Create .env file for frontend
cat > .env << EOF
VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP/api/v1
EOF

# Install dependencies
npm install

# Build frontend
npm run build
```

**Note:** Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP address. If you have a domain, use that instead.

## Step 9: Setup PM2 for Backend

```bash
cd /home/ubuntu/Kaizen-Amber

# Create logs directory
mkdir -p logs

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs kaizen-backend
```

## Step 10: Install and Configure Nginx

```bash
# Install Nginx
sudo apt-get install -y nginx

# Copy nginx configuration
sudo cp /home/ubuntu/Kaizen-Amber/nginx.conf /etc/nginx/sites-available/kaizen-amber

# Edit nginx config to update server_name if needed
sudo nano /etc/nginx/sites-available/kaizen-amber

# Create symlink
sudo ln -s /etc/nginx/sites-available/kaizen-amber /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

## Step 11: Configure AWS Security Group

Make sure your EC2 security group allows inbound traffic on:

- **Port 80 (HTTP)** - For web traffic
- **Port 443 (HTTPS)** - If using SSL (recommended)
- **Port 22 (SSH)** - For SSH access

To configure in AWS Console:
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Edit inbound rules
4. Add rules:
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (if using SSL)

## Step 12: Test Deployment

```bash
# Check backend is running
pm2 status
pm2 logs kaizen-backend --lines 50

# Check nginx is running
sudo systemctl status nginx

# Test backend API
curl http://localhost:3000/api/v1/health || echo "Backend health check endpoint"

# Test frontend
curl http://localhost/ | head -n 20
```

Access your application:
- Frontend: `http://YOUR_EC2_PUBLIC_IP`
- Backend API: `http://YOUR_EC2_PUBLIC_IP/api/v1`

## Step 13: Setup SSL (Optional but Recommended)

For production, you should set up SSL using Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure nginx and set up auto-renewal
```

After SSL setup, update your frontend `.env`:
```env
VITE_API_BASE_URL=https://your-domain.com/api/v1
```

And rebuild frontend:
```bash
cd /home/ubuntu/Kaizen-Amber/amber-best-flow
npm run build
```

## Step 14: Automated Deployment Script

You can use the provided `deploy.sh` script for easier deployment:

```bash
cd /home/ubuntu/Kaizen-Amber

# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

**Note:** Make sure your `.env` file is configured before running the script.

## Useful Commands

### PM2 Commands
```bash
# View logs
pm2 logs kaizen-backend

# Restart backend
pm2 restart kaizen-backend

# Stop backend
pm2 stop kaizen-backend

# View status
pm2 status

# Monitor
pm2 monit
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload nginx (after config changes)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Database Commands
```bash
# Connect to database
sudo -u postgres psql -d kaizen_amber

# Run migrations
cd /home/ubuntu/Kaizen-Amber/node-backend
npx prisma migrate deploy

# Open Prisma Studio (for database management)
npx prisma studio
```

## Troubleshooting

### Backend not starting
```bash
# Check PM2 logs
pm2 logs kaizen-backend --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Check environment variables
cd /home/ubuntu/Kaizen-Amber/node-backend
cat .env
```

### Frontend not loading
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify frontend build exists
ls -la /home/ubuntu/Kaizen-Amber/amber-best-flow/dist

# Check nginx configuration
sudo nginx -t
```

### Database connection issues
```bash
# Test database connection
sudo -u postgres psql -d kaizen_amber -c "SELECT 1;"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string format
echo $DATABASE_URL
```

### CORS errors
- Make sure `CORS_ORIGINS` in backend `.env` includes your frontend URL
- Check browser console for exact CORS error
- Verify nginx is proxying correctly

## Updating the Application

When you need to update the application:

```bash
cd /home/ubuntu/Kaizen-Amber

# Pull latest changes (if using git)
git pull origin main

# Update backend
cd node-backend
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
pm2 restart kaizen-backend

# Update frontend
cd ../amber-best-flow
npm install
npm run build

# Reload nginx
sudo systemctl reload nginx
```

## Monitoring

### Setup Log Rotation
```bash
# PM2 already handles log rotation, but you can configure it
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup Monitoring (Optional)
Consider using PM2 Plus or other monitoring tools for production environments.

## Security Checklist

- [ ] Change default SSH port (optional)
- [ ] Setup firewall (UFW)
- [ ] Use strong database passwords
- [ ] Use strong JWT secrets
- [ ] Enable SSL/HTTPS
- [ ] Regularly update system packages
- [ ] Setup automated backups for database
- [ ] Configure AWS Security Groups properly
- [ ] Use environment variables, never commit secrets

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs kaizen-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `journalctl -u nginx -f`

