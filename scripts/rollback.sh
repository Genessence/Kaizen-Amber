#!/bin/bash

# Rollback script for failed deployments
# Usage: ./rollback.sh [backup_directory_name]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="${DEPLOY_PATH:-/home/ubuntu/Kaizen-Amber}"
BACKUPS_DIR="$PROJECT_DIR/backups"

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# List available backups
list_backups() {
    echo "Available backups:"
    ls -1t "$BACKUPS_DIR" 2>/dev/null | head -10 || echo "No backups found"
}

# Main rollback function
rollback() {
    local backup_name=$1
    
    if [ -z "$backup_name" ]; then
        print_warning "No backup specified. Listing available backups..."
        list_backups
        echo ""
        read -p "Enter backup directory name to rollback to: " backup_name
    fi
    
    local backup_path="$BACKUPS_DIR/$backup_name"
    
    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        list_backups
        exit 1
    fi
    
    print_status "Rolling back to: $backup_name"
    
    # Stop PM2 process
    print_status "Stopping backend..."
    pm2 stop kaizen-backend 2>/dev/null || true
    
    # Restore backend
    if [ -d "$backup_path/node-backend" ]; then
        print_status "Restoring backend..."
        rm -rf "$PROJECT_DIR/node-backend"
        cp -r "$backup_path/node-backend" "$PROJECT_DIR/node-backend"
    fi
    
    # Restore frontend
    if [ -d "$backup_path/amber-best-flow" ]; then
        print_status "Restoring frontend..."
        rm -rf "$PROJECT_DIR/amber-best-flow"
        cp -r "$backup_path/amber-best-flow" "$PROJECT_DIR/amber-best-flow"
    fi
    
    # Restore ecosystem.config.js if exists
    if [ -f "$backup_path/ecosystem.config.js" ]; then
        print_status "Restoring PM2 config..."
        cp "$backup_path/ecosystem.config.js" "$PROJECT_DIR/ecosystem.config.js"
    fi
    
    # Restart backend
    print_status "Restarting backend..."
    cd "$PROJECT_DIR"
    pm2 delete kaizen-backend 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    # Reload Nginx
    print_status "Reloading Nginx..."
    sudo systemctl reload nginx
    
    # Health check
    print_status "Running health check..."
    sleep 5
    if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        print_status "Rollback successful! Health check passed."
    else
        print_warning "Rollback completed, but health check failed. Please verify manually."
    fi
}

# Show usage
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [backup_directory_name]"
    echo ""
    echo "Examples:"
    echo "  $0                          # List backups and prompt for selection"
    echo "  $0 20240115_143022          # Rollback to specific backup"
    echo ""
    list_backups
    exit 0
fi

rollback "$@"

