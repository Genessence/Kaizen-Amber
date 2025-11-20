"""
Script to configure Azure Blob Storage CORS settings.
Run this script once to set up CORS for your Azure Storage account.

Usage:
    python configure_azure_cors.py
"""

import sys
import os

# Add the 'app' directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.core.azure_storage import AzureStorageClient
from app.config import settings


def main():
    """Configure CORS for Azure Blob Storage."""
    print("=" * 60)
    print("Azure Blob Storage CORS Configuration")
    print("=" * 60)
    
    # Get allowed origins from settings (CORS_ORIGINS)
    allowed_origins = settings.CORS_ORIGINS.copy()
    
    # Add common development origins if not already present
    common_origins = [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ]
    
    for origin in common_origins:
        if origin not in allowed_origins:
            allowed_origins.append(origin)
    
    print(f"\nConfiguring CORS for the following origins:")
    for origin in allowed_origins:
        print(f"  - {origin}")
    
    try:
        # Initialize Azure Storage client
        azure_storage = AzureStorageClient()
        
        # Configure CORS
        print("\nConfiguring CORS settings...")
        success = azure_storage.configure_cors(
            allowed_origins=allowed_origins,
            max_age_in_seconds=3600
        )
        
        if success:
            print("\n✓ CORS configuration successful!")
            print("\nThe following CORS rules have been applied:")
            print(f"  - Allowed Origins: {', '.join(allowed_origins)}")
            print(f"  - Allowed Methods: GET, PUT, POST, HEAD, OPTIONS")
            print(f"  - Allowed Headers: *")
            print(f"  - Max Age: 3600 seconds")
            print("\nYou can now upload files from your frontend application.")
        else:
            print("\n✗ Failed to configure CORS.")
            print("Please check:")
            print("  1. Azure Storage connection string is correct")
            print("  2. You have permissions to modify service properties")
            print("  3. Azure Storage account exists and is accessible")
            return 1
            
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Verify AZURE_STORAGE_CONNECTION_STRING in .env")
        print("  2. Verify AZURE_STORAGE_ACCOUNT_NAME in .env")
        print("  3. Check Azure Storage account permissions")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

