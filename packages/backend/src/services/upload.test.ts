// Unit tests for File Upload Service

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  UploadService,
  LocalStorageProvider,
  S3StorageProvider,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  type UploadedFile,
} from './upload.js';

describe('UploadService', () => {
  describe('File Validation', () => {
    let uploadService: UploadService;

    beforeEach(() => {
      uploadService = new UploadService(new LocalStorageProvider());
    });

    it('should validate a valid PDF file', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('fake pdf content'),
        size: 1024,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid image file (JPEG)', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake image content'),
        size: 2048,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG image', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('fake png content'),
        size: 3072,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'large.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(MAX_FILE_SIZE + 1),
        size: MAX_FILE_SIZE + 1,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject invalid MIME types', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'script.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('fake executable'),
        size: 1024,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject empty files', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'empty.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from(''),
        size: 0,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('LocalStorageProvider', () => {
    let provider: LocalStorageProvider;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(process.cwd(), 'test-uploads');
      provider = new LocalStorageProvider(tempDir, 'http://localhost:3001');
    });

    afterEach(async () => {
      // Clean up test uploads
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should upload a file to local storage', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'test-cert.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test pdf content'),
        size: 16,
      };

      const result = await provider.upload(file, 'certifications');

      expect(result.url).toContain('http://localhost:3001/uploads/certifications/');
      expect(result.filename).toContain('certifications/');
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.size).toBe(16);
      expect(result.mimetype).toBe('application/pdf');

      // Verify file was actually written
      const filepath = path.join(tempDir, result.filename);
      const fileContent = await fs.readFile(filepath, 'utf-8');
      expect(fileContent).toBe('test pdf content');
    });

    it('should generate unique filenames for uploads', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 12,
      };

      const result1 = await provider.upload(file, 'certifications');
      const result2 = await provider.upload(file, 'certifications');

      expect(result1.filename).not.toBe(result2.filename);
    });

    it('should delete a file from local storage', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'test-delete.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content to delete'),
        size: 22,
      };

      const result = await provider.upload(file, 'certifications');
      const filepath = path.join(tempDir, result.filename);

      // Verify file exists
      await expect(fs.access(filepath)).resolves.toBeUndefined();

      // Delete the file
      await provider.delete(result.filename);

      // Verify file no longer exists
      await expect(fs.access(filepath)).rejects.toThrow();
    });

    it('should generate a signed URL for download', async () => {
      const filename = 'certifications/test-file.pdf';
      const url = await provider.getSignedUrl(filename, 3600);

      expect(url).toContain('http://localhost:3001/uploads/certifications/test-file.pdf');
      expect(url).toContain('token=');
      expect(url).toContain('expires=');
    });

    it('should create directory if it does not exist', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image'),
        size: 10,
      };

      const result = await provider.upload(file, 'new-folder');

      expect(result.filename).toContain('new-folder/');

      // Verify directory was created
      const dirPath = path.join(tempDir, 'new-folder');
      await expect(fs.access(dirPath)).resolves.toBeUndefined();
    });
  });

  describe('S3StorageProvider', () => {
    let provider: S3StorageProvider;

    beforeEach(() => {
      provider = new S3StorageProvider({
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      });
    });

    it('should throw error for unimplemented upload method', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 12,
      };

      await expect(provider.upload(file, 'certifications')).rejects.toThrow(
        'S3 storage provider not fully implemented'
      );
    });

    it('should throw error for unimplemented delete method', async () => {
      await expect(provider.delete('test-file.pdf')).rejects.toThrow(
        'S3 storage provider not fully implemented'
      );
    });

    it('should throw error for unimplemented getSignedUrl method', async () => {
      await expect(provider.getSignedUrl('test-file.pdf')).rejects.toThrow(
        'S3 storage provider not fully implemented'
      );
    });
  });

  describe('UploadService Integration', () => {
    let uploadService: UploadService;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(process.cwd(), 'test-uploads-integration');
      const provider = new LocalStorageProvider(tempDir, 'http://localhost:3001');
      uploadService = new UploadService(provider);
    });

    afterEach(async () => {
      // Clean up test uploads
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should upload a valid file', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('certificate content'),
        size: 19,
      };

      const result = await uploadService.uploadFile(file, 'certifications');

      expect(result.url).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.size).toBe(19);
      expect(result.mimetype).toBe('application/pdf');
    });

    it('should reject invalid file during upload', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'malicious.exe',
        encoding: '7bit',
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('malicious content'),
        size: 17,
      };

      await expect(uploadService.uploadFile(file)).rejects.toThrow('not allowed');
    });

    it('should upload multiple files', async () => {
      const files: UploadedFile[] = [
        {
          fieldname: 'document',
          originalname: 'cert1.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('cert 1 content'),
          size: 14,
        },
        {
          fieldname: 'document',
          originalname: 'cert2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('cert 2 image'),
          size: 12,
        },
      ];

      const results = await uploadService.uploadFiles(files, 'certifications');

      expect(results).toHaveLength(2);
      expect(results[0].mimetype).toBe('application/pdf');
      expect(results[1].mimetype).toBe('image/jpeg');
    });

    it('should delete a file', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'temp-cert.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('temporary content'),
        size: 17,
      };

      const result = await uploadService.uploadFile(file, 'certifications');
      await uploadService.deleteFile(result.filename);

      // Verify deletion (file should not exist)
      const filepath = path.join(tempDir, result.filename);
      await expect(fs.access(filepath)).rejects.toThrow();
    });

    it('should generate a download URL', async () => {
      const filename = 'certifications/test-cert.pdf';
      const url = await uploadService.getDownloadUrl(filename, 1800);

      expect(url).toBeDefined();
      expect(url).toContain(filename);
    });
  });

  describe('MIME Type Constants', () => {
    it('should include all required PDF and image MIME types', () => {
      expect(ALLOWED_MIME_TYPES['application/pdf']).toBe('.pdf');
      expect(ALLOWED_MIME_TYPES['image/jpeg']).toBe('.jpg');
      expect(ALLOWED_MIME_TYPES['image/jpg']).toBe('.jpg');
      expect(ALLOWED_MIME_TYPES['image/png']).toBe('.png');
      expect(ALLOWED_MIME_TYPES['image/gif']).toBe('.gif');
      expect(ALLOWED_MIME_TYPES['image/webp']).toBe('.webp');
    });
  });

  describe('Edge Cases', () => {
    let uploadService: UploadService;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(process.cwd(), 'test-uploads-edge');
      const provider = new LocalStorageProvider(tempDir, 'http://localhost:3001');
      uploadService = new UploadService(provider);
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should handle files at exactly the maximum size', () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'max-size.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(MAX_FILE_SIZE),
        size: MAX_FILE_SIZE,
      };

      const result = uploadService.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should handle filenames with special characters', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate-2024_v1 (final).pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 12,
      };

      const result = await uploadService.uploadFile(file, 'certifications');
      expect(result.filename).toMatch(/\.pdf$/);
    });

    it('should handle WebP images', async () => {
      const file: UploadedFile = {
        fieldname: 'document',
        originalname: 'certificate.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        buffer: Buffer.from('webp image data'),
        size: 15,
      };

      const result = await uploadService.uploadFile(file, 'certifications');
      expect(result.mimetype).toBe('image/webp');
      expect(result.filename).toMatch(/\.webp$/);
    });
  });
});
