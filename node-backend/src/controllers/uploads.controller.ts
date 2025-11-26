import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { azureStorageService } from '../services/azure-storage.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import env from '../config/env';

export class UploadsController {
  /**
   * Generate presigned URL for file upload
   */
  async requestPresignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { file_name, content_type, file_type } = req.body;

      // Validate file type
      if (file_type === 'image') {
        if (!env.ALLOWED_IMAGE_TYPES.includes(content_type)) {
          return next(new BadRequestError(`Invalid image type. Allowed: ${env.ALLOWED_IMAGE_TYPES.join(', ')}`));
        }
      } else if (file_type === 'document') {
        if (!env.ALLOWED_DOCUMENT_TYPES.includes(content_type)) {
          return next(new BadRequestError(`Invalid document type. Allowed: ${env.ALLOWED_DOCUMENT_TYPES.join(', ')}`));
        }
      } else {
        return next(new BadRequestError('Invalid file_type. Must be "image" or "document"'));
      }

      const result = await azureStorageService.generatePresignedUrl(
        file_name,
        content_type,
        file_type
      );

      res.json({
        presigned_url: result.presigned_url,
        blob_name: result.blob_name,
        expires_in: result.expires_in,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm image upload
   */
  async confirmImageUpload(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(`[confirmImageUpload] Request received for practice: ${req.params.practiceId}`, {
        body: req.body,
        userId: req.user?.userId,
        userRole: req.user?.role,
      });

      if (!req.user) {
        console.error('[confirmImageUpload] No user in request');
        return next(new ForbiddenError());
      }

      const { practiceId } = req.params;
      const { image_type, blob_name, file_size, content_type } = req.body;

      if (!image_type || !blob_name || !file_size || !content_type) {
        console.error('[confirmImageUpload] Missing required fields:', {
          image_type,
          blob_name,
          file_size,
          content_type,
        });
        return next(new BadRequestError('Missing required fields: image_type, blob_name, file_size, content_type'));
      }

      // Verify practice exists and user has permission
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id: practiceId,
          isDeleted: false,
        },
      });

      if (!practice) {
        console.error(`[confirmImageUpload] Practice not found: ${practiceId}`);
        return next(new NotFoundError('Practice not found'));
      }

      console.log(`[confirmImageUpload] Practice found:`, {
        practiceId: practice.id,
        submittedByUserId: practice.submittedByUserId,
        currentUserId: req.user.userId,
        userRole: req.user.role,
      });

      if (practice.submittedByUserId !== req.user.userId && req.user.role !== 'hq') {
        console.error(`[confirmImageUpload] Permission denied:`, {
          practiceSubmittedBy: practice.submittedByUserId,
          currentUserId: req.user.userId,
          userRole: req.user.role,
        });
        return next(new ForbiddenError('You do not have permission to add images to this practice'));
      }

      // Get blob URL
      const blobUrl = azureStorageService.getBlobUrl(blob_name, 'image');
      console.log(`[confirmImageUpload] Generated blob URL:`, blobUrl.substring(0, 100) + '...');

      // Create image record
      const image = await prisma.practiceImage.create({
        data: {
          practiceId,
          imageType: image_type,
          blobContainer: env.AZURE_STORAGE_CONTAINER_PRACTICES,
          blobName: blob_name,
          blobUrl: blobUrl,
          fileSize: file_size,
          contentType: content_type,
        },
      });

      console.log(`[confirmImageUpload] Image created successfully:`, {
        imageId: image.id,
        practiceId: image.practiceId,
        imageType: image.imageType,
        blobName: image.blobName,
      });

