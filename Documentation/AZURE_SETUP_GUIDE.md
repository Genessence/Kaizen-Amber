# Azure Blob Storage Setup Guide - Step by Step

Complete guide to setup Azure Blob Storage for the Amber Best Practice Portal file uploads (images and documents).

---

## 📋 Overview

**What you'll setup**:
- Azure Storage Account
- 2 Blob Containers (for images and documents)
- Access keys for your application

**Time needed**: 10-15 minutes  
**Cost**: ~$1/month for testing (Free tier available)

---

## 🎯 Prerequisites

- ✅ Microsoft/Azure account (create free at https://azure.microsoft.com/free/)
- ✅ Access to Azure Portal (https://portal.azure.com)
- ✅ Credit card (for verification, won't be charged on free tier)

---

## Step 1: Login to Azure Portal

### 1.1 Access Portal
1. Open your web browser
2. Go to: **https://portal.azure.com**
3. Click **"Sign in"**
4. Enter your Microsoft account credentials

### 1.2 First Time Setup (If New Account)
If this is your first time:
1. You'll see a welcome screen
2. Click **"Start"** or **"Get started"**
3. You may need to verify your identity
4. Provide payment method (won't be charged during free tier)

### 1.3 Verify You're In
You should see the Azure Portal dashboard with:
- Search bar at top
- Azure services icons
- Navigation menu on left

✅ **Checkpoint**: You're now in Azure Portal

---

## Step 2: Create Storage Account

### 2.1 Start Creation Process
1. Click **"Create a resource"** (top left corner, big + icon)
2. In the search box, type: **"Storage account"**
3. Click on **"Storage account"** from results
4. Click the blue **"Create"** button

### 2.2 Fill Basic Settings Tab

#### Project Details Section:
**Subscription**:
- Select your subscription from dropdown
- (Usually "Free Trial" or "Pay-As-You-Go")

**Resource group**:
- Click **"Create new"** link
- Enter name: `amber-bestpractice-rg`
- Click **"OK"**

#### Instance Details Section:
**Storage account name**:
- Enter: `amberbestpractice2025` (lowercase, no spaces, 3-24 characters)
- ⚠️ **Must be globally unique!** If taken, try:
  - `amberbp2025`
  - `amberbpstorage`
  - `yourname-amberbp`
- ✅ Green checkmark appears when name is available
- 📝 **REMEMBER THIS NAME** - you'll need it later!

**Region**:
- Select closest region to you:
  - India users: **"Central India"** or **"South India"**
  - Other: **"East US"**, **"West Europe"**, etc.

**Performance**:
- Select: **Standard** (recommended for general purpose)

**Redundancy**:
- Select: **Locally-redundant storage (LRS)**
- (Cheapest option, good for testing)

### 2.3 Skip Advanced Tab
1. Click **"Next: Advanced >"** button at bottom
2. Leave all settings as default
3. Click **"Next: Networking >"**

### 2.4 Networking Tab
1. **Connectivity method**: Leave as "Public endpoint (all networks)"
2. Click **"Next: Data protection >"**

### 2.5 Data Protection Tab
1. Leave all defaults (soft delete can be enabled for safety)
2. Click **"Next: Encryption >"**

### 2.6 Encryption Tab
1. Leave defaults (Microsoft-managed keys)
2. Click **"Next: Tags >"**

### 2.7 Tags Tab (Optional)
1. You can add tags like:
   - Name: `Project`, Value: `Amber Best Practice Portal`
   - Name: `Environment`, Value: `Testing`
2. Click **"Next: Review + create >"**

### 2.8 Review and Create
1. Review all settings
2. **Important checks**:
   - Storage account name is correct
   - Region is correct
   - Redundancy is LRS
3. Click **"Create"** button (bottom left)

### 2.9 Wait for Deployment
- Shows "Deployment in progress..."
- Usually takes 1-2 minutes
- Don't close the window

### 2.10 Deployment Complete
- You'll see "Your deployment is complete"
- Click **"Go to resource"** button

✅ **Checkpoint**: Storage Account Created!

---

## Step 3: Create Blob Containers

You should now be in your storage account overview page.

### 3.1 Navigate to Containers
1. Look at left sidebar (navigation menu)
2. Under **"Data storage"** section
3. Click **"Containers"**

You'll see an empty list (no containers yet).

### 3.2 Create First Container (For Images)

#### Click "+ Container" Button
- It's at the top of the page

#### Fill Container Details:
**Name**: `best-practices`
- ⚠️ **Must be exactly this**: `best-practices` (lowercase, with hyphen)
- This is where before/after images will be stored

**Public access level**:
- Select: **"Blob (anonymous read access for blobs only)"**
- This allows images to be viewed via URL without authentication
- ⚠️ Important for displaying images in your app

#### Create Container
- Click **"Create"** button
- Container appears in list within seconds

### 3.3 Create Second Container (For Documents)

#### Click "+ Container" Button Again

#### Fill Container Details:
**Name**: `supporting-documents`
- ⚠️ **Must be exactly this**: `supporting-documents` (lowercase, with hyphen)
- This is where PDF and other documents will be stored

**Public access level**:
- Select: **"Blob (anonymous read access for blobs only)"**

#### Create Container
- Click **"Create"** button

### 3.4 Verify Both Containers Created
You should now see in the list:
```
✅ best-practices
✅ supporting-documents
```

✅ **Checkpoint**: Both containers created!

---

## Step 4: Get Connection String

### 4.1 Navigate to Access Keys
1. In left sidebar, scroll down
2. Under **"Security + networking"** section
3. Click **"Access keys"**

### 4.2 View Keys
- You'll see a warning message (normal for production, OK for testing)
- You'll see two keys: **key1** and **key2**
- Click **"Show"** button next to **key1**

### 4.3 Copy Connection String
1. Under **key1**, find **"Connection string"**
2. Click the **📋 copy icon** to the right
3. The connection string will be copied to clipboard

It looks like this (one long line):
```
DefaultEndpointsProtocol=https;AccountName=amberbestpractice2025;AccountKey=veryLongRandomString123456789ABCDEF==;EndpointSuffix=core.windows.net
```

### 4.4 Save It Securely
- Paste it in a text file temporarily
- Or directly into your .env file
- ⚠️ **Don't share this publicly** - it's like a password!

✅ **Checkpoint**: Connection string copied!

---

## Step 5: Update Your .env File

### 5.1 Open .env File
Navigate to: `F:\Kaizen\backend\.env`

### 5.2 Update Azure Configuration

Find these lines (around line 19-23):
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccountname;AccountKey=yourkey;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=youraccountname
```

Replace with your actual values:

**Line 1 - Connection String**:
```env
AZURE_STORAGE_CONNECTION_STRING=<PASTE YOUR ENTIRE CONNECTION STRING HERE>
```

**Example**:
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=amberbestpractice2025;AccountKey=veryLongKey123==;EndpointSuffix=core.windows.net
```

**Line 2 - Account Name**:
```env
AZURE_STORAGE_ACCOUNT_NAME=amberbestpractice2025
```
(Use YOUR storage account name you created in Step 2.2)

### 5.3 Verify Container Names
Make sure these lines match exactly:
```env
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents
```

### 5.4 Fix Database URL (Important!)

Your current DATABASE_URL is incomplete:
```env
DATABASE_URL=database-1.cluster-c90q66es89vi.ap-south-1.rds.amazonaws.com
```

**If using AWS RDS**, update to:
```env
DATABASE_URL=postgresql://username:password@database-1.cluster-c90q66es89vi.ap-south-1.rds.amazonaws.com:5432/amber_bp
```
Replace:
- `username` with your RDS master username
- `password` with your RDS master password
- `amber_bp` with your actual database name

**If using local PostgreSQL**, use:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/amber_bp
```

### 5.5 Save .env File
- Save the file (Ctrl+S)
- Make sure no extra spaces or line breaks in connection string

✅ **Checkpoint**: .env file updated!

---

## Step 6: Test Connection

### 6.1 Create Test Script

Create file: `F:\Kaizen\backend\test_azure_connection.py`

```python
"""
Test Azure Blob Storage Connection
Run this to verify your Azure setup is correct
"""

import os
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient

# Load environment variables
load_dotenv()

def test_azure_connection():
    """Test connection to Azure Blob Storage"""
    
    print("="*60)
    print("  Azure Blob Storage Connection Test")
    print("="*60)
    print()
    
    # Get credentials from .env
    connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    account_name = os.getenv('AZURE_STORAGE_ACCOUNT_NAME')
    container_practices = os.getenv('AZURE_STORAGE_CONTAINER_PRACTICES')
    container_documents = os.getenv('AZURE_STORAGE_CONTAINER_DOCUMENTS')
    
    # Verify environment variables loaded
    print("Step 1: Checking environment variables...")
    if not connection_string or connection_string == 'DefaultEndpointsProtocol=https;AccountName=youraccountname;AccountKey=yourkey;EndpointSuffix=core.windows.net':
        print("❌ AZURE_STORAGE_CONNECTION_STRING not configured")
        print("   Please update your .env file with real Azure credentials")
        return False
    
    if not account_name or account_name == 'youraccountname':
        print("❌ AZURE_STORAGE_ACCOUNT_NAME not configured")
        return False
    
    print(f"✅ Account Name: {account_name}")
    print(f"✅ Connection string loaded (length: {len(connection_string)} chars)")
    print()
    
    # Test connection
    print("Step 2: Connecting to Azure...")
    try:
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        print("✅ Connection established!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Check connection string has no line breaks")
        print("  2. Verify AccountKey is complete")
        print("  3. Try regenerating key in Azure Portal")
        return False
    
    print()
    
    # List containers
    print("Step 3: Listing containers...")
    try:
        containers = list(blob_service_client.list_containers())
        print(f"✅ Found {len(containers)} container(s):")
        for container in containers:
            print(f"   - {container.name}")
    except Exception as e:
        print(f"❌ Failed to list containers: {e}")
        return False
    
    print()
    
    # Check required containers exist
    print("Step 4: Verifying required containers...")
    container_names = [c.name for c in containers]
    
    if container_practices in container_names:
        print(f"✅ '{container_practices}' container found")
    else:
        print(f"❌ '{container_practices}' container NOT found")
        print(f"   Create it in Azure Portal: Containers → + Container")
        print(f"   Name: {container_practices}")
        print(f"   Public access: Blob")
        return False
    
    if container_documents in container_names:
        print(f"✅ '{container_documents}' container found")
    else:
        print(f"❌ '{container_documents}' container NOT found")
        print(f"   Create it in Azure Portal")
        return False
    
    print()
    
    # Test upload
    print("Step 5: Testing file upload...")
    try:
        test_container = blob_service_client.get_container_client(container_practices)
        test_blob = test_container.get_blob_client('test/connection_test.txt')
        
        test_content = b"Azure Blob Storage connection test successful!"
        test_blob.upload_blob(test_content, overwrite=True)
        
        print("✅ Test file uploaded successfully!")
        print(f"   URL: {test_blob.url}")
        
        # Clean up test file
        test_blob.delete_blob()
        print("✅ Test file cleaned up")
        
    except Exception as e:
        print(f"❌ Upload test failed: {e}")
        return False
    
    print()
    print("="*60)
    print("  🎉 Azure Blob Storage Setup Complete!")
    print("="*60)
    print()
    print("Your application can now upload files to Azure!")
    print()
    
    return True

if __name__ == "__main__":
    success = test_azure_connection()
    exit(0 if success else 1)
```

### 6.2 Run Test Script

```powershell
cd F:\Kaizen\backend
python test_azure_connection.py
```

### 6.3 Expected Output (Success)

```
============================================================
  Azure Blob Storage Connection Test
============================================================

Step 1: Checking environment variables...
✅ Account Name: amberbestpractice2025
✅ Connection string loaded (length: 267 chars)

Step 2: Connecting to Azure...
✅ Connection established!

Step 3: Listing containers...
✅ Found 2 container(s):
   - best-practices
   - supporting-documents

Step 4: Verifying required containers...
✅ 'best-practices' container found
✅ 'supporting-documents' container found

Step 5: Testing file upload...
✅ Test file uploaded successfully!
   URL: https://amberbestpractice2025.blob.core.windows.net/best-practices/test/connection_test.txt
✅ Test file cleaned up

============================================================
  🎉 Azure Blob Storage Setup Complete!
============================================================

Your application can now upload files to Azure!
```

### 6.4 If You See Errors

**Error: "AccountKey not found"**
- Go back to Step 4.3
- Make sure you copied the ENTIRE connection string
- No line breaks or missing characters

**Error: "Container not found"**
- Go back to Step 3
- Verify containers are created
- Check spelling exactly matches

**Error: "Authentication failed"**
- Connection string might be incomplete
- Try copying it again from Azure Portal
- Or regenerate key in Azure Portal

---

## Step 7: Verify in Azure Portal

### 7.1 View Storage in Portal
1. Go to Azure Portal
2. Click **"Storage accounts"** in left menu
3. Click your storage account name
4. Click **"Containers"**
5. You should see both containers

### 7.2 Check Container Settings
1. Click on **"best-practices"** container
2. Verify **"Public access level"** shows **"Blob"**
3. Go back and check **"supporting-documents"** too

### 7.3 Monitor Storage Usage
1. In your storage account overview
2. You can see:
   - Total data stored
   - Number of transactions
   - Costs (should be near $0 for testing)

---

## Step 8: Start Your Application

### 8.1 Start Backend
```powershell
cd F:\Kaizen\backend
python run.py
```

Should start successfully now with Azure configured!

### 8.2 Start Frontend
```powershell
cd F:\Kaizen\amber-best-flow
npm run dev
```

### 8.3 Test File Upload
1. Login to application
2. Click "Add Best Practice"
3. Fill in form
4. Upload before/after images
5. Submit

Images should now upload to Azure! ✅

---

## 📊 Understanding Azure Storage Costs

### Free Tier (First 12 Months)
- 5 GB blob storage free
- 20,000 read operations free
- 2,000 write operations free

### After Free Tier (Pay-as-you-go)
**Storage**: ~$0.018 per GB/month
- 100 images (~50MB) = $0.001/month
- 1000 images (~500MB) = $0.009/month

**Transactions**: ~$0.0004 per 10,000 operations
- Very cheap for testing/small use

**Estimated Monthly Cost for Testing**: < $1

### Cost Control Tips
1. **Delete old files**: Use lifecycle management
2. **Monitor usage**: Check Azure Portal regularly
3. **Set alerts**: Get notified if costs exceed threshold
4. **Use LRS**: Cheapest redundancy option

---

## 🔒 Security Best Practices

### For Testing (Current Setup)
✅ Public read access for blobs (allows image URLs to work)  
✅ Connection string in .env file (not committed to git)  
✅ Containers specific to your app

### For Production
- [ ] Use Azure Key Vault for connection strings
- [ ] Configure firewall rules
- [ ] Enable soft delete
- [ ] Set up lifecycle management
- [ ] Use SAS tokens instead of public access
- [ ] Enable Azure Active Directory authentication
- [ ] Monitor access logs

---

## 🔧 Troubleshooting

### Problem: Can't find "Create a resource"

**Solution**:
- Look for the **"+"** icon in top left
- Or click "Home" and look for "Create a resource" card

### Problem: Storage account name taken

**Solution**:
- Try different names: `amberbp2025test`, `yourinitials-amberbp`
- Must be 3-24 characters, lowercase, numbers only
- Globally unique across all Azure

### Problem: No containers appear after creation

**Solution**:
- Refresh the page
- Click "Containers" menu item again
- Check you're in the right storage account

### Problem: Test script fails with "Module not found"

**Solution**:
```powershell
pip install azure-storage-blob azure-identity python-dotenv
```

### Problem: Connection string doesn't work

**Solution**:
1. Go to Azure Portal → Your Storage Account
2. Access keys → Regenerate key1
3. Copy NEW connection string
4. Update .env file
5. Try again

---

## 📝 Quick Reference

### What You Created:

**Storage Account**:
- Name: `amberbestpractice2025` (your chosen name)
- Region: Your selected region
- Type: Standard LRS
- Resource Group: `amber-bestpractice-rg`

**Containers**:
1. `best-practices` (for images)
2. `supporting-documents` (for PDF files)

**Access**:
- Public level: Blob (anonymous read)
- Authentication: Connection string

### Your .env Should Have:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=amberbestpractice2025;AccountKey=YOUR_REAL_KEY_HERE==;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=amberbestpractice2025
AZURE_STORAGE_CONTAINER_PRACTICES=best-practices
AZURE_STORAGE_CONTAINER_DOCUMENTS=supporting-documents
```

---

## ✅ Verification Checklist

Before proceeding, verify:

- [ ] Azure Storage Account created
- [ ] Storage account name is unique and remembered
- [ ] `best-practices` container exists
- [ ] `supporting-documents` container exists
- [ ] Both containers have "Blob" public access
- [ ] Connection string copied from Azure Portal
- [ ] AZURE_STORAGE_CONNECTION_STRING updated in .env
- [ ] AZURE_STORAGE_ACCOUNT_NAME updated in .env
- [ ] Container names in .env match exactly
- [ ] Test script runs successfully (all ✅)
- [ ] Backend starts without Azure errors
- [ ] Can upload images through application

---

## 🎯 Next Steps

After Azure is setup:

1. ✅ **Test Connection**: Run `python test_azure_connection.py`
2. ✅ **Start Backend**: `python run.py`
3. ✅ **Start Frontend**: `npm run dev`
4. ✅ **Test Upload**: Create a practice with images
5. ✅ **Verify in Azure**: Check files appear in containers

---

## 📞 Getting Help

### Azure Support
- **Documentation**: https://docs.microsoft.com/azure/storage/
- **Free Support**: Azure Portal chat (bottom right)
- **Community**: Stack Overflow tag `azure-storage`

### Common Issues
- Connection string issues → Regenerate key
- Container not found → Check spelling exactly
- Upload fails → Check public access level
- Costs too high → Review pricing tier

---

## 🎊 Success Indicators

You'll know setup is successful when:

✅ Test script shows all green checkmarks  
✅ Backend starts without errors  
✅ You can create a practice with images  
✅ Images appear in Azure Portal containers  
✅ Images display in your application  

---

## 📸 Visual Guide Summary

### Azure Portal Navigation:
```
Azure Portal Home
    ↓
Create a resource
    ↓
Storage account → Create
    ↓
Fill form → Review + create → Create
    ↓
Go to resource
    ↓
Containers (left menu)
    ↓
+ Container → Create two containers
    ↓
Access keys (left menu)
    ↓
Show → Copy connection string
    ↓
Paste in .env file
```

---

## 🎓 What You Learned

By completing this setup, you've:
1. Created Azure Storage Account
2. Configured blob containers
3. Generated access keys
4. Integrated cloud storage with your app
5. Tested the connection
6. Secured credentials properly

**This is production-level cloud infrastructure!** 🎉

---

**Time to Complete**: 10-15 minutes  
**Difficulty**: Beginner-friendly  
**Cost**: < $1/month for testing  
**Status**: Ready to use!  

**Now your application can store files in the cloud!** ☁️

