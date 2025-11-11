// Farm Commons Shared Types
// Core type definitions for workers, scheduling, and time tracking

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  farm_id: string;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'manager' | 'worker';

export interface Farm {
  id: string;
  name: string;
  location: string;
  size_acres: number;
  organic_certified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Worker {
  id: string;
  farm_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  preferred_language: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  hire_date: Date;
  status: WorkerStatus;
  hourly_rate: number | null;
  piece_rate: number | null;
  certifications: string[];
  skills: string[];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type WorkerStatus = 'active' | 'inactive' | 'seasonal';

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  size_acres: number;
  location_gps: { lat: number; lng: number } | null;
  current_crop: string | null;
  soil_type: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Schedule {
  id: string;
  farm_id: string;
  worker_id: string;
  field_id: string | null;
  scheduled_date: Date;
  start_time: string;
  end_time: string;
  task_type: string;
  task_description: string | null;
  status: ScheduleStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface TimeEntry {
  id: string;
  farm_id: string;
  worker_id: string;
  schedule_id: string | null;
  clock_in: Date;
  clock_out: Date | null;
  break_minutes: number;
  total_hours: number | null;
  task_type: string;
  field_id: string | null;
  notes: string | null;
  verified_by: string | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Certification {
  id: string;
  worker_id: string;
  name: string;
  issuing_organization: string;
  issue_date: Date;
  expiration_date: Date | null;
  document_url: string | null;
  verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Authentication Types
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  farm_id: string;
}

// Statistics and Analytics Types
export interface WorkerStats {
  worker_id: string;
  total_hours_week: number;
  total_hours_month: number;
  scheduled_shifts_upcoming: number;
  certifications_expiring_soon: number;
}

export interface FarmStats {
  total_workers: number;
  active_workers: number;
  total_fields: number;
  total_hours_this_week: number;
  scheduled_shifts_today: number;
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  farm_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  client_name: string;
  client_address: string | null;
  client_email: string | null;
  period_start: Date;
  period_end: Date;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  paid_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  time_entry_id: string | null;
  worker_id: string | null;
  description: string;
  quantity: number; // hours worked
  rate: number; // hourly rate
  amount: number; // quantity * rate
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}
