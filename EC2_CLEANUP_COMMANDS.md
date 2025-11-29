# EC2 Cleanup Commands - Run These Now

Current disk usage: **83%** (5.6G used of 6.8G)
Target: Get below **70%** to have room for deployments

## 🧹 Run These Commands in Order

### 1. Check What's Using Space
```bash
cd ~/Kaizen-Amber
du -sh */ | sort -rh
```

### 2. Remove Old Backups
```bash
cd ~/Kaizen-Amber
rm -rf backups/*
echo "✅ Backups removed"
```

### 3. Remove Node Modules
```bash
cd ~/Kaizen-Amber
rm -rf node-backend/node_modules
rm -rf amber-best-flow/node_modules
echo "✅ node_modules removed"
```

### 4. Clean Build Artifacts
```bash
cd ~/Kaizen-Amber
rm -rf node-backend/dist
rm -rf amber-best-flow/dist
echo "✅ Build artifacts removed"
```

### 5. Clean NPM Cache
```bash
npm cache clean --force
echo "✅ npm cache cleaned"
```

### 6. Clean PM2 Logs
```bash
pm2 flush
echo "✅ PM2 logs flushed"
```

### 7. Clean APT Cache
```bash
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y
echo "✅ APT cache cleaned"
```

### 8. Clean System Logs (Older than 3 days)
```bash
sudo journalctl --vacuum-time=3d
echo "✅ System logs cleaned"
```

### 9. Find Large Files (Optional - for inspection)
```bash
sudo du -h /var/log | sort -rh | head -10
sudo du -h /home/ubuntu | sort -rh | head -10
```

### 10. Check Final Disk Usage
```bash
df -h
```

## 🎯 Expected Result

After cleanup, you should see:
- **Usage**: ~40-50% (instead of 83%)
- **Free space**: ~3-4 GB available

## 🚀 One-Line Cleanup (Copy & Paste)

If you want to run everything at once:

```bash
cd ~/Kaizen-Amber && rm -rf backups/* node-backend/node_modules amber-best-flow/node_modules node-backend/dist amber-best-flow/dist && npm cache clean --force && pm2 flush && sudo apt-get clean && sudo apt-get autoclean && sudo apt-get autoremove -y && sudo journalctl --vacuum-time=3d && df -h
```

## ⚠️ What Gets Removed

| Item | Space Saved | Will Be Restored? |
|------|-------------|-------------------|
| backups/* | ~1-2 GB | ❌ No (old backups gone) |
| node_modules | ~2-3 GB | ✅ Yes (next deployment) |
| dist folders | ~100-200 MB | ✅ Yes (next build) |
| npm cache | ~200-500 MB | ✅ Yes (as needed) |
| PM2 logs | ~50-100 MB | ✅ Yes (new logs) |
| apt cache | ~100-300 MB | ✅ Yes (as needed) |
| old system logs | ~100-500 MB | ❌ No (old logs) |

## ✅ After Cleanup

1. **Verify space**: `df -h` should show < 70% usage
2. **Exit SSH**: `exit`
3. **Run deployment** from GitHub Actions

The workflow is now updated to auto-clean before each deployment!

