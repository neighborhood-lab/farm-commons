// H-2A Visa Tracking and Compliance Routes

import express from 'express';
import {
  createH2AVisaSchema,
  updateH2AVisaSchema,
  createH2AHousingSchema,
  updateH2AHousingSchema,
  createH2ATransportationSchema,
  updateH2ATransportationSchema,
  createH2AComplianceCheckSchema,
  updateH2AComplianceCheckSchema,
  paginationSchema,
} from '@farm-commons/shared';
import db from '../../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = express.Router();

// All H-2A routes require authentication
router.use(authenticateToken);

// ============================================================================
// H-2A VISA MANAGEMENT
// ============================================================================

// List all H-2A visas for farm
router.get('/visas', async (req: AuthRequest, res, next) => {
  try {
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;
    const offset = (page - 1) * per_page;

    const [visas, [{ count }]] = await Promise.all([
      db('h2a_visas')
        .join('workers', 'h2a_visas.worker_id', 'workers.id')
        .where('workers.farm_id', farmId)
        .select(
          'h2a_visas.*',
          'workers.first_name',
          'workers.last_name',
          db.raw('CONCAT(workers.first_name, \' \', workers.last_name) as worker_name')
        )
        .orderBy('h2a_visas.end_date', 'asc')
        .limit(per_page)
        .offset(offset),
      db('h2a_visas')
        .join('workers', 'h2a_visas.worker_id', 'workers.id')
        .where('workers.farm_id', farmId)
        .count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: visas,
        total: Number.Number.parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(Number.Number.parseInt(count as string) / per_page),
      },
    });
  } catch {
    next(error);
  }
});

// Get H-2A visas expiring soon (within 60 days)
router.get('/visas/expiring', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const daysParam = req.query.days ? Number.Number.parseInt(req.query.days as string) : 60;
    const days = Math.min(Math.max(daysParam, 1), 365); // Clamp between 1-365 days

    const expiringVisas = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('workers.farm_id', farmId)
      .where('h2a_visas.status', 'active')
      .where('h2a_visas.end_date', '<=', db.raw('CURRENT_DATE + INTERVAL ? DAY', [days]))
      .where('h2a_visas.end_date', '>=', db.raw('CURRENT_DATE'))
      .select(
        'h2a_visas.*',
        'workers.first_name',
        'workers.last_name',
        db.raw('CONCAT(workers.first_name, \' \', workers.last_name) as worker_name'),
        db.raw('(h2a_visas.end_date - CURRENT_DATE) as days_until_expiration')
      )
      .orderBy('h2a_visas.end_date', 'asc');

    res.json({
      success: true,
      data: expiringVisas,
    });
  } catch {
    next(error);
  }
});

// Get single H-2A visa with all related records
router.get('/visas/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', id)
      .where('workers.farm_id', farmId)
      .select(
        'h2a_visas.*',
        'workers.first_name',
        'workers.last_name',
        db.raw('CONCAT(workers.first_name, \' \', workers.last_name) as worker_name')
      )
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    // Get related housing records
    const housing = await db('h2a_housing')
      .where('h2a_visa_id', id)
      .orderBy('start_date', 'desc');

    // Get transportation records
    const transportation = await db('h2a_transportation')
      .where('h2a_visa_id', id)
      .orderBy('transport_date', 'desc');

    // Get compliance checks
    const complianceChecks = await db('h2a_compliance_checks')
      .where('h2a_visa_id', id)
      .orderBy('due_date', 'asc');

    res.json({
      success: true,
      data: {
        visa,
        housing,
        transportation,
        compliance_checks: complianceChecks,
      },
    });
  } catch {
    next(error);
  }
});

// Create H-2A visa record (managers and admins only)
router.post('/visas', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createH2AVisaSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify worker belongs to farm
    const worker = await db('workers')
      .where({ id: data.worker_id, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found or does not belong to your farm', 404);
    }

    const [visa] = await db('h2a_visas')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: visa,
    });
  } catch {
    next(error);
  }
});

// Update H-2A visa
router.put('/visas/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateH2AVisaSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm's worker
    const existing = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!existing) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const [visa] = await db('h2a_visas')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: visa,
    });
  } catch {
    next(error);
  }
});

// Delete H-2A visa
router.delete('/visas/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm's worker
    const existing = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!existing) {
      throw new AppError('H-2A visa record not found', 404);
    }

    await db('h2a_visas').where('id', id).delete();

    res.json({
      success: true,
      message: 'H-2A visa record deleted successfully',
    });
  } catch {
    next(error);
  }
});

// ============================================================================
// HOUSING MANAGEMENT
// ============================================================================

// Get housing records for a visa
router.get('/visas/:visaId/housing', async (req: AuthRequest, res, next) => {
  try {
    const { visaId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', visaId)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const housing = await db('h2a_housing')
      .where('h2a_visa_id', visaId)
      .orderBy('start_date', 'desc');

    res.json({
      success: true,
      data: housing,
    });
  } catch {
    next(error);
  }
});

// Create housing record
router.post('/housing', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createH2AHousingSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify visa and worker belong to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', data.h2a_visa_id)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const [housing] = await db('h2a_housing')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: housing,
    });
  } catch {
    next(error);
  }
});

