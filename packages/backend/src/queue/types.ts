// Job Queue Types

import { Job } from 'bullmq';

/**
 * Notification job data
 */
export interface NotificationJobData {
  type: 'schedule_reminder' | 'certification_expiry' | 'time_entry_reminder';
  recipientId: number;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Data cleanup job data
 */
export interface DataCleanupJobData {
  type: 'archive_old_entries' | 'cleanup_sessions' | 'aggregate_stats';
  olderThanDays?: number;
  dryRun?: boolean;
}

/**
 * Export job data
 */
export interface ExportJobData {
  type: 'workers' | 'time_entries' | 'schedules' | 'payroll';
  farmId: number;
  userId: number;
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: Record<string, unknown>;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Email job data
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

/**
 * Union type of all job data types
 */
export type JobData =
  | NotificationJobData
  | DataCleanupJobData
  | ExportJobData
  | EmailJobData;

/**
 * Type-safe job type
 */
export type TypedJob<T extends JobData = JobData> = Job<T>;

/**
 * Job result types
 */
export interface JobResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * Job processor function type
 */
export type JobProcessor<T extends JobData = JobData> = (
  job: TypedJob<T>
) => Promise<JobResult>;
