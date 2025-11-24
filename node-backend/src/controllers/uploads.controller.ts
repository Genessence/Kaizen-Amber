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
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { practiceId } = req.params;
      const { image_type, blob_name, file_size, content_type } = req.body;

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
        return next(new ForbiddenError('You do not have permission to add images to this practice'));
      }

      // Get blob URL
      const blobUrl = azureStorageService.getBlobUrl(blob_name, 'image');

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

      const images = await prisma.practiceImage.findMany({
        where: { practiceId },
        orderBy: { uploadedAt: 'asc' },
      });

      res.json(
        images.map((img) => ({
          id: img.id,
          practice_id: img.practiceId,
          image_type: img.imageType,
          blob_container: img.blobContainer,
          blob_name: img.blobName,
          blob_url: img.blobUrl,
          file_size: img.fileSize,
          content_type: img.contentType,
          uploaded_at: img.uploadedAt.toISOString(),
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

