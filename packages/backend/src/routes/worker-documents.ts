// Worker Documents Management Routes

import express, { type Router } from 'express';
import multer from 'multer';
import { uploadWorkerDocumentSchema, updateWorkerDocumentSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadService } from '../services/upload.js';

const router: Router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All worker document routes require authentication
router.use(authenticateToken);

// Get all documents for a worker
router.get('/worker/:workerId', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker belongs to farm
    const worker = await db('workers').where({ id: workerId, farm_id: farmId }).first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    const documents = await db('worker_documents')
      .where({ worker_id: workerId, farm_id: farmId })
      .orderBy('created_at', 'desc')
      .select('*');

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

// Get single document details
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const document = await db('worker_documents').where({ id, farm_id: farmId }).first();

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

// Upload new document (managers and admins only)
router.post(
  '/',
  requireRole('admin', 'manager'),
  upload.single('file'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const data = uploadWorkerDocumentSchema.parse(req.body);
      const farmId = req.user?.farm_id;
      const uploadedBy = req.user?.id;

      // Verify worker belongs to farm
      const worker = await db('workers')
        .where({ id: data.worker_id, farm_id: farmId })
        .first();

      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Validate file
      uploadService.validateFile(req.file.mimetype, req.file.size);

      // Save file
      const uploadedFile = await uploadService.saveFile(req.file.buffer, req.file.originalname);

      // Save document metadata to database
      const [document] = await db('worker_documents')
        .insert({
          worker_id: data.worker_id,
          farm_id: farmId,
          document_name: data.document_name,
          document_type: data.document_type,
          file_path: uploadedFile.filePath,
          file_name: uploadedFile.fileName,
          mime_type: uploadedFile.mimeType,
          file_size: uploadedFile.fileSize,
          expiration_date: data.expiration_date || null,
          notes: data.notes || null,
          uploaded_by: uploadedBy,
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update document metadata (managers and admins only)
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateWorkerDocumentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [document] = await db('worker_documents')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

// Delete document (admins only)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const document = await db('worker_documents').where({ id, farm_id: farmId }).first();

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete file from storage
    await uploadService.deleteFile(document.file_path);

    // Delete document record
    await db('worker_documents').where({ id }).delete();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Download document file
router.get('/:id/download', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const userRole = req.user?.role;

    const document = await db('worker_documents').where({ id, farm_id: farmId }).first();

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Workers can only download their own documents
    if (userRole === 'worker') {
      const worker = await db('workers').where({ user_id: req.user?.id }).first();
      if (!worker || worker.id !== document.worker_id) {
        throw new AppError('Access denied', 403);
      }
    }

    // Get file from storage
    const fileBuffer = await uploadService.getFile(document.file_path);

    // Set headers for download
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', document.file_size.toString());

    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
});

// Get documents expiring soon (within 30 days)
router.get('/expiring/soon', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const documents = await db('worker_documents')
      .where({ farm_id: farmId })
      .whereNotNull('expiration_date')
      .where('expiration_date', '<=', thirtyDaysFromNow)
      .where('expiration_date', '>=', new Date())
      .orderBy('expiration_date', 'asc')
      .select('worker_documents.*')
      .leftJoin('workers', 'worker_documents.worker_id', 'workers.id')
      .select(
        'worker_documents.*',
        'workers.first_name',
        'workers.last_name',
        'workers.email',
        'workers.phone'
      );

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
