// Safety incident reporting routes

// OSHA incident tracking and reporting

import express from 'express';
import {
  createIncidentSchema,
  updateIncidentSchema,
  incidentQuerySchema,
  paginationSchema,
  dateRangeSchema,
} from '@farm-commons/shared';
import db from '../../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// List incidents with filtering
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const queryParams = incidentQuerySchema.parse(req.query);
    const { page, per_page } = paginationSchema.parse(req.query);

    const offset = (page - 1) * per_page;

    // Build query with filters
    let query = db('incidents')
      .where('incidents.farm_id', farmId)
      .leftJoin('workers', 'incidents.worker_id', 'workers.id')
      .leftJoin('users as investigators', 'incidents.investigated_by', 'investigators.id')
      .select(
        'incidents.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name',
        'investigators.email as investigator_email'
      );

    // Apply filters
    if (queryParams.start_date) {
      query = query.where('incidents.incident_date', '>=', queryParams.start_date);
    }
    if (queryParams.end_date) {
      query = query.where('incidents.incident_date', '<=', queryParams.end_date);
    }
    if (queryParams.incident_type) {
      query = query.where('incidents.incident_type', queryParams.incident_type);
    }
    if (queryParams.severity) {
      query = query.where('incidents.severity', queryParams.severity);
    }
    if (queryParams.osha_recordable !== undefined) {
      query = query.where('incidents.osha_recordable', queryParams.osha_recordable);
    }
    if (queryParams.status) {
      query = query.where('incidents.status', queryParams.status);
    }
    if (queryParams.worker_id) {
      query = query.where('incidents.worker_id', queryParams.worker_id);
    }

    const [incidents, [{ count }]] = await Promise.all([
      query.orderBy('incidents.incident_date', 'desc').limit(per_page).offset(offset),
      db('incidents').where('farm_id', farmId).count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: incidents,
        total: Number.parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(Number.parseInt(count as string) / per_page),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single incident
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const incident = await db('incidents')
      .where({ 'incidents.id': id, 'incidents.farm_id': farmId })
      .leftJoin('workers', 'incidents.worker_id', 'workers.id')
      .leftJoin('users as investigators', 'incidents.investigated_by', 'investigators.id')
      .select(
        'incidents.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name',
        'workers.email as worker_email',
        'workers.phone as worker_phone',
        'investigators.email as investigator_email'
      )
      .first();

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    // Get witness information if any
    if (incident.witness_ids && incident.witness_ids.length > 0) {
      const witnesses = await db('workers')
        .whereIn('id', incident.witness_ids)
        .select('id', 'first_name', 'last_name', 'email', 'phone');
      incident.witnesses = witnesses;
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
});

// Create incident report (managers and admins only)
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createIncidentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify worker belongs to the farm
    const worker = await db('workers').where({ id: data.worker_id, farm_id: farmId }).first();

    if (!worker) {
      throw new AppError('Worker not found or does not belong to this farm', 404);
    }

    // Verify witnesses belong to the farm
    if (data.witness_ids && data.witness_ids.length > 0) {
      const witnessCount = await db('workers')
        .whereIn('id', data.witness_ids)
        .where('farm_id', farmId)
        .count('* as count');

      if (Number.parseInt(witnessCount[0].count as string) !== data.witness_ids.length) {
        throw new AppError('One or more witnesses not found or do not belong to this farm', 400);
      }
    }

    const [incident] = await db('incidents')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
});

// Update incident
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateIncidentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // If updating worker_id, verify new worker belongs to farm
    if (data.worker_id) {
      const worker = await db('workers').where({ id: data.worker_id, farm_id: farmId }).first();

      if (!worker) {
        throw new AppError('Worker not found or does not belong to this farm', 404);
      }
    }

    // If updating witness_ids, verify witnesses belong to farm
    if (data.witness_ids && data.witness_ids.length > 0) {
      const witnessCount = await db('workers')
        .whereIn('id', data.witness_ids)
        .where('farm_id', farmId)
        .count('* as count');

      if (Number.parseInt(witnessCount[0].count as string) !== data.witness_ids.length) {
        throw new AppError('One or more witnesses not found or do not belong to this farm', 400);
      }
    }

    // If marking as investigated, set investigated_at if not provided
    if (data.status === 'investigation_complete' && !data.investigated_at) {
      data.investigated_at = new Date();
    }

    // Set investigated_by to current user if marking as investigated and not provided
    if (data.status === 'investigation_complete' && !data.investigated_by) {
      data.investigated_by = req.user?.id;
    }

    const [incident] = await db('incidents')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
});

