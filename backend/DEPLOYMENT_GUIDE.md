# Production Deployment Guide

Guide for deploying the Amber Best Practice Portal backend to production.

## Pre-Deployment Checklist

### Security ✅
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET_KEY (32+ characters)
- [ ] Set DEBUG=false in production
- [ ] Configure proper CORS_ORIGINS (frontend domain only)
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall rules
- [ ] Configure Azure Storage access policies
- [ ] Review and restrict API permissions

### Database ✅
- [ ] PostgreSQL production instance setup
- [ ] Database backups configured
- [ ] Connection string secured
- [ ] Run migrations on production DB
- [ ] Seed initial data (categories, plants)
- [ ] Setup database user with limited permissions

### Infrastructure ✅
- [ ] Production server/VM provisioned
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] Reverse proxy setup (nginx/traefik)
- [ ] Load balancer (if needed)
- [ ] CDN for static assets

### Monitoring ✅
- [ ] Logging setup (file/cloud)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Alert configuration

---

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1.1 Setup Production Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip

# Install PostgreSQL client
sudo apt install postgresql-client

# Install nginx
sudo apt install nginx
```

#### 1.2 Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/amber-api
cd /var/www/amber-api

# Clone or copy your code
# Upload via SCP, Git, or FTP

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn
```

#### 1.3 Configure Environment

```bash
# Create .env file (use environment variables instead)
# Or set in systemd service file
export DATABASE_URL="postgresql://user:pass@prod-db:5432/amber_bp"
export JWT_SECRET_KEY="your-production-secret-key-min-32-chars"
export AZURE_STORAGE_CONNECTION_STRING="your-azure-connection"
export DEBUG="false"
export CORS_ORIGINS='["https://yourdomain.com"]'
```

#### 1.4 Run Migrations

```bash
alembic upgrade head
python app/seed_data.py
```

#### 1.5 Setup Systemd Service

Create `/etc/systemd/system/amber-api.service`:

```ini
[Unit]
Description=Amber Best Practice Portal API
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/amber-api
Environment="PATH=/var/www/amber-api/venv/bin"
Environment="DATABASE_URL=postgresql://user:pass@localhost:5432/amber_bp"
Environment="JWT_SECRET_KEY=your-secret-key"
Environment="AZURE_STORAGE_CONNECTION_STRING=your-connection-string"
Environment="DEBUG=false"
ExecStart=/var/www/amber-api/venv/bin/gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  -b 127.0.0.1:8000 \
  --access-logfile /var/log/amber-api/access.log \
  --error-logfile /var/log/amber-api/error.log
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 1.6 Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable amber-api
sudo systemctl start amber-api
sudo systemctl status amber-api
```

#### 1.7 Configure Nginx

Create `/etc/nginx/sites-available/amber-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
        add_header 'Access-Control-Allow-Credentials' 'true';
    }

    # Increase upload size for file uploads
    client_max_body_size 20M;
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/amber-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option 2: Docker Deployment

#### 2.1 Build Image

```bash
cd F:\Kaizen\backend
docker build -t amber-api:1.0.0 .
```

#### 2.2 Run with Docker Compose

```bash
# Production docker-compose.yml
docker-compose -f docker-compose.prod.yml up -d
```

#### 2.3 Run Migrations

```bash
docker-compose exec api alembic upgrade head
docker-compose exec api python app/seed_data.py
```

---

### Option 3: Azure App Service

#### 3.1 Create App Service

```bash
az webapp up \
  --resource-group amber-rg \
  --name amber-api \
  --runtime "PYTHON:3.11" \
  --sku B1
```

#### 3.2 Configure App Settings

Set environment variables in Azure Portal:
- DATABASE_URL
- JWT_SECRET_KEY
- AZURE_STORAGE_CONNECTION_STRING
- DEBUG=false

#### 3.3 Deploy

```bash
az webapp deploy \
  --resource-group amber-rg \
  --name amber-api \
  --src-path amber-api.zip
```

---

### Option 4: AWS EC2 / DigitalOcean / GCP

Similar to Option 1 (Traditional Server Deployment).

Use respective cloud provider's:
- Managed PostgreSQL (RDS, Cloud SQL, etc.)
- Load balancers
- Auto-scaling groups
- Monitoring tools

---

## Database Setup (Production)

### Using Managed PostgreSQL

#### Azure Database for PostgreSQL
```bash
az postgres server create \
  --resource-group amber-rg \
  --name amber-postgres \
  --admin-user pgadmin \
  --admin-password YourSecurePassword \
  --sku-name B_Gen5_1
```

#### AWS RDS
```bash
aws rds create-db-instance \
  --db-instance-identifier amber-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username pgadmin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20
```

### Run Production Migrations

```bash
# From your production server
cd /var/www/amber-api
source venv/bin/activate
alembic upgrade head
python app/seed_data.py
```

---

## Environment Variables (Production)

### Required Variables

```bash
# Application
APP_NAME="Amber Best Practice Portal"
APP_VERSION="1.0.0"
DEBUG="false"
CORS_ORIGINS='["https://yourdomain.com"]'

# Database (Use managed database URL)
DATABASE_URL="postgresql://user:pass@prod-db.postgres.database.azure.com:5432/amber_bp?sslmode=require"

# JWT (Generate new secret!)
JWT_SECRET_KEY="CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-MIN-32-CHARS"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="30"
REFRESH_TOKEN_EXPIRE_DAYS="7"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=yourprodaccount;AccountKey=..."
AZURE_STORAGE_ACCOUNT_NAME="yourprodaccount"

