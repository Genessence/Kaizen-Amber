# Environment Variables Management Guide

This guide explains how to manage environment variables for CI/CD deployments.

## 📋 Overview

Environment variables are critical for application configuration. This guide covers:
- Setting up environment variables on EC2
- Managing secrets securely
- CI/CD integration
- Best practices

---

## 🔐 Environment Variables Structure

### Backend Environment Variables

**Location:** `node-backend/.env`

**Required Variables:**
```env
# Application
NODE_ENV=production
PORT=3000
DEBUG=false

# Database
DATABASE_URL=postgresql://username:password@host:5432/kaizen_amber

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://YOUR_EC2_IP","http://YOUR_DOMAIN"]

# Azure Storage (if using)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=YOUR_ACCOUNT_NAME
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents

# File Upload Limits
MAX_IMAGE_SIZE_MB=10
MAX_DOCUMENT_SIZE_MB=20
ALLOWED_IMAGE_TYPES=["image/jpeg","image/png","image/jpg","image/gif","image/webp"]
ALLOWED_DOCUMENT_TYPES=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### Frontend Environment Variables

**Location:** `amber-best-flow/.env`

**Required Variables:**
```env
VITE_API_BASE_URL=http://YOUR_EC2_IP/api/v1
# Or with domain:
# VITE_API_BASE_URL=https://yourdomain.com/api/v1
```

---

## 🚀 Setting Up Environment Variables on EC2

### Method 1: Manual Setup (Initial Setup)

1. **SSH into EC2:**
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   ```

2. **Create backend .env:**
   ```bash
   cd /home/ubuntu/Kaizen-Amber/node-backend
   nano .env
   # Paste your environment variables
   # Save and exit (Ctrl+X, Y, Enter)
   ```

3. **Create frontend .env:**
   ```bash
   cd /home/ubuntu/Kaizen-Amber/amber-best-flow
   nano .env
   # Add: VITE_API_BASE_URL=http://YOUR_EC2_IP/api/v1
   # Save and exit
   ```

4. **Set proper permissions:**
   ```bash
   chmod 600 /home/ubuntu/Kaizen-Amber/node-backend/.env
   chmod 600 /home/ubuntu/Kaizen-Amber/amber-best-flow/.env
   ```

### Method 2: Using Script (Automated)

Create a script to set up environment variables:

```bash
#!/bin/bash
# scripts/setup-env.sh

EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Backend .env
cat > node-backend/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/kaizen_amber
JWT_SECRET_KEY=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_MINIMUM_32_CHARACTERS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_SECURE_RANDOM_STRING_MINIMUM_32_CHARACTERS
CORS_ORIGINS=["http://$EC2_IP"]
# ... add other variables
EOF

# Frontend .env
cat > amber-best-flow/.env << EOF
VITE_API_BASE_URL=http://$EC2_IP/api/v1
EOF

chmod 600 node-backend/.env amber-best-flow/.env
```

---

## 🔒 Secure Secret Management

### Option 1: AWS Systems Manager Parameter Store (Recommended for AWS)

1. **Store secrets in Parameter Store:**
   ```bash
   aws ssm put-parameter \
     --name "/kaizen-amber/database-url" \
     --value "postgresql://user:pass@host:5432/db" \
     --type "SecureString"

   aws ssm put-parameter \
     --name "/kaizen-amber/jwt-secret" \
     --value "your-secret-key" \
     --type "SecureString"
   ```

2. **Retrieve in deployment script:**
   ```bash
   DATABASE_URL=$(aws ssm get-parameter \
     --name "/kaizen-amber/database-url" \
     --with-decryption \
     --query 'Parameter.Value' \
     --output text)
   ```

### Option 2: AWS Secrets Manager

1. **Store secrets:**
   ```bash
   aws secretsmanager create-secret \
     --name kaizen-amber-secrets \
     --secret-string file://secrets.json
   ```

2. **Retrieve in application:**
   ```javascript
   const AWS = require('aws-sdk');
   const secretsManager = new AWS.SecretsManager();
   
   const secret = await secretsManager.getSecretValue({
     SecretId: 'kaizen-amber-secrets'
   }).promise();
   
   const secrets = JSON.parse(secret.SecretString);
   ```

