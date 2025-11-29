# EC2 Disk Full - Emergency Fix Guide

## 🚨 Problem

Your EC2 instance is out of disk space:
- **Current usage**: 95.2% of 6.71GB
- **Error**: `No space left on device`
- **Impact**: Deployment failing, cannot create backups

## ⚡ Immediate Solution

### Option 1: Run Cleanup Script (Recommended)

1. **Upload the cleanup script to EC2**:
   ```bash
   # From your local machine
   scp -i "F:\Kaizen\Amber-kaizen.pem" ec2-emergency-cleanup.sh ubuntu@your-ec2-ip:/home/ubuntu/
   ```

2. **SSH to your EC2 instance**:
   ```bash
   ssh -i "F:\Kaizen\Amber-kaizen.pem" ubuntu@your-ec2-ip
   ```

3. **Run the cleanup script**:
   ```bash
   chmod +x ec2-emergency-cleanup.sh
   ./ec2-emergency-cleanup.sh
   ```

### Option 2: Manual Cleanup

If you can't upload the script, SSH to EC2 and run these commands manually:

```bash
# 1. Go to deployment directory
cd /home/ubuntu/Kaizen-Amber

# 2. Remove old backups (keep only latest)
cd backups
ls -t | tail -n +2 | xargs rm -rf
cd ..

# 3. Remove node_modules (will be reinstalled)
rm -rf node-backend/node_modules
rm -rf amber-best-flow/node_modules

# 4. Clean npm cache
npm cache clean --force

# 5. Clean PM2 logs
pm2 flush

# 6. Clean system packages
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y

# 7. Clean system logs
sudo journalctl --vacuum-time=7d

# 8. Check disk space
df -h
```

## 🔄 After Cleanup

### Step 1: Commit Workflow Changes

The workflow has been updated to automatically clean up before deployment.

```bash
git add .github/workflows/deploy.yml
git add ec2-emergency-cleanup.sh
git add EC2_DISK_FULL_FIX.md
git commit -m "fix: add automatic cleanup to prevent disk full errors"
git push origin test
```

### Step 2: Re-run Deployment

1. Go to GitHub Actions
2. Re-run the failed workflow
3. The deployment should now succeed

## 🛡️ Prevention Strategy

### 1. Workflow Now Auto-Cleans

The updated workflow:
- ✅ Removes old backups (keeps only last 2)
- ✅ Cleans node_modules before extracting new files
- ✅ Shows disk space after cleanup

### 2. Regular Maintenance

Set up a cron job on EC2 to clean up weekly:

```bash
# SSH to EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Create cron job
crontab -e

# Add this line (runs every Sunday at 2 AM):
0 2 * * 0 cd /home/ubuntu/Kaizen-Amber && rm -rf node-backend/node_modules amber-best-flow/node_modules && npm cache clean --force
```

### 3. Upgrade EC2 Storage

If this problem persists, upgrade your EC2 volume:

1. **Go to AWS Console** → EC2 → Volumes
2. **Select your volume** → Actions → Modify Volume
3. **Increase size** to at least 15-20 GB
4. **Reboot EC2** instance
5. **Resize filesystem**:
   ```bash
   sudo growpart /dev/xvda 1
   sudo resize2fs /dev/xvda1
   ```

## 📊 Disk Space Analysis

### What's Using Space:

```
node_modules/     ~2-3 GB
backups/          ~2-4 GB (accumulates over time)
dist/             ~100 MB
npm cache         ~500 MB
logs              ~100-500 MB
```

### Recommended Actions:

| Action | Space Saved | Impact |
|--------|-------------|---------|
| Remove old backups | 2-4 GB | Low - keeps latest |
| Remove node_modules | 2-3 GB | None - reinstalled |
| Clean npm cache | 500 MB | None |
| Clean apt cache | 200-500 MB | None |
| Clean logs | 100-500 MB | None |

## 🎯 Quick Reference

### Check Disk Space
```bash
df -h
du -sh /home/ubuntu/Kaizen-Amber/*
```

### Clean Specific Directories
```bash
# Backups
rm -rf /home/ubuntu/Kaizen-Amber/backups/*

# Node modules
rm -rf /home/ubuntu/Kaizen-Amber/*/node_modules

# Logs
pm2 flush
sudo journalctl --vacuum-time=3d
```

### Emergency Space Recovery
```bash
# Nuclear option - removes everything except source code
cd /home/ubuntu/Kaizen-Amber
rm -rf backups node-backend/node_modules amber-best-flow/node_modules node-backend/dist amber-best-flow/dist
npm cache clean --force
```

## ✅ Success Checklist

- [ ] SSH to EC2 instance
- [ ] Run cleanup script or manual commands
- [ ] Verify disk space is below 80%
- [ ] Commit and push workflow changes
- [ ] Re-run GitHub Actions deployment
- [ ] Deployment succeeds
- [ ] Set up automatic cleanup (cron job or larger disk)

## 🆘 Still Having Issues?

If you're still running out of space after cleanup:

1. **Check what's using space**:
   ```bash
   sudo du -h --max-depth=2 / | sort -rh | head -20
   ```

2. **Increase EC2 volume size** (recommended minimum: 15 GB)

3. **Consider using S3** for large files/backups instead of local storage

---

**Current Status**: Workflow updated to auto-clean before deployment  
**Next Step**: Run cleanup script on EC2, then re-run deployment

