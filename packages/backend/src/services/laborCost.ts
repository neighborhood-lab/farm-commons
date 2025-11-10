// Labor Cost Calculator Service
// Calculates true labor costs including wages, overhead, and benefits

import type { Knex } from 'knex';
import db from '../db/connection.js';

/**
 * Configuration for labor cost calculations
 */
export interface LaborCostConfig {
  // Overhead percentage (e.g., 0.15 for 15% overhead on base wages)
  overheadRate: number;
  // Benefits cost as percentage of base wage (e.g., 0.20 for 20%)
  benefitsRate: number;
  // Workers compensation insurance rate
  workersCompRate?: number;
  // Payroll tax rate (FICA, unemployment, etc.)
  payrollTaxRate?: number;
}

/**
 * Default labor cost configuration
 */
const DEFAULT_CONFIG: LaborCostConfig = {
  overheadRate: 0.15, // 15% overhead
  benefitsRate: 0.20, // 20% benefits
  workersCompRate: 0.03, // 3% workers compensation
  payrollTaxRate: 0.0765, // 7.65% FICA
};

/**
 * Result of labor cost calculation
 */
export interface LaborCostResult {
  baseWage: number;
  overhead: number;
  benefits: number;
  workersComp: number;
  payrollTax: number;
  totalCost: number;
  hours: number;
  costPerHour: number;
}

/**
 * Field profitability analysis result
 */
export interface FieldProfitabilityResult {
  fieldId: string;
  fieldName: string;
  totalLaborCost: number;
  totalHours: number;
  averageCostPerHour: number;
  currentCrop: string | null;
  timeEntriesCount: number;
}

/**
 * Historical cost trend data point
 */
export interface CostTrendDataPoint {
  period: string; // e.g., "2024-01" for monthly, "2024-W12" for weekly
  totalLaborCost: number;
  totalHours: number;
  averageCostPerHour: number;
  workerCount: number;
}

/**
 * Calculate total labor cost including base wage, overhead, and benefits
 */
export async function calculateLaborCost(
  workerId: string,
  startDate: Date,
  endDate: Date,
  config: Partial<LaborCostConfig> = {}
): Promise<LaborCostResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Get worker's hourly rate
  const worker = await db('workers').where({ id: workerId }).first();

  if (!worker) {
    throw new Error(`Worker not found: ${workerId}`);
  }

  if (!worker.hourly_rate) {
    throw new Error(`Worker ${workerId} does not have an hourly rate set`);
  }

  // Get total hours worked in the date range
  const result = await db('time_entries')
    .where({ worker_id: workerId })
    .whereBetween('clock_in', [startDate, endDate])
    .whereNotNull('clock_out')
    .sum('total_hours as total_hours')
    .first();

  const hours = Number(result?.total_hours || 0);

  // Calculate costs
  const baseWage = hours * worker.hourly_rate;
  const overhead = baseWage * fullConfig.overheadRate;
  const benefits = baseWage * fullConfig.benefitsRate;
  const workersComp = baseWage * (fullConfig.workersCompRate || 0);
  const payrollTax = baseWage * (fullConfig.payrollTaxRate || 0);
  const totalCost = baseWage + overhead + benefits + workersComp + payrollTax;

  return {
    baseWage: Number(baseWage.toFixed(2)),
    overhead: Number(overhead.toFixed(2)),
    benefits: Number(benefits.toFixed(2)),
    workersComp: Number(workersComp.toFixed(2)),
    payrollTax: Number(payrollTax.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    hours: Number(hours.toFixed(2)),
    costPerHour: hours > 0 ? Number((totalCost / hours).toFixed(2)) : 0,
  };
}

/**
 * Calculate labor costs for all workers in a farm
 */
