// File upload service for handling worker photos and certification documents

import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'photos');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directories exist
async function ensureUploadDirs(): Promise<void> {
  await fs.mkdir(PHOTOS_DIR, { recursive: true });
}

// Initialize directories on module load
ensureUploadDirs().catch(console.error);

// Multer configuration for memory storage (we'll process with sharp before saving)
const storage = multer.memoryStorage();

// File filter for images only
const imageFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer upload instance
export const uploadPhoto = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Process and save an uploaded image
 * - Resizes to max 800x800 while maintaining aspect ratio
 * - Converts to WebP for optimal file size
 * - Returns the relative path to the saved file
 */
export async function processAndSavePhoto(buffer: Buffer, workerId: string): Promise<string> {
  // Generate unique filename
  const filename = `worker-${workerId}-${crypto.randomBytes(8).toString('hex')}.webp`;
  const filepath = path.join(PHOTOS_DIR, filename);

  // Process image with sharp
  await sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toFile(filepath);

  // Return relative path for storage in database
  return `/uploads/photos/${filename}`;
}

/**
 * Delete a photo file from storage
 */
export async function deletePhoto(photoUrl: string): Promise<void> {
  if (!photoUrl) return;

  // Extract filename from URL
  const filename = path.basename(photoUrl);
  const filepath = path.join(PHOTOS_DIR, filename);

  try {
    await fs.unlink(filepath);
  } catch (error) {
    // File might not exist, log but don't throw
    console.error(`Failed to delete photo: ${filepath}`, error);
  }
}

/**
 * Get the absolute path to a photo file
 */
export function getPhotoPath(photoUrl: string): string {
  const filename = path.basename(photoUrl);
  return path.join(PHOTOS_DIR, filename);
}

/**
 * Check if a photo file exists
 */
export async function photoExists(photoUrl: string): Promise<boolean> {
  const filepath = getPhotoPath(photoUrl);
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export { PHOTOS_DIR, UPLOAD_DIR };