### Option 3: Encrypted Files (Simple)

1. **Encrypt .env file:**
   ```bash
   # Install gpg
   sudo apt-get install gnupg

   # Encrypt
   gpg -c node-backend/.env
   # This creates .env.gpg

   # Decrypt (on EC2)
   gpg -d node-backend/.env.gpg > node-backend/.env
   ```

---

## 🔄 CI/CD Integration

### GitHub Actions Secrets

For CI/CD, store sensitive values in GitHub Secrets:

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `JWT_REFRESH_SECRET`
   - `AZURE_STORAGE_CONNECTION_STRING`
   - etc.

3. **Use in workflow:**
   ```yaml
   - name: Create .env file
     run: |
       cat > node-backend/.env << EOF
       DATABASE_URL=${{ secrets.DATABASE_URL }}
       JWT_SECRET_KEY=${{ secrets.JWT_SECRET_KEY }}
       EOF
   ```

### Environment-Specific Variables

Create separate secrets for different environments:

- `PROD_DATABASE_URL`
- `STAGING_DATABASE_URL`
- `DEV_DATABASE_URL`

---

## 📝 Environment Variable Template

Create `.env.example` files (commit these, not `.env`):

**`node-backend/.env.example`:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET_KEY=change-this-to-secure-random-string-minimum-32-characters
JWT_REFRESH_SECRET=change-this-to-another-secure-random-string-minimum-32-characters
CORS_ORIGINS=["http://localhost:3000"]
# ... other variables with example values
```

**`amber-best-flow/.env.example`:**
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## ✅ Best Practices

### 1. Never Commit .env Files

Add to `.gitignore`:
```
# Environment variables
.env
.env.local
.env.*.local
*.env
```

### 2. Use Strong Secrets

Generate secure random strings:
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### 3. Rotate Secrets Regularly

- Change JWT secrets every 90 days
- Rotate database passwords quarterly
- Update API keys when compromised

### 4. Use Different Secrets per Environment

- Development
- Staging
- Production

### 5. Validate Environment Variables

Add validation in your application:

```typescript
// node-backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET_KEY: z.string().min(32),
  // ... other validations
});

export const env = envSchema.parse(process.env);
```

---

## 🔍 Verifying Environment Variables

### Check Backend Variables

```bash
cd /home/ubuntu/Kaizen-Amber/node-backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✓ DATABASE_URL set' : '✗ DATABASE_URL missing')"
```

### Check Frontend Variables

```bash
cd /home/ubuntu/Kaizen-Amber/amber-best-flow
cat .env
```

### Test Application Startup

```bash
# Backend
cd /home/ubuntu/Kaizen-Amber/node-backend
npm start
# Should start without errors

# Frontend
cd /home/ubuntu/Kaizen-Amber/amber-best-flow
npm run build
# Should build successfully
```

---

## 🐛 Troubleshooting

### Issue: Application can't connect to database

**Check:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: JWT errors

**Check:**
```bash
# Verify JWT secrets are set and long enough
node -e "require('dotenv').config(); console.log('JWT_SECRET_KEY length:', process.env.JWT_SECRET_KEY?.length)"
```

### Issue: CORS errors

**Check:**
```bash
# Verify CORS_ORIGINS includes your domain
node -e "require('dotenv').config(); console.log('CORS_ORIGINS:', process.env.CORS_ORIGINS)"
```

---

## 📚 Additional Resources

- [12-Factor App: Config](https://12factor.net/config)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

## ✅ Checklist

- [ ] `.env` files created on EC2
- [ ] `.env.example` files committed to repository
- [ ] `.env` files added to `.gitignore`
- [ ] Strong secrets generated
- [ ] Secrets stored securely (Parameter Store/Secrets Manager)
- [ ] GitHub Secrets configured (for CI/CD)
- [ ] Environment variables validated
- [ ] Application starts successfully
- [ ] Database connection works
- [ ] CORS configured correctly

---

**Remember:** Never commit `.env` files to version control! 🔒

