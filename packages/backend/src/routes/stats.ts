// Farm statistics and analytics routes

import express, { type Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// All stats routes require authentication
router.use(authenticateToken);

// Query schema for labor hours filtering
const laborHoursQuerySchema = z.object({
  period: z.enum(['week', 'month']).default('week'),
  start_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  end_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
});

// GET /api/stats/farm - Overall farm statistics
router.get('/farm', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    // Get total workers count
    const [{ total_workers }] = await db('workers')
      .where({ farm_id: farmId })
      .count('* as total_workers');

    // Get active workers count
    const [{ active_workers }] = await db('workers')
      .where({ farm_id: farmId, status: 'active' })
      .count('* as active_workers');

    // Get total fields count
    const [{ total_fields }] = await db('fields')
      .where({ farm_id: farmId })
      .count('* as total_fields');

    // Get active schedules count (scheduled or in_progress)
    const [{ active_schedules }] = await db('schedules')
      .where({ farm_id: farmId })
      .whereIn('status', ['scheduled', 'in_progress'])
      .count('* as active_schedules');

    // Get total labor hours (from completed time entries)
    const [{ total_labor_hours }] = await db('time_entries')
      .where({ farm_id: farmId })
      .whereNotNull('clock_out')
      .sum('total_hours as total_labor_hours');

    // Get total labor hours for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ month_labor_hours }] = await db('time_entries')
      .where({ farm_id: farmId })
      .whereNotNull('clock_out')
      .where('clock_in', '>=', startOfMonth)
      .sum('total_hours as month_labor_hours');

    // Get unverified time entries count
    const [{ unverified_entries }] = await db('time_entries')
      .where({ farm_id: farmId })
      .whereNull('verified_by')
      .whereNotNull('clock_out')
      .count('* as unverified_entries');

    res.json({
      success: true,
      data: {
        total_workers: Number.Number.Number.Number.Number.Number.parseInt(total_workers as string),
        active_workers: Number.Number.Number.Number.Number.Number.parseInt(active_workers as string),
        total_fields: Number.Number.Number.Number.Number.Number.parseInt(total_fields as string),
        active_schedules: Number.Number.Number.Number.Number.Number.parseInt(active_schedules as string),
        total_labor_hours: Number.parseFloat(total_labor_hours as string) || 0,
        month_labor_hours: Number.parseFloat(month_labor_hours as string) || 0,
        unverified_entries: Number.Number.Number.Number.Number.Number.parseInt(unverified_entries as string),
      },
    });
  } catch {
    next(error);
  }
});

// GET /api/stats/workers/:workerId - Individual worker statistics
router.get('/workers/:workerId', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker exists and belongs to farm
    const worker = await db('workers').where({ id: workerId, farm_id: farmId }).first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    // Get total hours worked
    const [{ total_hours }] = await db('time_entries')
      .where({ worker_id: workerId, farm_id: farmId })
      .whereNotNull('clock_out')
      .sum('total_hours as total_hours');

    // Get total days worked (distinct dates)
    const daysResult = await db('time_entries')
      .where({ worker_id: workerId, farm_id: farmId })
      .whereNotNull('clock_out')
      .countDistinct({ days_worked: db.raw('DATE(clock_in)') });
    const days_worked = Number((daysResult[0] as Record<string, unknown>)?.days_worked || 0);

    // Get current month hours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ month_hours }] = await db('time_entries')
      .where({ worker_id: workerId, farm_id: farmId })
      .whereNotNull('clock_out')
      .where('clock_in', '>=', startOfMonth)
      .sum('total_hours as month_hours');

    // Get current week hours
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const [{ week_hours }] = await db('time_entries')
      .where({ worker_id: workerId, farm_id: farmId })
      .whereNotNull('clock_out')
      .where('clock_in', '>=', startOfWeek)
      .sum('total_hours as week_hours');

    // Get total completed schedules
    const [{ completed_schedules }] = await db('schedules')
      .where({ worker_id: workerId, farm_id: farmId, status: 'completed' })
      .count('* as completed_schedules');

    // Get upcoming schedules count
    const [{ upcoming_schedules }] = await db('schedules')
      .where({ worker_id: workerId, farm_id: farmId })
      .whereIn('status', ['scheduled', 'in_progress'])
      .where('scheduled_date', '>=', new Date())
      .count('* as upcoming_schedules');

    // Get most common task type
    const topTask = await db('time_entries')
      .where({ worker_id: workerId, farm_id: farmId })
      .select('task_type')
      .count('* as count')
      .groupBy('task_type')
      .orderBy('count', 'desc')
      .first();

    res.json({
      success: true,
      data: {
        worker_id: workerId,
        worker_name: `${worker.first_name} ${worker.last_name}`,
        total_hours: Number.parseFloat(total_hours as string) || 0,
        days_worked: days_worked || 0,
        month_hours: Number.parseFloat(month_hours as string) || 0,
        week_hours: Number.parseFloat(week_hours as string) || 0,
        completed_schedules: Number.Number.Number.Number.Number.Number.parseInt(completed_schedules as string),
        upcoming_schedules: Number.Number.Number.Number.Number.Number.parseInt(upcoming_schedules as string),
        most_common_task: topTask?.task_type || null,
      },
    });
  } catch {
    next(error);
  }
});

