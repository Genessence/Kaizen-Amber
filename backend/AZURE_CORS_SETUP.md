# Azure Blob Storage CORS Configuration Guide

## Problem
When uploading files directly from the frontend to Azure Blob Storage using presigned URLs, you may encounter CORS errors:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

This happens because Azure Blob Storage needs to be configured to allow cross-origin requests from your frontend application.

## Solution

### Option 1: Configure CORS Programmatically (Recommended)

Run the provided script to automatically configure CORS:

```bash
cd backend
python configure_azure_cors.py
```

This script will:
- Read allowed origins from your `.env` file (`CORS_ORIGINS`)
- Configure Azure Blob Storage CORS settings
- Allow common development origins (localhost:8080, localhost:5173, etc.)

### Option 2: Configure CORS via Azure Portal

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Find your Storage Account (e.g., `amberkaizen` or `amberbestpractice`)

2. **Open CORS Settings**
   - Click on your Storage Account
   - In the left menu, scroll down to **Settings** → **Resource sharing (CORS)**
   - Click on **Blob service**

3. **Add CORS Rules**
   - Click **+ Add** to add a new CORS rule
   - Configure as follows:
     - **Allowed origins**: 
       - `http://localhost:8080`
       - `http://localhost:5173`
       - `http://localhost:3000`
       - Add your production domain when ready
     - **Allowed methods**: 
       - `GET`
       - `PUT`
       - `POST`
       - `HEAD`
       - `OPTIONS`
     - **Allowed headers**: `*` (or specific headers like `x-ms-blob-type`, `Content-Type`)
     - **Exposed headers**: `*`
     - **Max age**: `3600` (seconds)

4. **Save Changes**
   - Click **Save**
   - Wait a few seconds for changes to propagate

### Option 3: Configure CORS via Azure CLI

```bash
# Install Azure CLI if not already installed
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Set your storage account name
STORAGE_ACCOUNT="amberkaizen"  # or amberbestpractice

# Configure CORS
az storage cors add \
  --services b \
  --methods GET PUT POST HEAD OPTIONS \
  --origins "http://localhost:8080" "http://localhost:5173" "http://localhost:3000" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name $STORAGE_ACCOUNT
```

## Verification

After configuring CORS, test the upload functionality:

1. **Restart your backend server** (if you changed `.env` file)
2. **Try uploading a file** from the frontend
3. **Check browser console** - CORS errors should be gone

## Troubleshooting

### Still Getting CORS Errors?

1. **Verify CORS is configured**:
   - Check Azure Portal → Storage Account → CORS settings
   - Ensure your frontend origin is in the allowed origins list

2. **Check Connection String**:
   - Verify `AZURE_STORAGE_CONNECTION_STRING` in `.env` is correct
   - Ensure `AZURE_STORAGE_ACCOUNT_NAME` matches the account name in connection string

3. **Check Account Name Mismatch**:
   - Your `.env` shows:
     - Connection string: `AccountName=amberkaizen`
     - Setting: `AZURE_STORAGE_ACCOUNT_NAME=amberbestpractice`
   - These should match! Update `AZURE_STORAGE_ACCOUNT_NAME` to match the connection string

4. **Wait for Propagation**:
   - CORS changes can take a few minutes to propagate
   - Try again after 2-3 minutes

5. **Check Browser Console**:
   - Look for detailed error messages
   - Verify the presigned URL is correctly formatted (no malformed prefixes)

## Important Notes

- **CORS is account-level**: CORS settings apply to all containers in the storage account
- **Security**: In production, use specific origins instead of `*`
- **Presigned URLs**: CORS is required even when using presigned URLs because the browser makes the request directly to Azure

## Related Files

- `backend/configure_azure_cors.py` - Script to configure CORS programmatically
- `backend/app/core/azure_storage.py` - Azure Storage client with CORS configuration method
- `backend/.env` - Environment variables including CORS_ORIGINS