# File limits
MAX_IMAGE_SIZE_MB="10"
MAX_DOCUMENT_SIZE_MB="20"
```

### Generate Secure Keys

```python
import secrets
print("JWT Secret Key:", secrets.token_urlsafe(32))
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Application Logging

Update `app/main.py` to add logging:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/amber-api/app.log'),
        logging.StreamHandler()
    ]
)
```

### Error Tracking with Sentry

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=0.1,
)
```

### Performance Monitoring

Use APM tools:
- New Relic
- DataDog
- Elastic APM

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/amber-api"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U postgres amber_bp > "$BACKUP_DIR/amber_bp_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### Blob Storage Backups

Azure Blob Storage has built-in redundancy, but consider:
- Geo-redundant storage (GRS)
- Soft delete enabled
- Version control enabled

---

## Performance Optimization

### Database Connection Pooling

Already configured in `app/database.py`:
```python
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=0
```

Adjust based on load:
- Small: 10-20 connections
- Medium: 20-50 connections
- Large: 50-100+ connections

### Add Redis Cache (Optional)

```bash
pip install redis
```

```python
# Cache frequently accessed data
# - Category list
# - Plant list
# - Benchmarked practices count
```

### Enable Database Query Logging

Temporarily enable to identify slow queries:

```python
# app/database.py
engine = create_engine(DATABASE_URL, echo=True)
```

Then optimize with indexes or query rewrites.

---

## Scaling Strategy

### Vertical Scaling
- Increase server CPU/RAM
- Increase database resources
- Increase worker count

### Horizontal Scaling
- Multiple API servers behind load balancer
- Session-less JWT (already implemented)
- Shared PostgreSQL instance
- Shared Azure Storage

### Architecture for Scale

```
                                    ┌─────────────┐
                                    │   Load      │
                                    │  Balancer   │
                                    └─────────────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      │                    │                    │
                 ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
                 │  API    │         │  API    │         │  API    │
                 │ Server 1│         │ Server 2│         │ Server 3│
                 └────┬────┘         └────┬────┘         └────┬────┘
                      │                   │                   │
                      └───────────────────┼───────────────────┘
                                          │
                                    ┌─────┴─────┐
                                    │PostgreSQL │
                                    │  Primary  │
                                    └───────────┘
```

---

## Health Checks

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Docker Health Check

Already configured in `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"
```

---

## CI/CD Pipeline Example

### GitHub Actions

```yaml
name: Deploy API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest
      
      - name: Deploy to production
        run: |
          # Your deployment script
          ssh user@server 'cd /var/www/amber-api && git pull && systemctl restart amber-api'
```

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amber.com","password":"admin123","remember_me":false}'
```

### 2. Create Production Users

Change default passwords immediately:

```bash
# Access your production database or API
# Update passwords for all default users
```

### 3. Monitor Logs

```bash
# Application logs
tail -f /var/log/amber-api/app.log

# nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# systemd logs
journalctl -u amber-api -f
```

### 4. Performance Baseline

- Measure response times
- Check database query performance
- Monitor memory usage
- Monitor CPU usage

---

## Rollback Plan

### Quick Rollback

```bash
# Stop new version
sudo systemctl stop amber-api

# Restore previous version
cd /var/www/amber-api
git checkout previous-commit

# Restart
sudo systemctl start amber-api
```

### Database Rollback

```bash
# Rollback migrations
alembic downgrade -1

# Or restore from backup
psql -U postgres amber_bp < backup_20251120.sql
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check disk space
- Verify backups

**Weekly:**
- Review performance metrics
- Update dependencies (security patches)
- Clean old logs

**Monthly:**
- Database maintenance (VACUUM, ANALYZE)
- Review and optimize slow queries
- Capacity planning
- Security audit

### Database Maintenance

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE amber_bp;

-- Check bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Security Best Practices

### 1. Environment Variables

**Never commit `.env` to version control!**

Use:
- Environment variables
- Secret managers (Azure Key Vault, AWS Secrets Manager)
- Configuration services

### 2. Database Security

```bash
# Create limited database user
CREATE USER amber_api WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE amber_bp TO amber_api;
GRANT USAGE ON SCHEMA public TO amber_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO amber_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO amber_api;
```

### 3. API Rate Limiting

Add `slowapi` for rate limiting:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(...):
    ...
```

### 4. CORS Configuration

```python
# Production CORS (restrictive)
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]

# NO wildcards in production!
```

---

## Cost Optimization

### Azure

1. **Use Azure Blob Storage Lifecycle**:
   - Move old images to cool tier after 90 days
   - Archive after 1 year

2. **Use Azure PostgreSQL Basic Tier** for small deployments

3. **Enable Azure CDN** for blob storage

### Database

1. **Connection Pooling**: Reduce database connections
2. **Query Optimization**: Use EXPLAIN ANALYZE
3. **Proper Indexes**: Monitor query performance

---

## Troubleshooting Production Issues

### High CPU Usage

1. Check database queries (slow queries log)
2. Review worker count (reduce if needed)
3. Check for infinite loops or blocking calls

### High Memory Usage

1. Check connection pool size
2. Look for memory leaks
3. Monitor Python processes

### Slow API Responses

1. Check database query performance
2. Review indexes
3. Enable query logging
4. Check Azure storage latency
5. Add caching (Redis)

### Database Connection Errors

1. Check connection pool size
2. Verify DATABASE_URL
3. Check PostgreSQL max_connections
4. Review network connectivity

---

## Support & Maintenance Contacts

**Development Team**: [Your team contact]  
**Database Admin**: [DBA contact]  
**DevOps**: [DevOps contact]  
**Azure Support**: [Azure support link]

---

**Deployment Checklist Status**: Review before each deployment  
**Last Updated**: November 20, 2025  
**Version**: 1.0.0

