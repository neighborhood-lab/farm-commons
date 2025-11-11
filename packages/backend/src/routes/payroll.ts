// Payroll routes

import express, { type Router } from 'express';
import { z } from 'zod';
import {
  calculatePayroll,
  getCurrentPayPeriod,
  getPreviousPayPeriod,
  getCustomPayPeriod,
  formatPayrollAsText,
  generatePayrollPDF,
} from '../services/payroll.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// All routes require authentication and manager/admin role
router.use(authenticateToken);
router.use(requireRole('admin', 'manager'));

// Query schema for pay period
const payPeriodQuerySchema = z.object({
  period: z.enum(['current', 'previous', 'custom']).default('current'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine((data) => {
  if (data.period === 'custom') {
    return data.start_date && data.end_date;
  }
  return true;
}, {
  message: 'start_date and end_date are required when period is custom',
});

/**
 * GET /api/payroll
 * Get payroll report for specified pay period (JSON)
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const query = payPeriodQuerySchema.parse(req.query);

    // Determine pay period
    let payPeriod;
    if (query.period === 'current') {
      payPeriod = getCurrentPayPeriod();
    } else if (query.period === 'previous') {
      payPeriod = getPreviousPayPeriod();
    } else if (query.period === 'custom' && query.start_date && query.end_date) {
      payPeriod = getCustomPayPeriod(
        new Date(query.start_date),
        new Date(query.end_date)
      );
    } else {
      throw new AppError('Invalid pay period parameters', 400);
    }

    // Calculate payroll
    const report = await calculatePayroll(farmId, payPeriod);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payroll/text
 * Get payroll report as plain text
 */
router.get('/text', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const query = payPeriodQuerySchema.parse(req.query);

    // Determine pay period
    let payPeriod;
    if (query.period === 'current') {
      payPeriod = getCurrentPayPeriod();
    } else if (query.period === 'previous') {
      payPeriod = getPreviousPayPeriod();
    } else if (query.period === 'custom' && query.start_date && query.end_date) {
      payPeriod = getCustomPayPeriod(
        new Date(query.start_date),
        new Date(query.end_date)
      );
    } else {
      throw new AppError('Invalid pay period parameters', 400);
    }

    // Calculate payroll
    const report = await calculatePayroll(farmId, payPeriod);

    // Format as text
    const textReport = formatPayrollAsText(report);

    res.setHeader('Content-Type', 'text/plain');
    res.send(textReport);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payroll/pdf
 * Download payroll report as PDF
 */
router.get('/pdf', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const query = payPeriodQuerySchema.parse(req.query);

    // Determine pay period
    let payPeriod;
    if (query.period === 'current') {
      payPeriod = getCurrentPayPeriod();
    } else if (query.period === 'previous') {
      payPeriod = getPreviousPayPeriod();
    } else if (query.period === 'custom' && query.start_date && query.end_date) {
      payPeriod = getCustomPayPeriod(
        new Date(query.start_date),
        new Date(query.end_date)
      );
    } else {
      throw new AppError('Invalid pay period parameters', 400);
    }

    // Calculate payroll
    const report = await calculatePayroll(farmId, payPeriod);

    // Generate PDF
    const pdfStream = generatePayrollPDF(report);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-report-${query.period}.pdf"`);

    // Pipe PDF stream to response
    pdfStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payroll/summary
 * Get summary statistics without detailed entries
 */
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const query = payPeriodQuerySchema.parse(req.query);

    // Determine pay period
    let payPeriod;
    if (query.period === 'current') {
      payPeriod = getCurrentPayPeriod();
    } else if (query.period === 'previous') {
      payPeriod = getPreviousPayPeriod();
    } else if (query.period === 'custom' && query.start_date && query.end_date) {
      payPeriod = getCustomPayPeriod(
        new Date(query.start_date),
        new Date(query.end_date)
      );
    } else {
      throw new AppError('Invalid pay period parameters', 400);
    }

    // Calculate payroll
    const report = await calculatePayroll(farmId, payPeriod);

    // Return only summary data
    const summary = {
      farm_name: report.farm_name,
      pay_period: report.pay_period,
      generated_at: report.generated_at,
      total_regular_hours: report.total_regular_hours,
      total_overtime_hours: report.total_overtime_hours,
      total_payroll: report.total_payroll,
      total_workers: report.total_workers,
      workers_with_hours: report.worker_entries.filter(w => w.total_hours > 0).length,
      workers_with_overtime: report.worker_entries.filter(w => w.overtime_hours > 0).length,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
