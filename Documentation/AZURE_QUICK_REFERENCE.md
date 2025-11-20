# Azure Setup - Quick Reference Card

## 🎯 What You Need to Do in Azure Portal

### 1. Create Storage Account
- **Portal**: https://portal.azure.com
- **Action**: Create a resource → Storage account
- **Name**: Choose unique name (e.g., `amberbp2025`)
- **Region**: Central India / South India
- **Performance**: Standard
- **Redundancy**: LRS

### 2. Create Two Containers
**Navigate**: Storage Account → Containers

**Container 1**:
- Name: `best-practices`
- Public access: **Blob**

**Container 2**:
- Name: `supporting-documents`
- Public access: **Blob**

### 3. Get Connection String
**Navigate**: Storage Account → Access keys → Show (key1)

**Copy**: The entire "Connection string" value

---

## 📝 Update Your .env File

Location: `F:\Kaizen\backend\.env`

```env
# Replace these two lines with your actual values:

AZURE_STORAGE_CONNECTION_STRING=<paste your full connection string here>
AZURE_STORAGE_ACCOUNT_NAME=<your storage account name>

# These should stay the same:
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents
```

---

## ✅ Test Your Setup

```powershell
cd F:\Kaizen\backend
python test_azure_connection.py
```

**Expected**: All green checkmarks ✅

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Name taken | Try different storage account name |
| Connection fails | Re-copy connection string, check for line breaks |
| Container not found | Create containers with exact names |
| Upload fails | Check public access level is "Blob" |

---

## 💰 Cost

**For Testing**: < $1/month  
**Free Tier**: 5GB free for 12 months  

---

## 📞 Help

**Full Guide**: `AZURE_SETUP_GUIDE.md`  
**Test Script**: `backend/test_azure_connection.py`  
**Azure Docs**: https://docs.microsoft.com/azure/storage/

---

**Total Time**: ~15 minutes  
**Difficulty**: Easy  
**Prerequisites**: Azure account (free)

