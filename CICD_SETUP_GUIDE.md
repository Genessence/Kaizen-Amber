# CI/CD Setup Guide for EC2 Deployment

This guide will help you set up a complete CI/CD pipeline for deploying your Kaizen-Amber application to Amazon EC2.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [CI/CD Options](#cicd-options)
4. [GitHub Actions Setup](#github-actions-setup) (Recommended)
5. [AWS CodeDeploy Setup](#aws-codedeploy-setup) (Alternative)
6. [Configuration](#configuration)
7. [Deployment Process](#deployment-process)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This CI/CD setup provides:

- ✅ **Automated Testing**: Run tests on every push/PR
- ✅ **Automated Deployment**: Deploy to EC2 on push to main/master
- ✅ **Manual Deployment**: Trigger deployments manually via GitHub Actions
- ✅ **Backup & Rollback**: Automatic backups before each deployment
- ✅ **Health Checks**: Verify deployment success
- ✅ **Zero-Downtime**: PM2 handles graceful restarts

---

## 📦 Prerequisites

### 1. GitHub Repository
- Your code must be in a GitHub repository
- You have push access to the repository

### 2. EC2 Instance Setup
- Ubuntu 20.04+ or Amazon Linux 2
- Node.js 20.x installed
- PM2 installed globally
- Nginx installed and configured
- PostgreSQL database accessible
- SSH access configured

### 3. Required Software on EC2
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Nginx
sudo apt-get install -y nginx
```

---

## 🚀 CI/CD Options

### Option 1: GitHub Actions (Recommended) ⭐

**Pros:**
- ✅ Free for public repositories
- ✅ Easy to set up
- ✅ Integrated with GitHub
- ✅ No additional AWS services needed
- ✅ Great for small to medium teams

**Cons:**
- ⚠️ Requires SSH key management
- ⚠️ Limited to GitHub repositories

### Option 2: AWS CodeDeploy

**Pros:**
- ✅ Native AWS integration
- ✅ Better for enterprise setups
- ✅ More granular control
- ✅ Integration with other AWS services

**Cons:**
- ⚠️ More complex setup
- ⚠️ Additional AWS service costs
- ⚠️ Requires IAM roles and policies

---

## 🔧 GitHub Actions Setup (Recommended)

### Step 1: Generate SSH Key Pair

On your local machine:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github-actions-deploy

# This creates:
# ~/.ssh/github-actions-deploy (private key)
# ~/.ssh/github-actions-deploy.pub (public key)
```

### Step 2: Add Public Key to EC2

```bash
# Copy public key to EC2
ssh-copy-id -i ~/.ssh/github-actions-deploy.pub ubuntu@YOUR_EC2_IP

# Or manually add to ~/.ssh/authorized_keys on EC2
cat ~/.ssh/github-actions-deploy.pub | ssh ubuntu@YOUR_EC2_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Add Private Key to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `EC2_HOST` | `your-ec2-public-ip-or-domain` | EC2 instance IP or domain |
| `EC2_USER` | `ubuntu` | SSH username (usually `ubuntu` for Ubuntu AMI) |
| `EC2_SSH_KEY` | Contents of `~/.ssh/github-actions-deploy` | Private SSH key (entire contents) |

**To get the private key:**
```bash
cat ~/.ssh/github-actions-deploy
# Copy the entire output including -----BEGIN and -----END lines
```

### Step 4: Verify Workflow Files

The workflow files are already created in `.github/workflows/`:

- `deploy.yml` - Automatic deployment on push to main/master
- `deploy-manual.yml` - Manual deployment trigger

### Step 5: Test the Pipeline

1. **Push to main/master branch:**
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

2. **Check GitHub Actions:**
   - Go to your repository on GitHub
   - Click on **Actions** tab
   - Watch the workflow run

3. **Manual Deployment:**
   - Go to **Actions** → **Manual Deployment**
   - Click **Run workflow**
   - Select environment and options
   - Click **Run workflow**

---

## 🔐 AWS CodeDeploy Setup (Alternative)

### Step 1: Create IAM Role for EC2

1. Go to AWS Console → IAM → Roles
2. Create role for EC2 instance
3. Attach policy: `AWSCodeDeployRole`
4. Attach the role to your EC2 instance

### Step 2: Install CodeDeploy Agent on EC2

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install ruby-full wget -y
cd /home/ubuntu
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent start
```

### Step 3: Create CodeDeploy Application

1. Go to AWS Console → CodeDeploy
2. Create application
3. Create deployment group
4. Configure deployment settings

### Step 4: Create appspec.yml

Create `appspec.yml` in project root:

```yaml
version: 0.0
os: linux
files:
  - source: /
    destination: /home/ubuntu/Kaizen-Amber
hooks:
  BeforeInstall:
    - location: scripts/before_install.sh
      timeout: 300
  AfterInstall:
    - location: scripts/after_install.sh
      timeout: 600
  ApplicationStart:
    - location: scripts/application_start.sh
      timeout: 300
```

---

## ⚙️ Configuration

### Environment Variables

**On EC2, ensure these are set in `.env` files:**

**Backend** (`node-backend/.env`):
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_KEY=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGINS=["http://YOUR_EC2_IP"]
# ... other variables
```

**Frontend** (`amber-best-flow/.env`):
```env
VITE_API_BASE_URL=http://YOUR_EC2_IP/api/v1
```

### PM2 Configuration

The `ecosystem.config.js` is already configured. Ensure it points to the correct paths.

### Nginx Configuration

The `nginx.conf` is already configured. Ensure it's properly set up on EC2.

---

## 🔄 Deployment Process

### Automatic Deployment (GitHub Actions)

1. **Push to main/master:**
   ```bash
   git push origin main
   ```

2. **Pipeline runs:**
   - ✅ Run tests
   - ✅ Run linting
   - ✅ Build frontend and backend
   - ✅ Create backup on EC2
   - ✅ Transfer files to EC2
   - ✅ Deploy application
   - ✅ Run database migrations
   - ✅ Health check

3. **Monitor deployment:**
   - Check GitHub Actions tab
   - Check EC2 logs: `pm2 logs kaizen-backend`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Manual Deployment

1. Go to GitHub → Actions → Manual Deployment
2. Click **Run workflow**
3. Select options:
   - Environment: `production` or `staging`
   - Skip tests: `true` or `false`
4. Click **Run workflow**

### Local Deployment (Fallback)

If CI/CD fails, you can deploy manually:

```bash
# On EC2
cd /home/ubuntu/Kaizen-Amber
git pull origin main
./deploy.sh
```

---

## 🔙 Rollback Procedures

### Automatic Rollback

If deployment fails, the backup is automatically created in:
```
/home/ubuntu/Kaizen-Amber/backups/YYYYMMDD_HHMMSS/
```

### Manual Rollback

1. **List available backups:**
   ```bash
   ls -la /home/ubuntu/Kaizen-Amber/backups/
   ```

2. **Use rollback script:**
   ```bash
   cd /home/ubuntu/Kaizen-Amber
   chmod +x scripts/rollback.sh
   ./scripts/rollback.sh 20240115_143022
   ```

3. **Or manually restore:**
   ```bash
   # Stop backend
   pm2 stop kaizen-backend
   
   # Restore from backup
   cd /home/ubuntu/Kaizen-Amber
   rm -rf node-backend amber-best-flow
   cp -r backups/20240115_143022/node-backend .
   cp -r backups/20240115_143022/amber-best-flow .
   
   # Restart
   pm2 restart kaizen-backend
   ```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed

**Error:** `Permission denied (publickey)`

**Solution:**
```bash
# Verify SSH key is correct
cat ~/.ssh/github-actions-deploy.pub | ssh ubuntu@EC2_IP "cat >> ~/.ssh/authorized_keys"

# Test SSH connection
ssh -i ~/.ssh/github-actions-deploy ubuntu@EC2_IP
```

#### 2. Deployment Fails - Build Errors

**Check:**
- Node.js version matches (20.x)
- All dependencies are in package.json
- Environment variables are set

**Solution:**
```bash
# On EC2, check logs
cd /home/ubuntu/Kaizen-Amber
tail -f logs/deploy-*.log
```

#### 3. Health Check Fails

**Check:**
- Backend is running: `pm2 status`
- Port 3000 is accessible: `curl http://localhost:3000/api/v1/health`
- Database connection is working

**Solution:**
```bash
# Check PM2 logs
pm2 logs kaizen-backend

# Check if port is in use
sudo lsof -i :3000

# Restart backend
pm2 restart kaizen-backend
```

#### 4. Nginx Configuration Error

**Check:**
```bash
# Test Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 5. Database Migration Fails

**Check:**
- Database connection string is correct
- Database user has proper permissions
- Prisma client is generated

**Solution:**
```bash
cd /home/ubuntu/Kaizen-Amber/node-backend
npx prisma generate
npx prisma migrate deploy
```

### Debugging GitHub Actions

1. **Enable debug logging:**
   - Add secret: `ACTIONS_STEP_DEBUG` = `true`
   - Add secret: `ACTIONS_RUNNER_DEBUG` = `true`

2. **Check workflow logs:**
   - Go to Actions → Select workflow run → View logs

3. **Test SSH connection:**
   ```bash
   # Use the same SSH key locally
   ssh -i ~/.ssh/github-actions-deploy ubuntu@EC2_IP
   ```

---

## 📊 Monitoring & Alerts

### PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs kaizen-backend

# View metrics
pm2 status
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

```bash
# Deployment logs
tail -f /home/ubuntu/Kaizen-Amber/logs/deploy-*.log

# PM2 logs
pm2 logs kaizen-backend --lines 100
```

---

## 🔒 Security Best Practices

1. **SSH Keys:**
   - Never commit private keys to repository
   - Use GitHub Secrets for sensitive data
   - Rotate SSH keys regularly

2. **Environment Variables:**
   - Never commit `.env` files
   - Use secure storage for secrets
   - Limit access to EC2 instance

3. **Access Control:**
   - Use IAM roles (for AWS CodeDeploy)
   - Limit SSH access to specific IPs
   - Use security groups properly

4. **Monitoring:**
   - Set up CloudWatch alarms (if using AWS)
   - Monitor failed deployments
   - Set up email/Slack notifications

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CodeDeploy Documentation](https://docs.aws.amazon.com/codedeploy/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## ✅ Checklist

Before going live:

- [ ] SSH key pair generated and added to EC2
- [ ] GitHub Secrets configured
- [ ] Environment variables set on EC2
- [ ] Database migrations tested
- [ ] Health check endpoint working
- [ ] Rollback procedure tested
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Security groups configured
- [ ] Domain name configured (if applicable)

---

## 🎉 Success!

Your CI/CD pipeline is now set up! Every push to main/master will automatically:

1. ✅ Run tests
2. ✅ Build the application
3. ✅ Deploy to EC2
4. ✅ Run migrations
5. ✅ Verify health

**Happy deploying!** 🚀

