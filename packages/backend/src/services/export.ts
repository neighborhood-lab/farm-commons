// Data Export Service
// Provides CSV and Excel export functionality for various data types

import { format } from 'date-fns';
import { format as formatCsv } from 'fast-csv';
import ExcelJS from 'exceljs';
import type { Knex } from 'knex';
import { Readable } from 'stream';

export interface ExportOptions {
  format: 'csv' | 'excel';
  farmId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface WorkerExportData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  preferred_language: string;
  hire_date: Date;
  status: string;
  hourly_rate: number | null;
  piece_rate: number | null;
  certifications: string[];
  skills: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface TimeEntryExportData {
  worker_first_name: string;
  worker_last_name: string;
  worker_id: string;
  clock_in: Date;
  clock_out: Date | null;
  break_minutes: number;
  total_hours: number | null;
  task_type: string;
  field_name: string | null;
  hourly_rate: number | null;
  piece_rate: number | null;
  verified: boolean;
}

export interface ScheduleExportData {
  worker_first_name: string;
  worker_last_name: string;
  scheduled_date: Date;
  start_time: string;
  end_time: string;
  task_type: string;
  task_description: string | null;
  field_name: string | null;
  status: string;
}

export interface ComplianceReportData {
  worker_first_name: string;
  worker_last_name: string;
  worker_id: string;
  week_start: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  days_worked: number;
  has_excessive_hours: boolean;
  missing_breaks: boolean;
}

/**
 * Export workers list to CSV or Excel
 */
export async function exportWorkers(
  db: Knex,
  options: ExportOptions
): Promise<Readable> {
  const workers = await db('workers')
    .where({ farm_id: options.farmId })
    .orderBy('last_name', 'asc')
    .select<WorkerExportData[]>('*');

  const formattedData = workers.map((worker) => ({
    'Worker ID': worker.id,
    'First Name': worker.first_name,
    'Last Name': worker.last_name,
    Email: worker.email || 'N/A',
    Phone: worker.phone,
    'Preferred Language': worker.preferred_language,
    'Hire Date': format(new Date(worker.hire_date), 'yyyy-MM-dd'),
    Status: worker.status,
    'Hourly Rate': worker.hourly_rate ? `$${worker.hourly_rate}` : 'N/A',
    'Piece Rate': worker.piece_rate ? `$${worker.piece_rate}` : 'N/A',
    Certifications: worker.certifications?.join(', ') || 'None',
    Skills: worker.skills?.join(', ') || 'None',
    'Emergency Contact Name': worker.emergency_contact_name || 'N/A',
    'Emergency Contact Phone': worker.emergency_contact_phone || 'N/A',
  }));

  if (options.format === 'csv') {
    return generateCSV(formattedData);
  } else {
    return generateExcel(formattedData, 'Workers');
  }
}

/**
 * Export time entries for payroll to CSV or Excel
 */
export async function exportTimeEntriesForPayroll(
  db: Knex,
  options: ExportOptions
): Promise<Readable> {
  let query = db('time_entries')
    .where({ 'time_entries.farm_id': options.farmId })
    .leftJoin('workers', 'time_entries.worker_id', 'workers.id')
    .leftJoin('fields', 'time_entries.field_id', 'fields.id')
    .select(
      'workers.first_name as worker_first_name',
      'workers.last_name as worker_last_name',
      'workers.id as worker_id',
      'time_entries.clock_in',
      'time_entries.clock_out',
      'time_entries.break_minutes',
      'time_entries.total_hours',
      'time_entries.task_type',
      'fields.name as field_name',
      'workers.hourly_rate',
      'workers.piece_rate',
      db.raw('CASE WHEN time_entries.verified_by IS NOT NULL THEN true ELSE false END as verified')
    );

  if (options.startDate && options.endDate) {
    query = query.whereBetween('time_entries.clock_in', [
      options.startDate,
      options.endDate,
    ]);
  }

  const entries = await query.orderBy('time_entries.clock_in', 'desc');

  const formattedData = entries.map((entry: any) => {
    const earnings = entry.total_hours && entry.hourly_rate
      ? entry.total_hours * parseFloat(entry.hourly_rate)
      : null;

    return {
      'Worker Name': `${entry.worker_first_name} ${entry.worker_last_name}`,
      'Worker ID': entry.worker_id,
      'Clock In': format(new Date(entry.clock_in), 'yyyy-MM-dd HH:mm:ss'),
      'Clock Out': entry.clock_out
        ? format(new Date(entry.clock_out), 'yyyy-MM-dd HH:mm:ss')
        : 'Not clocked out',
      'Break (min)': entry.break_minutes,
      'Total Hours': entry.total_hours ? entry.total_hours.toFixed(2) : 'N/A',
      'Task Type': entry.task_type,
      Field: entry.field_name || 'N/A',
      'Hourly Rate': entry.hourly_rate ? `$${parseFloat(entry.hourly_rate).toFixed(2)}` : 'N/A',
      'Piece Rate': entry.piece_rate ? `$${parseFloat(entry.piece_rate).toFixed(2)}` : 'N/A',
      Earnings: earnings ? `$${earnings.toFixed(2)}` : 'N/A',
      Verified: entry.verified ? 'Yes' : 'No',
    };
  });

  if (options.format === 'csv') {
    return generateCSV(formattedData);
  } else {
    return generateExcel(formattedData, 'Time Entries - Payroll');
  }
}

/**
 * Export schedules for planning to CSV or Excel
 */
export async function exportSchedules(
  db: Knex,
  options: ExportOptions
): Promise<Readable> {
  let query = db('schedules')
    .where({ 'schedules.farm_id': options.farmId })
    .leftJoin('workers', 'schedules.worker_id', 'workers.id')
    .leftJoin('fields', 'schedules.field_id', 'fields.id')
    .select(
      'workers.first_name as worker_first_name',
      'workers.last_name as worker_last_name',
      'schedules.scheduled_date',
      'schedules.start_time',
      'schedules.end_time',
      'schedules.task_type',
      'schedules.task_description',
      'fields.name as field_name',
      'schedules.status'
    );

  if (options.startDate && options.endDate) {
    query = query.whereBetween('schedules.scheduled_date', [
      options.startDate,
      options.endDate,
    ]);
  }

  const schedules = await query.orderBy('schedules.scheduled_date', 'asc');

  const formattedData = schedules.map((schedule: any) => ({
    'Worker Name': `${schedule.worker_first_name} ${schedule.worker_last_name}`,
    Date: format(new Date(schedule.scheduled_date), 'yyyy-MM-dd'),
    'Start Time': schedule.start_time,
    'End Time': schedule.end_time,
    'Task Type': schedule.task_type,
    Description: schedule.task_description || 'N/A',
    Field: schedule.field_name || 'N/A',
    Status: schedule.status,
  }));

  if (options.format === 'csv') {
    return generateCSV(formattedData);
  } else {
    return generateExcel(formattedData, 'Schedules');
  }
}

/**
 * Generate compliance report for labor law monitoring
 */
export async function exportComplianceReport(
  db: Knex,
  options: ExportOptions
): Promise<Readable> {
  // Get date range for report (default to last 30 days if not specified)
  const endDate = options.endDate || new Date();
  const startDate = options.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Query time entries grouped by worker and week
  const timeEntries = await db('time_entries')
    .where({ 'time_entries.farm_id': options.farmId })
    .whereBetween('time_entries.clock_in', [startDate, endDate])
    .whereNotNull('time_entries.clock_out')
    .leftJoin('workers', 'time_entries.worker_id', 'workers.id')
    .select(
      'workers.first_name as worker_first_name',
      'workers.last_name as worker_last_name',
      'workers.id as worker_id',
      'time_entries.clock_in',
      'time_entries.total_hours',
      'time_entries.break_minutes'
    )
    .orderBy('time_entries.clock_in', 'asc');

  // Group by worker and week
  const weeklyData = new Map<string, ComplianceReportData>();

  timeEntries.forEach((entry: any) => {
    const clockIn = new Date(entry.clock_in);
    // Get Monday of the week
    const weekStart = new Date(clockIn);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = `${entry.worker_id}-${format(weekStart, 'yyyy-MM-dd')}`;

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        worker_first_name: entry.worker_first_name,
        worker_last_name: entry.worker_last_name,
        worker_id: entry.worker_id,
        week_start: format(weekStart, 'yyyy-MM-dd'),
        total_hours: 0,
        regular_hours: 0,
        overtime_hours: 0,
        days_worked: 0,
        has_excessive_hours: false,
        missing_breaks: false,
      });
    }