// Delete incident
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('incidents').where({ id, farm_id: farmId }).delete();

    if (!deleted) {
      throw new AppError('Incident not found', 404);
    }

    res.json({
      success: true,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Generate OSHA 300 log
router.get(
  '/reports/osha-300',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const farmId = req.user?.farm_id;
      const { start_date, end_date } = dateRangeSchema.parse(req.query);

      // Get all OSHA recordable incidents within date range
      const incidents = await db('incidents')
        .where('incidents.farm_id', farmId)
        .where('incidents.osha_recordable', true)
        .whereBetween('incidents.incident_date', [start_date, end_date])
        .leftJoin('workers', 'incidents.worker_id', 'workers.id')
        .select(
          'incidents.*',
          'workers.first_name as worker_first_name',
          'workers.last_name as worker_last_name',
          'workers.hire_date as worker_hire_date'
        )
        .orderBy('incidents.incident_date', 'asc');

      // Calculate summary statistics
      const summary = {
        total_cases: incidents.length,
        injuries: incidents.filter((i) => i.incident_type === 'injury').length,
        illnesses: incidents.filter((i) => i.incident_type === 'illness').length,
        deaths: incidents.filter((i) => i.severity === 'fatality').length,
        days_away_from_work_cases: incidents.filter((i) => i.days_away_from_work > 0).length,
        job_transfer_restriction_cases: incidents.filter((i) => i.days_of_restricted_work > 0)
          .length,
        other_recordable_cases: incidents.filter(
          (i) =>
            i.days_away_from_work === 0 &&
            i.days_of_restricted_work === 0 &&
            i.severity !== 'fatality'
        ).length,
        total_days_away: incidents.reduce((sum, i) => sum + (i.days_away_from_work || 0), 0),
        total_days_restricted: incidents.reduce(
          (sum, i) => sum + (i.days_of_restricted_work || 0),
          0
        ),
      };

      // Format incidents for OSHA 300 log
      const osha300Log = incidents.map((incident) => ({
        case_number: incident.osha_case_number || 'N/A',
        employee_name: `${incident.worker_last_name}, ${incident.worker_first_name}`,
        job_title: 'Farm Worker', // Could be enhanced with job title from workers table
        date_of_injury: incident.incident_date,
        where_event_occurred: incident.location,
        describe_injury: incident.description,
        classify_injury: incident.incident_type,
        death: incident.severity === 'fatality' ? 'X' : '',
        days_away_from_work: incident.days_away_from_work || 0,
        days_job_transfer_restriction: incident.days_of_restricted_work || 0,
        other_recordable:
          incident.days_away_from_work === 0 &&
          incident.days_of_restricted_work === 0 &&
          incident.severity !== 'fatality'
            ? 'X'
            : '',
      }));

      res.json({
        success: true,
        data: {
          period: {
            start_date,
            end_date,
          },
          summary,
          incidents: osha300Log,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get incident statistics
router.get(
  '/stats/summary',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const farmId = req.user?.farm_id;
      const queryParams = incidentQuerySchema.parse(req.query);

      // Build base query
      let query = db('incidents').where('farm_id', farmId);

      // Apply date filters
      if (queryParams.start_date) {
        query = query.where('incident_date', '>=', queryParams.start_date);
      }
      if (queryParams.end_date) {
        query = query.where('incident_date', '<=', queryParams.end_date);
      }

      // Get overall statistics
      const [stats] = await query
        .clone()
        .select(
          db.raw('COUNT(*) as total_incidents'),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'injury') as total_injuries"),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'illness') as total_illnesses"),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'near_miss') as total_near_misses"),
          db.raw("COUNT(*) FILTER (WHERE severity = 'fatality') as total_fatalities"),
          db.raw('COUNT(*) FILTER (WHERE osha_recordable = true) as total_osha_recordable'),
          db.raw("COUNT(*) FILTER (WHERE severity = 'lost_time') as total_lost_time"),
          db.raw('SUM(days_away_from_work) as total_days_away'),
          db.raw('SUM(days_of_restricted_work) as total_days_restricted')
        );

      // Get incidents by type
      const byType = await query
        .clone()
        .select('incident_type')
        .count('* as count')
        .groupBy('incident_type')
        .orderBy('count', 'desc');

      // Get incidents by severity
      const bySeverity = await query
        .clone()
        .select('severity')
        .count('* as count')
        .groupBy('severity')
        .orderBy('count', 'desc');

      // Get incidents by status
      const byStatus = await query.clone().select('status').count('* as count').groupBy('status');

      // Get monthly trend
      const monthlyTrend = await query
        .clone()
        .select(db.raw("TO_CHAR(incident_date, 'YYYY-MM') as month"), db.raw('COUNT(*) as count'))
        .groupBy('month')
        .orderBy('month', 'desc')
        .limit(12);

      // Top workers with incidents
      const topWorkers = await query
        .clone()
        .leftJoin('workers', 'incidents.worker_id', 'workers.id')
        .select('workers.id', 'workers.first_name', 'workers.last_name')
        .count('incidents.id as incident_count')
        .groupBy('workers.id', 'workers.first_name', 'workers.last_name')
        .orderBy('incident_count', 'desc')
        .limit(10);

      res.json({
        success: true,
        data: {
          summary: {
            total_incidents: Number.parseInt(stats.total_incidents as string) || 0,
            total_injuries: Number.parseInt(stats.total_injuries as string) || 0,
            total_illnesses: Number.parseInt(stats.total_illnesses as string) || 0,
            total_near_misses: Number.parseInt(stats.total_near_misses as string) || 0,
            total_fatalities: Number.parseInt(stats.total_fatalities as string) || 0,
            total_osha_recordable: Number.parseInt(stats.total_osha_recordable as string) || 0,
            total_lost_time: Number.parseInt(stats.total_lost_time as string) || 0,
            total_days_away: Number.parseInt(stats.total_days_away as string) || 0,
            total_days_restricted: Number.parseInt(stats.total_days_restricted as string) || 0,
          },
          by_type: byType.map((row) => ({
            type: row.incident_type,
            count: Number.parseInt(row.count as string),
          })),
          by_severity: bySeverity.map((row) => ({
            severity: row.severity,
            count: Number.parseInt(row.count as string),
          })),
          by_status: byStatus.map((row) => ({
            status: row.status,
            count: Number.parseInt(row.count as string),
          })),
          monthly_trend: monthlyTrend.map((row) => ({
            month: row.month,
            count: Number.parseInt(row.count as string),
          })),
          top_workers: topWorkers.map((row) => ({
            worker_id: row.id,
            worker_name: `${row.first_name} ${row.last_name}`,
            incident_count: Number.parseInt(row.incident_count as string),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
