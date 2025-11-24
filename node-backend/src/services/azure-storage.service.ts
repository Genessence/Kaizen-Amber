import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { getContainerClient } from '../config/azure';
import envConfig from '../config/env';

export interface PresignedUrlResponse {
  presigned_url: string;
  blob_name: string;
  expires_in: number;
}

export class AzureStorageService {
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor() {
    const connectionString = envConfig.AZURE_STORAGE_CONNECTION_STRING;
    const accountName = envConfig.AZURE_STORAGE_ACCOUNT_NAME;

    // Extract account key from connection string
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
    if (!accountKeyMatch) {
      throw new Error('Invalid Azure Storage connection string');
    }

    this.sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKeyMatch[1]
    );
  }

  /**
   * Generate presigned URL for file upload
   */
  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    fileType: 'image' | 'document'
  ): Promise<PresignedUrlResponse> {
    const containerName =
      fileType === 'image'
        ? envConfig.AZURE_STORAGE_CONTAINER_PRACTICES
        : envConfig.AZURE_STORAGE_CONTAINER_DOCUMENTS;

    const containerClient = getContainerClient(containerName);

    // Generate unique blob name
    const fileExtension = fileName.split('.').pop();
    const blobName = `${uuidv4()}.${fileExtension}`;

    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Generate SAS token (valid for 1 hour)
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('w'), // Write permission
        expiresOn,
        contentType,
      },
      this.sharedKeyCredential
    ).toString();

    const presignedUrl = `${blobClient.url}?${sasToken}`;

    return {
      presigned_url: presignedUrl,
      blob_name: blobName,
      expires_in: 3600, // 1 hour in seconds
    };
  }

  /**
   * Get public URL for a blob
   */
  getBlobUrl(blobName: string, fileType: 'image' | 'document'): string {
    const containerName =
      fileType === 'image'
        ? envConfig.AZURE_STORAGE_CONTAINER_PRACTICES
        : envConfig.AZURE_STORAGE_CONTAINER_DOCUMENTS;

    const containerClient = getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    return blobClient.url;
  }

  /**
   * Delete a blob
   */
  async deleteBlob(blobName: string, fileType: 'image' | 'document'): Promise<void> {
    const containerName =
      fileType === 'image'
        ? envConfig.AZURE_STORAGE_CONTAINER_PRACTICES
        : envConfig.AZURE_STORAGE_CONTAINER_DOCUMENTS;

    const containerClient = getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    await blobClient.delete();
  }
}

export const azureStorageService = new AzureStorageService();