    const weekData = weeklyData.get(weekKey)!;
    const totalHours = parseFloat(entry.total_hours) || 0;
    weekData.total_hours += totalHours;

    // Track days worked (simplified - counts any entry as a day)
    weekData.days_worked += 1;

    // Check for missing breaks (simplified - should have break if working > 6 hours)
    if (totalHours > 6 && entry.break_minutes < 30) {
      weekData.missing_breaks = true;
    }
  });

  // Calculate overtime and flag violations
  const complianceData = Array.from(weeklyData.values()).map((data) => {
    data.regular_hours = Math.min(data.total_hours, 40);
    data.overtime_hours = Math.max(0, data.total_hours - 40);
    data.has_excessive_hours = data.total_hours > 60; // Flag excessive hours

    return {
      'Worker Name': `${data.worker_first_name} ${data.worker_last_name}`,
      'Worker ID': data.worker_id,
      'Week Starting': data.week_start,
      'Total Hours': data.total_hours.toFixed(2),
      'Regular Hours': data.regular_hours.toFixed(2),
      'Overtime Hours': data.overtime_hours.toFixed(2),
      'Days Worked': data.days_worked,
      'Excessive Hours (>60)': data.has_excessive_hours ? 'YES' : 'No',
      'Missing Break Periods': data.missing_breaks ? 'YES' : 'No',
    };
  });

  if (options.format === 'csv') {
    return generateCSV(complianceData);
  } else {
    return generateExcel(complianceData, 'Compliance Report', {
      highlightViolations: true,
    });
  }
}

/**
 * Generate CSV stream from data
 */
function generateCSV(data: any[]): Readable {
  const stream = formatCsv({ headers: true });

  // Write data to stream
  data.forEach((row) => stream.write(row));
  stream.end();

  return stream;
}

/**
 * Generate Excel stream from data
 */
async function generateExcel(
  data: any[],
  sheetName: string,
  options?: { highlightViolations?: boolean }
): Promise<Readable> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    // Add empty sheet with headers message
    worksheet.addRow(['No data available']);
    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Add header row
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => row[header]);
    const dataRow = worksheet.addRow(values);

    // Highlight compliance violations if requested
    if (options?.highlightViolations) {
      // Check for excessive hours or missing breaks
      if (row['Excessive Hours (>60)'] === 'YES' || row['Missing Break Periods'] === 'YES') {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }, // Light red
        };
      }
    }
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Convert to stream
  const buffer = await workbook.xlsx.writeBuffer();
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
