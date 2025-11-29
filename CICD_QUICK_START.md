# CI/CD Quick Start Guide

Get your CI/CD pipeline running in 5 minutes!

## 🚀 Quick Setup (5 Steps)

### Step 1: Generate SSH Key (2 minutes)

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github-actions-deploy
```

### Step 2: Add Public Key to EC2 (1 minute)

```bash
# Copy public key to EC2
ssh-copy-id -i ~/.ssh/github-actions-deploy.pub ubuntu@YOUR_EC2_IP

# Or manually:
cat ~/.ssh/github-actions-deploy.pub | ssh ubuntu@YOUR_EC2_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Add Secrets to GitHub (1 minute)

1. Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these 3 secrets:

| Secret Name | How to Get It |
|------------|---------------|
| `EC2_HOST` | Your EC2 public IP or domain |
| `EC2_USER` | Usually `ubuntu` (for Ubuntu AMI) |
| `EC2_SSH_KEY` | Run: `cat ~/.ssh/github-actions-deploy` (copy entire output) |

### Step 4: Push to Main (30 seconds)

```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

### Step 5: Watch It Deploy! (1 minute)

1. Go to **GitHub** → **Actions** tab
2. Watch the workflow run
3. Check your app: `http://YOUR_EC2_IP`

## ✅ That's It!

Your CI/CD is now set up. Every push to `main` will automatically:
- ✅ Run tests
- ✅ Build the app
- ✅ Deploy to EC2
- ✅ Run migrations
- ✅ Health check

## 🔧 Manual Deployment

Want to deploy manually?

1. Go to **Actions** → **Manual Deployment**
2. Click **Run workflow**
3. Select options and run

## 🔙 Rollback

If something goes wrong:

```bash
# SSH into EC2
ssh ubuntu@YOUR_EC2_IP

# List backups
ls -la /home/ubuntu/Kaizen-Amber/backups/

# Rollback
cd /home/ubuntu/Kaizen-Amber
./scripts/rollback.sh BACKUP_DIRECTORY_NAME
```

## 📚 Need More Help?

- **Full Guide**: See `CICD_SETUP_GUIDE.md`
- **Environment Variables**: See `ENV_VARIABLES_GUIDE.md`
- **Troubleshooting**: Check the troubleshooting section in `CICD_SETUP_GUIDE.md`

## 🎉 Happy Deploying!

