#!/bin/bash

# Emergency EC2 Cleanup Script
# Run this on your EC2 instance to free up disk space

echo "🚨 EC2 Emergency Disk Cleanup"
echo "=============================="
echo ""

# Show current disk usage
echo "📊 Current disk usage:"
df -h | grep "/$"
echo ""

# Navigate to deployment directory
cd /home/ubuntu/Kaizen-Amber || exit 1

echo "🧹 Cleaning up..."
echo ""

# 1. Remove all old backups except the last one
echo "1️⃣ Removing old backups (keeping only the latest)..."
if [ -d "backups" ]; then
    cd backups
    ls -t | tail -n +2 | xargs -r rm -rf
    cd ..
    echo "   ✅ Old backups removed"
else
    echo "   ℹ️ No backups directory found"
fi

# 2. Remove node_modules directories (will be reinstalled during deployment)
echo "2️⃣ Removing node_modules directories..."
rm -rf node-backend/node_modules
rm -rf amber-best-flow/node_modules
echo "   ✅ node_modules removed"

# 3. Clean npm cache
echo "3️⃣ Cleaning npm cache..."
npm cache clean --force
echo "   ✅ npm cache cleaned"

# 4. Remove old PM2 logs
echo "4️⃣ Cleaning PM2 logs..."
pm2 flush
echo "   ✅ PM2 logs flushed"

# 5. Clean apt cache
echo "5️⃣ Cleaning apt cache..."
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y
echo "   ✅ apt cache cleaned"

# 6. Remove old journal logs
echo "6️⃣ Cleaning system logs..."
sudo journalctl --vacuum-time=7d
echo "   ✅ Old logs removed"

# 7. Find and remove large files (optional - shows top 10 largest)
echo "7️⃣ Top 10 largest files in current directory:"
du -ah /home/ubuntu/Kaizen-Amber | sort -rh | head -n 10

echo ""
echo "📊 Disk usage after cleanup:"
df -h | grep "/$"
echo ""

echo "✅ Cleanup complete!"
echo ""
echo "💡 Next steps:"
echo "1. Re-run the GitHub Actions deployment"
echo "2. Consider upgrading your EC2 instance disk size if this happens frequently"