// Update housing record
router.put('/housing/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateH2AHousingSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify housing record belongs to farm
    const existing = await db('h2a_housing')
      .join('h2a_visas', 'h2a_housing.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_housing.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_housing.id')
      .first();

    if (!existing) {
      throw new AppError('Housing record not found', 404);
    }

    const [housing] = await db('h2a_housing')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: housing,
    });
  } catch {
    next(error);
  }
});

// Delete housing record
router.delete('/housing/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify housing record belongs to farm
    const existing = await db('h2a_housing')
      .join('h2a_visas', 'h2a_housing.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_housing.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_housing.id')
      .first();

    if (!existing) {
      throw new AppError('Housing record not found', 404);
    }

    await db('h2a_housing').where('id', id).delete();

    res.json({
      success: true,
      message: 'Housing record deleted successfully',
    });
  } catch {
    next(error);
  }
});

// ============================================================================
// TRANSPORTATION MANAGEMENT
// ============================================================================

// Get transportation records for a visa
router.get('/visas/:visaId/transportation', async (req: AuthRequest, res, next) => {
  try {
    const { visaId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', visaId)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const transportation = await db('h2a_transportation')
      .where('h2a_visa_id', visaId)
      .orderBy('transport_date', 'desc');

    res.json({
      success: true,
      data: transportation,
    });
  } catch {
    next(error);
  }
});

// Create transportation record
router.post('/transportation', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createH2ATransportationSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify visa and worker belong to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', data.h2a_visa_id)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const [transportation] = await db('h2a_transportation')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: transportation,
    });
  } catch {
    next(error);
  }
});

// Update transportation record
router.put('/transportation/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateH2ATransportationSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify transportation record belongs to farm
    const existing = await db('h2a_transportation')
      .join('h2a_visas', 'h2a_transportation.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_transportation.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_transportation.id')
      .first();

    if (!existing) {
      throw new AppError('Transportation record not found', 404);
    }

    const [transportation] = await db('h2a_transportation')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: transportation,
    });
  } catch {
    next(error);
  }
});

// Delete transportation record
router.delete('/transportation/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify transportation record belongs to farm
    const existing = await db('h2a_transportation')
      .join('h2a_visas', 'h2a_transportation.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_transportation.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_transportation.id')
      .first();

    if (!existing) {
      throw new AppError('Transportation record not found', 404);
    }

    await db('h2a_transportation').where('id', id).delete();

    res.json({
      success: true,
      message: 'Transportation record deleted successfully',
    });
  } catch {
    next(error);
  }
});

// ============================================================================
// COMPLIANCE CHECKS MANAGEMENT
// ============================================================================

// Get compliance checks for a visa
router.get('/visas/:visaId/compliance-checks', async (req: AuthRequest, res, next) => {
  try {
    const { visaId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', visaId)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const checks = await db('h2a_compliance_checks')
      .where('h2a_visa_id', visaId)
      .leftJoin('users', 'h2a_compliance_checks.verified_by', 'users.id')
      .select(
        'h2a_compliance_checks.*',
        'users.email as verified_by_email'
      )
      .orderBy('due_date', 'asc');

    res.json({
      success: true,
      data: checks,
    });
  } catch {
    next(error);
  }
});

// Create compliance check
router.post('/compliance-checks', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createH2AComplianceCheckSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify visa belongs to farm
    const visa = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_visas.id', data.h2a_visa_id)
      .where('workers.farm_id', farmId)
      .select('h2a_visas.id')
      .first();

    if (!visa) {
      throw new AppError('H-2A visa record not found', 404);
    }

    const [check] = await db('h2a_compliance_checks')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: check,
    });
  } catch {
    next(error);
  }
});

// Update compliance check
router.put('/compliance-checks/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateH2AComplianceCheckSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Verify compliance check belongs to farm
    const existing = await db('h2a_compliance_checks')
      .join('h2a_visas', 'h2a_compliance_checks.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_compliance_checks.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_compliance_checks.id')
      .first();

    if (!existing) {
      throw new AppError('Compliance check not found', 404);
    }

    // If marking as completed, set verified_by and completed_date
    const updateData: any = { ...data, updated_at: new Date() };
    if (data.completed && !data.completed_date) {
      updateData.completed_date = new Date();
      updateData.verified_by = userId;
    }

    const [check] = await db('h2a_compliance_checks')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      data: check,
    });
  } catch {
    next(error);
  }
});

