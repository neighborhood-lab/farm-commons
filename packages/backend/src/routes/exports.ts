// Data Export Routes
// API endpoints for exporting data to CSV/Excel formats

import express, { type Router } from 'express';
import { dateRangeSchema } from '@farm-commons/shared';
import { z } from 'zod';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  exportWorkers,
  exportTimeEntriesForPayroll,
  exportSchedules,
  exportComplianceReport,
  type ExportOptions,
} from '../services/export.js';

const router: Router = express.Router();

// All export routes require authentication
router.use(authenticateToken);

// Export format validation schema
const exportFormatSchema = z.object({
  format: z.enum(['csv', 'excel']).default('csv'),
});

/**
 * Export workers list
 * GET /api/exports/workers?format=csv|excel
 */
router.get('/workers', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { format } = exportFormatSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const options: ExportOptions = {
      format,
      farmId,
    };

    const stream = await exportWorkers(db, options);

    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const mimeType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="workers-${timestamp}.${extension}"`
    );

    stream.pipe(res);
  } catch {
    next(error);
  }
});

/**
 * Export time entries for payroll
 * GET /api/exports/time-entries?format=csv|excel&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
router.get('/time-entries', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { format } = exportFormatSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const options: ExportOptions = {
      format,
      farmId,
    };

    // Add date range if provided
    if (req.query.start_date && req.query.end_date) {
      const { start_date, end_date } = dateRangeSchema.parse(req.query);
      options.startDate = start_date;
      options.endDate = end_date;
    }

    const stream = await exportTimeEntriesForPayroll(db, options);

    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const mimeType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="time-entries-payroll-${timestamp}.${extension}"`
    );

    stream.pipe(res);
  } catch {
    next(error);
  }
});

/**
 * Export schedules for planning
 * GET /api/exports/schedules?format=csv|excel&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
router.get('/schedules', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { format } = exportFormatSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const options: ExportOptions = {
      format,
      farmId,
    };

    // Add date range if provided
    if (req.query.start_date && req.query.end_date) {
      const { start_date, end_date } = dateRangeSchema.parse(req.query);
      options.startDate = start_date;
      options.endDate = end_date;
    }

    const stream = await exportSchedules(db, options);

    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const mimeType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="schedules-${timestamp}.${extension}"`
    );

    stream.pipe(res);
  } catch {
    next(error);
  }
});

/**
 * Export compliance report
 * GET /api/exports/compliance?format=csv|excel&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
router.get('/compliance', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { format } = exportFormatSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const options: ExportOptions = {
      format,
      farmId,
    };

    // Add date range if provided (defaults to last 30 days in service)
    if (req.query.start_date && req.query.end_date) {
      const { start_date, end_date } = dateRangeSchema.parse(req.query);
      options.startDate = start_date;
      options.endDate = end_date;
    }

    const stream = await exportComplianceReport(db, options);

    // Set appropriate headers
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const mimeType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="compliance-report-${timestamp}.${extension}"`
    );

    stream.pipe(res);
  } catch {
    next(error);
  }
});

export default router;