export async function calculateFarmLaborCost(
  farmId: string,
  startDate: Date,
  endDate: Date,
  config: Partial<LaborCostConfig> = {}
): Promise<LaborCostResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Get all time entries with worker hourly rates
  const timeEntries = await db('time_entries')
    .join('workers', 'time_entries.worker_id', 'workers.id')
    .where({ 'time_entries.farm_id': farmId })
    .whereBetween('time_entries.clock_in', [startDate, endDate])
    .whereNotNull('time_entries.clock_out')
    .select(
      'time_entries.total_hours',
      'workers.hourly_rate'
    );

  let totalHours = 0;
  let totalBaseWage = 0;

  for (const entry of timeEntries) {
    const hours = Number(entry.total_hours || 0);
    const rate = Number(entry.hourly_rate || 0);
    totalHours += hours;
    totalBaseWage += hours * rate;
  }

  // Calculate costs
  const overhead = totalBaseWage * fullConfig.overheadRate;
  const benefits = totalBaseWage * fullConfig.benefitsRate;
  const workersComp = totalBaseWage * (fullConfig.workersCompRate || 0);
  const payrollTax = totalBaseWage * (fullConfig.payrollTaxRate || 0);
  const totalCost = totalBaseWage + overhead + benefits + workersComp + payrollTax;

  return {
    baseWage: Number(totalBaseWage.toFixed(2)),
    overhead: Number(overhead.toFixed(2)),
    benefits: Number(benefits.toFixed(2)),
    workersComp: Number(workersComp.toFixed(2)),
    payrollTax: Number(payrollTax.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    hours: Number(totalHours.toFixed(2)),
    costPerHour: totalHours > 0 ? Number((totalCost / totalHours).toFixed(2)) : 0,
  };
}

/**
 * Analyze field/crop profitability by calculating labor costs per field
 */
export async function analyzeFieldProfitability(
  farmId: string,
  startDate: Date,
  endDate: Date,
  config: Partial<LaborCostConfig> = {}
): Promise<FieldProfitabilityResult[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Get time entries grouped by field with worker rates
  const fieldData = await db('time_entries')
    .join('workers', 'time_entries.worker_id', 'workers.id')
    .leftJoin('fields', 'time_entries.field_id', 'fields.id')
    .where({ 'time_entries.farm_id': farmId })
    .whereBetween('time_entries.clock_in', [startDate, endDate])
    .whereNotNull('time_entries.clock_out')
    .whereNotNull('time_entries.field_id')
    .groupBy('time_entries.field_id', 'fields.name', 'fields.current_crop')
    .select(
      'time_entries.field_id',
      'fields.name as field_name',
      'fields.current_crop',
      db.raw('SUM(time_entries.total_hours) as total_hours'),
      db.raw('COUNT(*) as entries_count'),
      db.raw('SUM(time_entries.total_hours * workers.hourly_rate) as base_wage')
    );

  const results: FieldProfitabilityResult[] = fieldData.map((field) => {
    const totalHours = Number(field.total_hours || 0);
    const baseWage = Number(field.base_wage || 0);

    // Calculate total cost with overhead and benefits
    const totalMultiplier = 1 +
      fullConfig.overheadRate +
      fullConfig.benefitsRate +
      (fullConfig.workersCompRate || 0) +
      (fullConfig.payrollTaxRate || 0);

    const totalLaborCost = baseWage * totalMultiplier;

    return {
      fieldId: field.field_id,
      fieldName: field.field_name || 'Unknown Field',
      totalLaborCost: Number(totalLaborCost.toFixed(2)),
      totalHours: Number(totalHours.toFixed(2)),
      averageCostPerHour: totalHours > 0 ? Number((totalLaborCost / totalHours).toFixed(2)) : 0,
      currentCrop: field.current_crop,
      timeEntriesCount: Number(field.entries_count),
    };
  });

  return results.sort((a, b) => b.totalLaborCost - a.totalLaborCost);
}

/**
 * Get historical cost trends by period (monthly or weekly)
 */
