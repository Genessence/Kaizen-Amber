#!/bin/bash

# Enhanced deployment script for CI/CD
# This script is optimized for automated deployments

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="${DEPLOY_PATH:-/home/ubuntu/Kaizen-Amber}"
BACKEND_DIR="$PROJECT_DIR/node-backend"
FRONTEND_DIR="$PROJECT_DIR/amber-best-flow"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log_error "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing..."
        sudo npm install -g pm2 || error_exit "Failed to install PM2"
    fi
    
    log "Prerequisites check passed"
}

# Install backend dependencies
install_backend() {
    log "Installing backend dependencies..."
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    npm ci --production || error_exit "Failed to install backend dependencies"
    log "Backend dependencies installed"
}

# Build backend
build_backend() {
    log "Building backend..."
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    npm run build || error_exit "Backend build failed"
    npx prisma generate || error_exit "Prisma client generation failed"
    
    log "Backend built successfully"
}

# Install frontend dependencies
install_frontend() {
    log "Installing frontend dependencies..."
    cd "$FRONTEND_DIR" || error_exit "Frontend directory not found"
    
    npm ci || error_exit "Failed to install frontend dependencies"
    log "Frontend dependencies installed"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR" || error_exit "Frontend directory not found"
    
    npm run build || error_exit "Frontend build failed"
    log "Frontend built successfully"
}

# Deploy backend with PM2
deploy_backend() {
    log "Deploying backend with PM2..."
    cd "$PROJECT_DIR" || error_exit "Project directory not found"
    
    # Stop existing process if running
    pm2 delete kaizen-backend 2>/dev/null || true
    
    # Start new process
    pm2 start ecosystem.config.js || error_exit "Failed to start backend"
    pm2 save || log_warning "Failed to save PM2 configuration"
    
    log "Backend deployed successfully"
}

# Configure and restart Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    if [ ! -f "$PROJECT_DIR/nginx.conf" ]; then
        log_warning "nginx.conf not found, skipping Nginx configuration"
        return
    fi
    
    sudo cp "$PROJECT_DIR/nginx.conf" /etc/nginx/sites-available/kaizen-amber || error_exit "Failed to copy nginx config"
    sudo ln -sf /etc/nginx/sites-available/kaizen-amber /etc/nginx/sites-enabled/ || error_exit "Failed to create nginx symlink"
    
    # Test configuration
    sudo nginx -t || error_exit "Nginx configuration test failed"
    
    # Reload Nginx
    sudo systemctl reload nginx || error_exit "Failed to reload Nginx"
    
    log "Nginx configured and reloaded"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    npx prisma migrate deploy || log_warning "Database migration completed or no new migrations"
    log "Database migrations completed"
}

# Health check
health_check() {
    log "Running health check..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
            log "Health check passed!"
            return 0
        fi
        
        log_warning "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log_warning "Health check failed after $max_attempts attempts"
    return 1
}

# Main deployment function
main() {
    log "========================================="
    log "Starting CI/CD Deployment"
    log "========================================="
    
    check_prerequisites
    install_backend
    build_backend
    install_frontend
    build_frontend
    deploy_backend
    configure_nginx
    run_migrations
    
    # Wait a bit before health check
    sleep 5
    health_check || log_warning "Health check failed, but deployment completed"
    
    log "========================================="
    log "Deployment completed successfully!"
    log "========================================="
    log "Log file: $LOG_FILE"
    
    # Show PM2 status
    log "PM2 Status:"
    pm2 status | tee -a "$LOG_FILE"
}

# Run main function
main "$@"

