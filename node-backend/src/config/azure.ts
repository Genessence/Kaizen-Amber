import { BlobServiceClient } from '@azure/storage-blob';
import env from './env';

export const blobServiceClient = BlobServiceClient.fromConnectionString(
  env.AZURE_STORAGE_CONNECTION_STRING
);

export const getContainerClient = (containerName: string) => {
  return blobServiceClient.getContainerClient(containerName);
};

export const practicesContainer = getContainerClient(
  env.AZURE_STORAGE_CONTAINER_PRACTICES
);

export const documentsContainer = getContainerClient(
  env.AZURE_STORAGE_CONTAINER_DOCUMENTS
);

