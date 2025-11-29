#!/bin/bash

# Deployment script for Kaizen-Amber on EC2 Ubuntu
# Run this script on your EC2 instance

set -e  # Exit on error

echo "🚀 Starting Kaizen-Amber deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root. Use a regular user with sudo privileges.${NC}"
   exit 1
fi

# Variables
PROJECT_DIR="/home/ubuntu/Kaizen-Amber"
BACKEND_DIR="$PROJECT_DIR/node-backend"
FRONTEND_DIR="$PROJECT_DIR/amber-best-flow"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    pm2 startup systemd -u ubuntu --hp /home/ubuntu
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Navigate to project directory
cd $PROJECT_DIR || exit

# Install backend dependencies (including devDependencies for building)
print_status "Installing backend dependencies..."
cd $BACKEND_DIR
npm install

# Build backend
print_status "Building backend..."
npm run build

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd $FRONTEND_DIR
npm install

# Build frontend
print_status "Building frontend..."

# Check if public/images exists before build
if [ -d "$FRONTEND_DIR/public/images" ]; then
    print_status "Public images folder found - will be copied to dist during build"
    IMAGE_COUNT=$(find "$FRONTEND_DIR/public/images" -type f | wc -l)
    print_status "Found $IMAGE_COUNT image(s) in public/images"
else
    print_warning "Public images folder not found - static images may be missing"
fi

# Build frontend (Vite automatically copies public/ to dist/)
npm run build

# Verify images are in dist folder after build
if [ -d "$FRONTEND_DIR/dist/images" ]; then
    print_status "✓ Frontend images successfully copied to dist/images"
    IMAGE_COUNT=$(find "$FRONTEND_DIR/dist/images" -type f | wc -l)
    print_status "Found $IMAGE_COUNT image(s) in dist/images"
    ls -la "$FRONTEND_DIR/dist/images" | head -5
else
    print_error "✗ Frontend images NOT found in dist/images after build!"
    print_error "This will cause images to not display. Check Vite build output."
fi

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Restart backend with PM2
print_status "Starting backend with PM2..."
cd $PROJECT_DIR
pm2 delete kaizen-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup nginx
print_status "Configuring Nginx..."
sudo cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/kaizen-amber
sudo ln -sf /etc/nginx/sites-available/kaizen-amber /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check PM2 status
print_status "PM2 Status:"
pm2 status

# Check nginx status
print_status "Nginx Status:"
sudo systemctl status nginx --no-pager | head -n 5

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file is configured in $BACKEND_DIR"
echo "2. Run database migrations: cd $BACKEND_DIR && npx prisma migrate deploy"
echo "3. Check logs: pm2 logs kaizen-backend"
echo "4. Access your application at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""

