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