      res.status(201).json({
        id: image.id,
        practice_id: image.practiceId,
        image_type: image.imageType,
        blob_url: image.blobUrl,
        file_size: image.fileSize,
        content_type: image.contentType,
        uploaded_at: image.uploadedAt.toISOString(),
      });
    } catch (error) {
      console.error(`[confirmImageUpload] Error:`, error);
      next(error);
    }
  }

  /**
   * Confirm document upload
   */
  async confirmDocumentUpload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { practiceId } = req.params;
      const { document_name, blob_name, file_size, content_type } = req.body;

      // Verify practice exists and user has permission
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id: practiceId,
          isDeleted: false,
        },
      });

      if (!practice) {
        return next(new NotFoundError('Practice not found'));
      }

      if (practice.submittedByUserId !== req.user.userId && req.user.role !== 'hq') {
        return next(new ForbiddenError('You do not have permission to add documents to this practice'));
      }

      // Get blob URL
      const blobUrl = azureStorageService.getBlobUrl(blob_name, 'document');

      // Create document record
      const document = await prisma.practiceDocument.create({
        data: {
          practiceId,
          documentName: document_name,
          blobContainer: env.AZURE_STORAGE_CONTAINER_DOCUMENTS,
          blobName: blob_name,
          blobUrl: blobUrl,
          fileSize: file_size,
          contentType: content_type,
        },
      });

      res.status(201).json({
        id: document.id,
        practice_id: document.practiceId,
        document_name: document.documentName,
        blob_url: document.blobUrl,
        file_size: document.fileSize,
        content_type: document.contentType,
        uploaded_at: document.uploadedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get practice images
   */
  async getPracticeImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { practiceId } = req.params;
      console.log(`[getPracticeImages] Fetching images for practice: ${practiceId}`);

      const images = await prisma.practiceImage.findMany({
        where: { practiceId },
        orderBy: { uploadedAt: 'asc' },
      });

      console.log(`[getPracticeImages] Found ${images.length} images for practice ${practiceId}`);

      // Generate SAS tokens for read access (valid for 1 hour)
      const mappedImages = images.map((img) => {
        // Generate SAS token for reading the blob
        const sasUrl = azureStorageService.generateReadSasUrl(img.blobName, 'image');
        
        return {
          id: img.id,
          practice_id: img.practiceId,
          image_type: img.imageType,
          blob_container: img.blobContainer,
          blob_name: img.blobName,
          blob_url: sasUrl, // Use SAS URL instead of plain blob URL
          file_size: img.fileSize,
          content_type: img.contentType,
          uploaded_at: img.uploadedAt.toISOString(),
        };
      });

      console.log(`[getPracticeImages] Returning images:`, mappedImages.map(img => ({
        id: img.id,
        image_type: img.image_type,
        blob_url: img.blob_url.substring(0, 100) + '...', // Truncate for logging
      })));

      res.json(mappedImages);
    } catch (error) {
      console.error(`[getPracticeImages] Error fetching images for practice ${req.params.practiceId}:`, error);
      next(error);
    }
  }

  /**
   * Get practice documents
   */
  async getPracticeDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { practiceId } = req.params;

      const documents = await prisma.practiceDocument.findMany({
        where: { practiceId },
        orderBy: { uploadedAt: 'asc' },
      });

      res.json(
        documents.map((doc) => ({
          id: doc.id,
          practice_id: doc.practiceId,
          document_name: doc.documentName,
          blob_container: doc.blobContainer,
          blob_name: doc.blobName,
          blob_url: doc.blobUrl,
          file_size: doc.fileSize,
          content_type: doc.contentType,
          uploaded_at: doc.uploadedAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete practice image
   */
  async deletePracticeImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { imageId } = req.params;

      const image = await prisma.practiceImage.findUnique({
        where: { id: imageId },
        include: {
          practice: true,
        },
      });

      if (!image) {
        return next(new NotFoundError('Image not found'));
      }

      // Check permissions
      if (image.practice.submittedByUserId !== req.user.userId && req.user.role !== 'hq') {
        return next(new ForbiddenError('You do not have permission to delete this image'));
      }

      // Delete from Azure
      await azureStorageService.deleteBlob(image.blobName, 'image');

      // Delete from database
      await prisma.practiceImage.delete({
        where: { id: imageId },
      });

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadsController = new UploadsController();