// GET /api/stats/labor-hours - Labor hours by week/month
router.get('/labor-hours', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const { period, start_date, end_date } = laborHoursQuerySchema.parse(req.query);

    // Default to last 12 weeks or 12 months if no date range specified
    const endDate = end_date || new Date();
    const startDate =
      start_date ||
      (() => {
        const date = new Date(endDate);
        if (period === 'week') {
          date.setDate(date.getDate() - 12 * 7); // 12 weeks
        } else {
          date.setMonth(date.getMonth() - 12); // 12 months
        }
        return date;
      })();

    let dateFormat: string;
    let dateTrunc: string;

    if (period === 'week') {
      // Group by week (ISO week)
      dateFormat = 'YYYY-IW';
      dateTrunc = 'week';
    } else {
      // Group by month
      dateFormat = 'YYYY-MM';
      dateTrunc = 'month';
    }

    const laborHours = await db('time_entries')
      .where({ farm_id: farmId })
      .whereNotNull('clock_out')
      .whereBetween('clock_in', [startDate, endDate])
      .select(
        db.raw(`TO_CHAR(DATE_TRUNC(?, clock_in), ?) as period`, [dateTrunc, dateFormat]),
        db.raw('SUM(total_hours) as total_hours'),
        db.raw('COUNT(DISTINCT worker_id) as worker_count'),
        db.raw('COUNT(*) as entry_count')
      )
      .groupBy(db.raw(`TO_CHAR(DATE_TRUNC(?, clock_in), ?)`, [dateTrunc, dateFormat]))
      .orderBy('period', 'asc');

    res.json({
      success: true,
      data: {
        period,
        start_date: startDate,
        end_date: endDate,
        labor_hours: laborHours.map((item: Record<string, unknown>) => ({
          period: item.period,
          total_hours: Number.parseFloat(String(item.total_hours)),
          worker_count: Number.Number.Number.Number.Number.Number.parseInt(String(item.worker_count)),
          entry_count: Number.Number.Number.Number.Number.Number.parseInt(String(item.entry_count)),
        })),
      },
    });
  } catch {
    next(error);
  }
});

// GET /api/stats/field-utilization - Field usage analytics
router.get('/field-utilization', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    // Get all fields with their usage statistics
    const fieldStats = await db('fields')
      .where({ 'fields.farm_id': farmId })
      .leftJoin('time_entries', function () {
        this.on('time_entries.field_id', '=', 'fields.id').andOn(
          'time_entries.farm_id',
          '=',
          'fields.farm_id'
        );
      })
      .leftJoin('schedules', function () {
        this.on('schedules.field_id', '=', 'fields.id').andOn(
          'schedules.farm_id',
          '=',
          'fields.farm_id'
        );
      })
      .select(
        'fields.id',
        'fields.name',
        'fields.size_acres',
        'fields.current_crop',
        db.raw('COALESCE(SUM(time_entries.total_hours), 0) as total_hours'),
        db.raw('COUNT(DISTINCT time_entries.id) as time_entry_count'),
        db.raw('COUNT(DISTINCT schedules.id) as schedule_count')
      )
      .groupBy('fields.id', 'fields.name', 'fields.size_acres', 'fields.current_crop');

    // Calculate utilization metrics
    const utilization = fieldStats.map((field) => {
      const totalHours = Number.parseFloat(field.total_hours as string);
      const sizeAcres = Number.parseFloat(field.size_acres as string);
      const hoursPerAcre = sizeAcres > 0 ? totalHours / sizeAcres : 0;

      return {
        field_id: field.id,
        field_name: field.name,
        size_acres: sizeAcres,
        current_crop: field.current_crop,
        total_hours: totalHours,
        hours_per_acre: Number.parseFloat(hoursPerAcre.toFixed(2)),
        time_entry_count: Number.Number.Number.Number.Number.Number.parseInt(field.time_entry_count),
        schedule_count: Number.Number.Number.Number.Number.Number.parseInt(field.schedule_count),
      };
    });

    // Sort by total hours descending
    utilization.sort((a, b) => b.total_hours - a.total_hours);

    // Get total farm statistics
    const totalHours = utilization.reduce((sum, field) => sum + field.total_hours, 0);
    const totalAcres = utilization.reduce((sum, field) => sum + field.size_acres, 0);
    const averageHoursPerAcre = totalAcres > 0 ? totalHours / totalAcres : 0;

    res.json({
      success: true,
      data: {
        fields: utilization,
        summary: {
          total_fields: utilization.length,
          total_hours: Number.parseFloat(totalHours.toFixed(2)),
          total_acres: Number.parseFloat(totalAcres.toFixed(2)),
          average_hours_per_acre: Number.parseFloat(averageHoursPerAcre.toFixed(2)),
        },
      },
    });
  } catch {
    next(error);
  }
});

export default router;