// Delete compliance check
router.delete('/compliance-checks/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify compliance check belongs to farm
    const existing = await db('h2a_compliance_checks')
      .join('h2a_visas', 'h2a_compliance_checks.h2a_visa_id', 'h2a_visas.id')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('h2a_compliance_checks.id', id)
      .where('workers.farm_id', farmId)
      .select('h2a_compliance_checks.id')
      .first();

    if (!existing) {
      throw new AppError('Compliance check not found', 404);
    }

    await db('h2a_compliance_checks').where('id', id).delete();

    res.json({
      success: true,
      message: 'Compliance check deleted successfully',
    });
  } catch {
    next(error);
  }
});

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

// Generate comprehensive compliance report for all H-2A workers
router.get('/reports/compliance', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    // Get all active H-2A visas for the farm
    const visas = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('workers.farm_id', farmId)
      .where('h2a_visas.status', 'active')
      .select(
        'h2a_visas.*',
        'workers.first_name',
        'workers.last_name',
        db.raw('CONCAT(workers.first_name, \' \', workers.last_name) as worker_name'),
        db.raw('(h2a_visas.end_date - CURRENT_DATE) as days_until_expiration')
      );

    // Build compliance report for each visa
    const reports = await Promise.all(
      visas.map(async (visa) => {
        // Get current housing
        const currentHousing = await db('h2a_housing')
          .where('h2a_visa_id', visa.id)
          .where('start_date', '<=', db.raw('CURRENT_DATE'))
          .where(function () {
            this.whereNull('end_date').orWhere('end_date', '>=', db.raw('CURRENT_DATE'));
          })
          .first();

        // Count transportation records
        const [{ count: transportCount }] = await db('h2a_transportation')
          .where('h2a_visa_id', visa.id)
          .count('* as count');

        // Get compliance check statistics
        const [complianceStats] = await db('h2a_compliance_checks')
          .where('h2a_visa_id', visa.id)
          .select(
            db.raw('COUNT(*) as total'),
            db.raw('SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed'),
            db.raw('SUM(CASE WHEN completed = false THEN 1 ELSE 0 END) as pending'),
            db.raw(
              'SUM(CASE WHEN completed = false AND due_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue'
            )
          );

        // Determine housing compliance
        const housingCompliant =
          currentHousing &&
          currentHousing.last_inspection_date &&
          currentHousing.inspection_passed;

        // Determine overall compliance status
        let overallStatus: 'compliant' | 'warning' | 'non-compliant' = 'compliant';

        if (
          Number.Number.parseInt(complianceStats.overdue as string) > 0 ||
          !housingCompliant ||
          visa.days_until_expiration < 30
        ) {
          overallStatus = 'non-compliant';
        } else if (
          Number.Number.parseInt(complianceStats.pending as string) > 0 ||
          visa.days_until_expiration < 60
        ) {
          overallStatus = 'warning';
        }

        return {
          visa_id: visa.id,
          worker_id: visa.worker_id,
          worker_name: visa.worker_name,
          visa_number: visa.visa_number,
          visa_status: visa.status,
          visa_expiration: visa.end_date,
          days_until_expiration: Number.Number.parseInt(visa.days_until_expiration as string),
          housing_current: currentHousing || null,
          housing_compliant: !!housingCompliant,
          transportation_records: Number.Number.parseInt(transportCount as string),
          compliance_checks_total: Number.Number.parseInt(complianceStats.total as string),
          compliance_checks_completed: Number.Number.parseInt(complianceStats.completed as string),
          compliance_checks_pending: Number.Number.parseInt(complianceStats.pending as string),
          compliance_checks_overdue: Number.Number.parseInt(complianceStats.overdue as string),
          overall_compliance_status: overallStatus,
        };
      })
    );

    res.json({
      success: true,
      data: {
        generated_at: new Date(),
        total_h2a_workers: reports.length,
        compliant: reports.filter((r) => r.overall_compliance_status === 'compliant').length,
        warning: reports.filter((r) => r.overall_compliance_status === 'warning').length,
        non_compliant: reports.filter((r) => r.overall_compliance_status === 'non-compliant')
          .length,
        reports,
      },
    });
  } catch {
    next(error);
  }
});

// Get H-2A statistics for dashboard
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    const [stats] = await db('h2a_visas')
      .join('workers', 'h2a_visas.worker_id', 'workers.id')
      .where('workers.farm_id', farmId)
      .select(
        db.raw('COUNT(*) as total_visas'),
        db.raw("SUM(CASE WHEN h2a_visas.status = 'active' THEN 1 ELSE 0 END) as active_visas"),
        db.raw(
          "SUM(CASE WHEN h2a_visas.status = 'active' AND h2a_visas.end_date <= CURRENT_DATE + INTERVAL '60 days' AND h2a_visas.end_date >= CURRENT_DATE THEN 1 ELSE 0 END) as expiring_soon"
        ),
        db.raw(
          "SUM(CASE WHEN h2a_visas.status = 'active' AND h2a_visas.end_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired"
        )
      );

    res.json({
      success: true,
      data: stats,
    });
  } catch {
    next(error);
  }
});

export default router;
