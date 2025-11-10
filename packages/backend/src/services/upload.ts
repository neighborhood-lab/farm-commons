// File Upload Service
// Handles document uploads with validation and secure storage

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError } from '../middleware/errorHandler.js';

// Allowed MIME types for worker documents
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedFile {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export class UploadService {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    // Default to uploads directory in backend root
    this.uploadDir = uploadDir || path.join(process.cwd(), 'uploads', 'worker-documents');
  }

  /**
   * Initialize upload directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw new AppError('Failed to initialize upload service', 500);
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(mimeType: string, fileSize: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new AppError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }
  }

  /**
   * Generate unique filename
   */
  generateFileName(originalFileName: string): string {
    const ext = path.extname(originalFileName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Save file to disk
   */
  async saveFile(fileBuffer: Buffer, originalFileName: string): Promise<UploadedFile> {
    await this.init();

    const fileName = this.generateFileName(originalFileName);
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.writeFile(filePath, fileBuffer);

      return {
        filePath,
        fileName,
        mimeType: this.getMimeTypeFromExtension(originalFileName),
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new AppError('Failed to save file', 500);
    }
  }

  /**
   * Delete file from disk
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new AppError('Failed to delete file', 500);
      }
    }
  }

  /**
   * Get file as buffer
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to read file:', error);
      throw new AppError('File not found', 404);
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// Export singleton instance
export const uploadService = new UploadService();
