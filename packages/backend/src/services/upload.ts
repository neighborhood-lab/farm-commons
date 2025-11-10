// File Upload Service for Farm Commons
// Handles certification document uploads with local and S3 storage support

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Allowed file types for uploads
export const ALLOWED_MIME_TYPES = {
  // PDFs
  'application/pdf': '.pdf',
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface StorageProvider {
  upload(file: UploadedFile, folder: string): Promise<UploadResult>;
  delete(filename: string): Promise<void>;
  getSignedUrl(filename: string, expiresIn?: number): Promise<string>;
}

// Local File Storage Implementation
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;

  constructor(uploadDir?: string, baseUrl?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), 'uploads');
    this.baseUrl = baseUrl || process.env.BACKEND_URL || 'http://localhost:3001';
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private generateFilename(originalname: string, mimetype: string): string {
    const extension = ALLOWED_MIME_TYPES[mimetype as keyof typeof ALLOWED_MIME_TYPES] ||
                     path.extname(originalname);
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomString}${extension}`;
  }

  async upload(file: UploadedFile, folder: string = 'certifications'): Promise<UploadResult> {
    const folderPath = path.join(this.uploadDir, folder);
    await this.ensureDirectoryExists(folderPath);

    const filename = this.generateFilename(file.originalname, file.mimetype);
    const filepath = path.join(folderPath, filename);

    await fs.writeFile(filepath, file.buffer);

    return {
      url: `${this.baseUrl}/uploads/${folder}/${filename}`,
      filename: `${folder}/${filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async delete(filename: string): Promise<void> {
    const filepath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, log but don't throw
      console.warn(`Failed to delete file ${filename}:`, error);
    }
  }

  async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, generate a simple URL with expiry token
    const token = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${filename}:${Date.now() + expiresIn * 1000}`)
      .digest('hex');

    return `${this.baseUrl}/uploads/${filename}?token=${token}&expires=${Date.now() + expiresIn * 1000}`;
  }
}

// S3-Compatible Storage Implementation (AWS S3, MinIO, DigitalOcean Spaces, etc.)
export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(config: {
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region || 'us-east-1';
    this.endpoint = config.endpoint;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
  }

  private generateFilename(originalname: string, mimetype: string): string {
    const extension = ALLOWED_MIME_TYPES[mimetype as keyof typeof ALLOWED_MIME_TYPES] ||
                     path.extname(originalname);
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomString}${extension}`;
  }

  async upload(file: UploadedFile, folder: string = 'certifications'): Promise<UploadResult> {
    // This is a placeholder for S3 implementation
    // In a real implementation, you would use @aws-sdk/client-s3
    // For now, we'll throw an error indicating S3 is not fully implemented
    const filename = this.generateFilename(file.originalname, file.mimetype);
    const key = `${folder}/${filename}`;

    // Placeholder - would use AWS SDK here
    // const client = new S3Client({ region: this.region, endpoint: this.endpoint });
    // const command = new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    // });
    // await client.send(command);

    throw new Error('S3 storage provider not fully implemented. Install @aws-sdk/client-s3 and implement.');
  }

  async delete(filename: string): Promise<void> {
    // Placeholder for S3 delete implementation
    throw new Error('S3 storage provider not fully implemented. Install @aws-sdk/client-s3 and implement.');
  }

  async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    // Placeholder for S3 signed URL generation
    throw new Error('S3 storage provider not fully implemented. Install @aws-sdk/client-s3 and implement.');
  }
}

// Upload Service Class
export class UploadService {
  private storageProvider: StorageProvider;

  constructor(storageProvider?: StorageProvider) {
    // Default to local storage in development
    this.storageProvider = storageProvider || new LocalStorageProvider();
  }

  /**
   * Validate file type and size
   */
  validateFile(file: UploadedFile): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check MIME type
    if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: PDF, JPEG, PNG, GIF, WebP`,
      };
    }

    // Validate buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      return {
        valid: false,
        error: 'File buffer is empty',
      };
    }

    return { valid: true };
  }

  /**
   * Upload a file
   */
  async uploadFile(file: UploadedFile, folder: string = 'certifications'): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return await this.storageProvider.upload(file, folder);
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<void> {
    await this.storageProvider.delete(filename);
  }

  /**
   * Generate a secure download URL
   */
  async getDownloadUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    return await this.storageProvider.getSignedUrl(filename, expiresIn);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: UploadedFile[], folder: string = 'certifications'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
    }

    return results;
  }
}

// Factory function to create upload service based on environment
export function createUploadService(): UploadService {
  const storageType = process.env.STORAGE_TYPE || 'local';

  if (storageType === 's3') {
    const s3Provider = new S3StorageProvider({
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    });
    return new UploadService(s3Provider);
  }

  // Default to local storage
  return new UploadService(new LocalStorageProvider());
}

// Export default instance
export const uploadService = createUploadService();