export async function getHistoricalCostTrends(
  farmId: string,
  startDate: Date,
  endDate: Date,
  period: 'monthly' | 'weekly' = 'monthly',
  config: Partial<LaborCostConfig> = {}
): Promise<CostTrendDataPoint[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Determine the date format based on period
  const dateFormat = period === 'monthly'
    ? "TO_CHAR(time_entries.clock_in, 'YYYY-MM')"
    : "TO_CHAR(time_entries.clock_in, 'IYYY-IW')"; // ISO week format

  // Get time entries grouped by period
  const trendData = await db('time_entries')
    .join('workers', 'time_entries.worker_id', 'workers.id')
    .where({ 'time_entries.farm_id': farmId })
    .whereBetween('time_entries.clock_in', [startDate, endDate])
    .whereNotNull('time_entries.clock_out')
    .groupBy(db.raw(dateFormat))
    .orderBy(db.raw(dateFormat))
    .select(
      db.raw(`${dateFormat} as period`),
      db.raw('SUM(time_entries.total_hours) as total_hours'),
      db.raw('SUM(time_entries.total_hours * workers.hourly_rate) as base_wage'),
      db.raw('COUNT(DISTINCT time_entries.worker_id) as worker_count')
    );

  const results: CostTrendDataPoint[] = trendData.map((data) => {
    const totalHours = Number(data.total_hours || 0);
    const baseWage = Number(data.base_wage || 0);

    // Calculate total cost with overhead and benefits
    const totalMultiplier = 1 +
      fullConfig.overheadRate +
      fullConfig.benefitsRate +
      (fullConfig.workersCompRate || 0) +
      (fullConfig.payrollTaxRate || 0);

    const totalLaborCost = baseWage * totalMultiplier;

    return {
      period: data.period,
      totalLaborCost: Number(totalLaborCost.toFixed(2)),
      totalHours: Number(totalHours.toFixed(2)),
      averageCostPerHour: totalHours > 0 ? Number((totalLaborCost / totalHours).toFixed(2)) : 0,
      workerCount: Number(data.worker_count),
    };
  });

  return results;
}

/**
 * Calculate labor cost for a specific crop across all fields
 */
export async function calculateCropLaborCost(
  farmId: string,
  cropName: string,
  startDate: Date,
  endDate: Date,
  config: Partial<LaborCostConfig> = {}
): Promise<LaborCostResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Get all time entries for fields with the specified crop
  const timeEntries = await db('time_entries')
    .join('workers', 'time_entries.worker_id', 'workers.id')
    .join('fields', 'time_entries.field_id', 'fields.id')
    .where({
      'time_entries.farm_id': farmId,
      'fields.current_crop': cropName
    })
    .whereBetween('time_entries.clock_in', [startDate, endDate])
    .whereNotNull('time_entries.clock_out')
    .select(
      'time_entries.total_hours',
      'workers.hourly_rate'
    );

  let totalHours = 0;
  let totalBaseWage = 0;

  for (const entry of timeEntries) {
    const hours = Number(entry.total_hours || 0);
    const rate = Number(entry.hourly_rate || 0);
    totalHours += hours;
    totalBaseWage += hours * rate;
  }

  // Calculate costs
  const overhead = totalBaseWage * fullConfig.overheadRate;
  const benefits = totalBaseWage * fullConfig.benefitsRate;
  const workersComp = totalBaseWage * (fullConfig.workersCompRate || 0);
  const payrollTax = totalBaseWage * (fullConfig.payrollTaxRate || 0);
  const totalCost = totalBaseWage + overhead + benefits + workersComp + payrollTax;

  return {
    baseWage: Number(totalBaseWage.toFixed(2)),
    overhead: Number(overhead.toFixed(2)),
    benefits: Number(benefits.toFixed(2)),
    workersComp: Number(workersComp.toFixed(2)),
    payrollTax: Number(payrollTax.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    hours: Number(totalHours.toFixed(2)),
    costPerHour: totalHours > 0 ? Number((totalCost / totalHours).toFixed(2)) : 0,
  };
}
