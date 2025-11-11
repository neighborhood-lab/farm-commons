// Custom Business Metrics
// Farm-specific metrics for monitoring business operations

import promClient from 'prom-client';
import { getRegistry } from './prometheus.js';

const register = getRegistry();

// Worker Metrics
const workersTotal = new promClient.Gauge({
  name: 'farm_commons_workers_total',
  help: 'Total number of workers in the system',
  labelNames: ['status'],
  registers: [register],
});

const workersClockedIn = new promClient.Gauge({
  name: 'farm_commons_workers_clocked_in',
  help: 'Number of workers currently clocked in',
  registers: [register],
});

const workerCheckIns = new promClient.Counter({
  name: 'farm_commons_worker_check_ins_total',
  help: 'Total number of worker check-ins',
  labelNames: ['worker_id'],
  registers: [register],
});

const workerCheckOuts = new promClient.Counter({
  name: 'farm_commons_worker_check_outs_total',
  help: 'Total number of worker check-outs',
  labelNames: ['worker_id'],
  registers: [register],
});

// Schedule Metrics
const schedulesTotal = new promClient.Gauge({
  name: 'farm_commons_schedules_total',
  help: 'Total number of schedules',
  labelNames: ['status'],
  registers: [register],
});

const schedulesUpcoming = new promClient.Gauge({
  name: 'farm_commons_schedules_upcoming',
  help: 'Number of upcoming schedules (next 7 days)',
  registers: [register],
});

const scheduleCreated = new promClient.Counter({
  name: 'farm_commons_schedule_created_total',
  help: 'Total number of schedules created',
  registers: [register],
});

const scheduleUpdated = new promClient.Counter({
  name: 'farm_commons_schedule_updated_total',
  help: 'Total number of schedules updated',
  registers: [register],
});

const scheduleDeleted = new promClient.Counter({
  name: 'farm_commons_schedule_deleted_total',
  help: 'Total number of schedules deleted',
  registers: [register],
});

// Time Entry Metrics
const timeEntriesActive = new promClient.Gauge({
  name: 'farm_commons_time_entries_active',
  help: 'Number of active time entries (not yet clocked out)',
  registers: [register],
});

const timeEntriesTotal = new promClient.Counter({
  name: 'farm_commons_time_entries_total',
  help: 'Total number of time entries',
  labelNames: ['type'],
  registers: [register],
});

const laborHoursTotal = new promClient.Counter({
  name: 'farm_commons_labor_hours_total',
  help: 'Total labor hours tracked',
  labelNames: ['worker_id', 'task_type'],
  registers: [register],
});

const timeEntryDuration = new promClient.Histogram({
  name: 'farm_commons_time_entry_duration_hours',
  help: 'Duration of time entries in hours',
  labelNames: ['task_type'],
  buckets: [0.5, 1, 2, 4, 8, 12, 16],
  registers: [register],
});

// Certification Metrics
const certificationsTotal = new promClient.Gauge({
  name: 'farm_commons_certifications_total',
  help: 'Total number of certifications',
  labelNames: ['type', 'status'],
  registers: [register],
});

const certificationsExpiring = new promClient.Gauge({
  name: 'farm_commons_certifications_expiring',
  help: 'Number of certifications expiring soon',
  labelNames: ['days_until_expiry'],
  registers: [register],
});

const certificationUploaded = new promClient.Counter({
  name: 'farm_commons_certification_uploaded_total',
  help: 'Total number of certifications uploaded',
  registers: [register],
});

// Field Metrics
const fieldsTotal = new promClient.Gauge({
  name: 'farm_commons_fields_total',
  help: 'Total number of fields',
  labelNames: ['status'],
  registers: [register],
});

const fieldAreaTotal = new promClient.Gauge({
  name: 'farm_commons_field_area_total_acres',
  help: 'Total field area in acres',
  registers: [register],
});

const fieldUtilization = new promClient.Gauge({
  name: 'farm_commons_field_utilization_percent',
  help: 'Percentage of fields currently in use',
  registers: [register],
});

// Authentication Metrics
const loginAttempts = new promClient.Counter({
  name: 'farm_commons_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [register],
});

const registrations = new promClient.Counter({
  name: 'farm_commons_registrations_total',
  help: 'Total number of user registrations',
  registers: [register],
});

const activeUsers = new promClient.Gauge({
  name: 'farm_commons_active_users',
  help: 'Number of active users (logged in within last 24h)',
  registers: [register],
});

// Export metric recording functions

/**
 * Record worker metrics
 */
export function setWorkerMetrics(total: number, active: number, inactive: number): void {
  workersTotal.labels('active').set(active);
  workersTotal.labels('inactive').set(inactive);
  workersTotal.labels('all').set(total);
}

export function setWorkersClockedIn(count: number): void {
  workersClockedIn.set(count);
}

export function recordWorkerCheckIn(workerId: string): void {
  workerCheckIns.labels(workerId).inc();
}

export function recordWorkerCheckOut(workerId: string): void {
  workerCheckOuts.labels(workerId).inc();
}

/**
 * Record schedule metrics
 */
export function setScheduleMetrics(
  total: number,
  active: number,
  completed: number,
  upcoming: number
): void {
  schedulesTotal.labels('active').set(active);
  schedulesTotal.labels('completed').set(completed);
  schedulesTotal.labels('all').set(total);
  schedulesUpcoming.set(upcoming);
}

export function recordScheduleCreated(): void {
  scheduleCreated.inc();
}

export function recordScheduleUpdated(): void {
  scheduleUpdated.inc();
}

export function recordScheduleDeleted(): void {
  scheduleDeleted.inc();
}

/**
 * Record time entry metrics
 */
export function setTimeEntriesActive(count: number): void {
  timeEntriesActive.set(count);
}

export function recordTimeEntry(type: string): void {
  timeEntriesTotal.labels(type).inc();
}

export function recordLaborHours(workerId: string, taskType: string, hours: number): void {
  laborHoursTotal.labels(workerId, taskType).inc(hours);
}

export function recordTimeEntryDuration(taskType: string, hours: number): void {
  timeEntryDuration.labels(taskType).observe(hours);
}

/**
 * Record certification metrics
 */
export function setCertificationMetrics(
  total: number,
  active: number,
  expired: number
): void {
  certificationsTotal.labels('all', 'all').set(total);
  certificationsTotal.labels('all', 'active').set(active);
  certificationsTotal.labels('all', 'expired').set(expired);
}

export function setCertificationsExpiring(days30: number, days60: number, days90: number): void {
  certificationsExpiring.labels('30').set(days30);
  certificationsExpiring.labels('60').set(days60);
  certificationsExpiring.labels('90').set(days90);
}

export function recordCertificationUploaded(): void {
  certificationUploaded.inc();
}

/**
 * Record field metrics
 */
export function setFieldMetrics(total: number, active: number, totalArea: number): void {
  fieldsTotal.labels('active').set(active);
  fieldsTotal.labels('all').set(total);
  fieldAreaTotal.set(totalArea);

  if (total > 0) {
    fieldUtilization.set((active / total) * 100);
  }
}

/**
 * Record authentication metrics
 */
export function recordLoginAttempt(success: boolean): void {
  loginAttempts.labels(success ? 'success' : 'failure').inc();
}

export function recordRegistration(): void {
  registrations.inc();
}

export function setActiveUsers(count: number): void {
  activeUsers.set(count);
}
