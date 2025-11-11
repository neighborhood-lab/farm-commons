// Farm Commons SDK - Main Entry Point
export { FarmCommonsSDK } from './client/sdk.js';
export { FarmCommonsClient } from './client/base.js';

// Export resources
export { AuthResource } from './resources/auth.js';
export { WorkersResource } from './resources/workers.js';
export { SchedulesResource } from './resources/schedules.js';
export { TimeEntriesResource } from './resources/timeEntries.js';

// Export types
export type {
  SDKConfig,
  RequestOptions,
  SDKError,
  PaginationParams,
  DateRangeParams,
} from './types/index.js';

export type {
  LoginResponse,
  RegisterData,
} from './resources/auth.js';

export type {
  CreateWorkerData,
  UpdateWorkerData,
} from './resources/workers.js';

export type {
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleWithDetails,
} from './resources/schedules.js';

export type {
  ClockInData,
  ClockOutData,
  TimeEntryWithDetails,
} from './resources/timeEntries.js';

// Re-export shared types
export type {
  Worker,
  Schedule,
  TimeEntry,
  Field,
  Certification,
  User,
  Farm,
  AuthUser,
  ApiResponse,
  PaginatedResponse,
  UserRole,
  WorkerStatus,
  ScheduleStatus,
} from './types/index.js';
