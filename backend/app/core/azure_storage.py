"""Azure Blob Storage client for file uploads."""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, BinaryIO, List
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions, CorsRule
from azure.core.exceptions import ResourceNotFoundError

from app.config import settings


class AzureStorageClient:
    """Azure Blob Storage client wrapper."""
    
    def __init__(self):
        """Initialize Azure Blob Storage client."""
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.account_name = settings.AZURE_STORAGE_ACCOUNT_NAME
        self.container_practices = settings.AZURE_STORAGE_CONTAINER_PRACTICES
        self.container_documents = settings.AZURE_STORAGE_CONTAINER_DOCUMENTS
        
        # Initialize blob service client
        self.blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        
        # Ensure containers exist
        self._ensure_containers()
    
    def _ensure_containers(self):
        """Create containers if they don't exist."""
        try:
            self.blob_service_client.create_container(self.container_practices)
        except Exception:
            pass  # Container already exists or connection failed
        
        try:
            self.blob_service_client.create_container(self.container_documents)
        except Exception:
            pass  # Container already exists or connection failed
    
    async def upload_blob(
        self,
        container: str,
        blob_name: str,
        data: bytes,
        content_type: str
    ) -> str:
        """
        Upload a blob to Azure Storage.
        
        Args:
            container: Container name
            blob_name: Blob name (path)
            data: File data as bytes
            content_type: MIME type
        
        Returns:
            str: Blob URL
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=container,
            blob=blob_name
        )
        
        # Upload in a thread to avoid blocking
        await asyncio.to_thread(
            blob_client.upload_blob,
            data,
            overwrite=True,
            content_settings={'content_type': content_type}
        )
        
        return blob_client.url
    
    async def delete_blob(self, container: str, blob_name: str) -> bool:
        """
        Delete a blob from Azure Storage.
        
        Args:
            container: Container name
            blob_name: Blob name
        
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container,
                blob=blob_name
            )
            
            await asyncio.to_thread(blob_client.delete_blob)
            return True
        
        except ResourceNotFoundError:
            return False
    
    def generate_sas_url(
        self,
        container: str,
        blob_name: str,
        expiry_hours: int = 24
    ) -> str:
        """
        Generate a SAS URL for temporary access to a blob.
        
        Args:
            container: Container name
            blob_name: Blob name
            expiry_hours: Hours until expiry (default 24)
        
        Returns:
            str: SAS URL
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=container,
            blob=blob_name
        )
        
        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=container,
            blob_name=blob_name,
            account_key=self._get_account_key(),
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
        )
        
        return f"{blob_client.url}?{sas_token}"
    
    def generate_upload_sas_url(
        self,
        container: str,
        blob_name: str,
        expiry_minutes: int = 30
    ) -> tuple[str, datetime]:
        """
        Generate a SAS URL for uploading a blob (write permission).
        
        Args:
            container: Container name
            blob_name: Blob name
            expiry_minutes: Minutes until expiry (default 30)
        
        Returns:
            tuple: (SAS URL, expiry datetime)
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=container,
            blob=blob_name
        )
        
        expiry = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        
        # Generate SAS token with write permission
        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=container,
            blob_name=blob_name,
            account_key=self._get_account_key(),
            permission=BlobSasPermissions(write=True, create=True),
            expiry=expiry
        )
        
        return f"{blob_client.url}?{sas_token}", expiry
    
    async def get_blob_properties(self, container: str, blob_name: str) -> Optional[dict]:
        """
        Get properties of a blob.
        
        Args:
            container: Container name
            blob_name: Blob name
        
        Returns:
            dict: Blob properties or None if not found
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container,
                blob=blob_name
            )
            
            properties = await asyncio.to_thread(blob_client.get_blob_properties)
            
            return {
                "size": properties.size,
                "content_type": properties.content_settings.content_type,
                "last_modified": properties.last_modified,
                "etag": properties.etag
            }
        
        except ResourceNotFoundError:
            return None
    
    def _get_account_key(self) -> str:
        """Extract account key from connection string."""
        # Parse connection string to get account key
        parts = self.connection_string.split(';')
        for part in parts:
            if part.startswith('AccountKey='):
                return part.split('=', 1)[1]
        raise ValueError("AccountKey not found in connection string")
    
    def configure_cors(self, allowed_origins: List[str], max_age_in_seconds: int = 3600) -> bool:
        """
        Configure CORS settings for Azure Blob Storage.
        
        Args:
            allowed_origins: List of allowed origin URLs (e.g., ['http://localhost:8080', 'http://localhost:5173'])
            max_age_in_seconds: Maximum age for CORS preflight cache (default 3600)
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get current service properties (returns Dict[str, Any])
            service_properties = self.blob_service_client.get_service_properties()
            
            # Create CORS rule using CorsRule class
            cors_rule = CorsRule(
                allowed_origins=allowed_origins,
                allowed_methods=['GET', 'PUT', 'POST', 'HEAD', 'OPTIONS'],
                allowed_headers=['*'],
                exposed_headers=['*'],
                max_age_in_seconds=max_age_in_seconds
            )
            
            # Azure SDK's set_service_properties can accept CorsRule objects directly
            # Update the service properties dict with CORS rules
            # The 'cors' key should contain a list of CorsRule objects
            service_properties['cors'] = [cors_rule]
            
            # Apply the updated service properties
            # set_service_properties accepts the dict and will serialize CorsRule objects properly
            self.blob_service_client.set_service_properties(service_properties)
            
            return True
        except Exception as e:
            print(f"Error configuring CORS: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def generate_blob_name(
        self,
        practice_id: str,
        file_type: str,
        filename: str,
        timestamp: Optional[int] = None
    ) -> str:
        """
        Generate a standardized blob name.
        
        Args:
            practice_id: Best practice ID
            file_type: 'before', 'after', or 'document'
            filename: Original filename
            timestamp: Optional timestamp (defaults to now)
        
        Returns:
            str: Blob name path
        """
        if timestamp is None:
            timestamp = int(datetime.utcnow().timestamp())
        
        # Extract file extension
        ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'bin'
        
        if file_type in ['before', 'after']:
            return f"practices/{practice_id}/{file_type}_{timestamp}.{ext}"
        else:
            # For documents, preserve more of the original name
            safe_filename = filename.replace(' ', '_')
            return f"documents/{practice_id}/{safe_filename}_{timestamp}.{ext}"


# Global instance - lazy initialization
_azure_storage_instance: Optional[AzureStorageClient] = None


def get_azure_storage() -> AzureStorageClient:
    """Dependency to get Azure Storage client (lazy initialization)."""
    global _azure_storage_instance
    if _azure_storage_instance is None:
        _azure_storage_instance = AzureStorageClient()
    return _azure_storage_instance

