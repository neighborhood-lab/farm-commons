// Payroll Service
// Calculate payroll and generate reports

import { Knex } from 'knex';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import db from '../db/connection.js';

export interface PayPeriod {
  start_date: Date;
  end_date: Date;
}

export interface WorkerPayrollEntry {
  worker_id: string;
  worker_name: string;
  hourly_rate: number | null;
  piece_rate: number | null;
  time_entries: TimeEntryDetail[];
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  piece_rate_pay: number;
  total_pay: number;
  total_hours: number;
}

export interface TimeEntryDetail {
  id: string;
  clock_in: Date;
  clock_out: Date;
  total_hours: number;
  task_type: string;
  field_name: string | null;
  verified: boolean;
}

export interface PayrollReport {
  farm_id: string;
  farm_name: string;
  pay_period: PayPeriod;
  generated_at: Date;
  worker_entries: WorkerPayrollEntry[];
  total_regular_hours: number;
  total_overtime_hours: number;
  total_payroll: number;
  total_workers: number;
}

/**
 * Calculate payroll for a given pay period
 * @param farmId - Farm ID
 * @param payPeriod - Pay period with start and end dates
 * @returns Payroll report with calculations
 */
export async function calculatePayroll(
  farmId: string,
  payPeriod: PayPeriod
): Promise<PayrollReport> {
  // Get farm details
  const farm = await db('farms')
    .where({ id: farmId })
    .first();

  if (!farm) {
    throw new Error('Farm not found');
  }

  // Get all workers for the farm
  const workers = await db('workers')
    .where({ farm_id: farmId, status: 'active' })
    .select('*');

  // Get all time entries for the pay period
  const timeEntries = await db('time_entries')
    .where({ farm_id: farmId })
    .whereBetween('clock_in', [payPeriod.start_date, payPeriod.end_date])
    .whereNotNull('clock_out')
    .leftJoin('fields', 'time_entries.field_id', 'fields.id')
    .select(
      'time_entries.*',
      'fields.name as field_name'
    )
    .orderBy('time_entries.clock_in', 'asc');

  // Group time entries by worker
  const entriesByWorker = new Map<string, any[]>();
  for (const entry of timeEntries) {
    if (!entriesByWorker.has(entry.worker_id)) {
      entriesByWorker.set(entry.worker_id, []);
    }
    entriesByWorker.get(entry.worker_id)!.push(entry);
  }

  // Calculate payroll for each worker
  const workerEntries: WorkerPayrollEntry[] = [];

  for (const worker of workers) {
    const entries = entriesByWorker.get(worker.id) || [];

    const payrollEntry = calculateWorkerPayroll(
      worker,
      entries,
      payPeriod
    );

    workerEntries.push(payrollEntry);
  }

  // Calculate totals
  const totalRegularHours = workerEntries.reduce((sum, entry) => sum + entry.regular_hours, 0);
  const totalOvertimeHours = workerEntries.reduce((sum, entry) => sum + entry.overtime_hours, 0);
  const totalPayroll = workerEntries.reduce((sum, entry) => sum + entry.total_pay, 0);

  return {
    farm_id: farmId,
    farm_name: farm.name,
    pay_period: payPeriod,
    generated_at: new Date(),
    worker_entries: workerEntries,
    total_regular_hours: parseFloat(totalRegularHours.toFixed(2)),
    total_overtime_hours: parseFloat(totalOvertimeHours.toFixed(2)),
    total_payroll: parseFloat(totalPayroll.toFixed(2)),
    total_workers: workerEntries.length,
  };
}

/**
 * Calculate payroll for a single worker
 * @param worker - Worker record
 * @param timeEntries - Worker's time entries
 * @param payPeriod - Pay period
 * @returns Worker payroll entry
 */
function calculateWorkerPayroll(
  worker: any,
  timeEntries: any[],
  payPeriod: PayPeriod
): WorkerPayrollEntry {
  const workerName = `${worker.first_name} ${worker.last_name}`;

  // Process time entries
  const entryDetails: TimeEntryDetail[] = timeEntries.map(entry => ({
    id: entry.id,
    clock_in: entry.clock_in,
    clock_out: entry.clock_out,
    total_hours: parseFloat(entry.total_hours),
    task_type: entry.task_type,
    field_name: entry.field_name,
    verified: entry.verified_at !== null,
  }));

  // Calculate total hours
  const totalHours = entryDetails.reduce((sum, entry) => sum + entry.total_hours, 0);

  // Initialize pay calculations
  let regularHours = 0;
  let overtimeHours = 0;
  let regularPay = 0;
  let overtimePay = 0;
  let pieceRatePay = 0;

  // Handle hourly workers with overtime
  if (worker.hourly_rate) {
    // Split hours by week to calculate overtime correctly
    const weeklyHours = calculateWeeklyHours(entryDetails, payPeriod);

    for (const weekHours of Array.from(weeklyHours.values())) {
      if (weekHours <= 40) {
        regularHours += weekHours;
      } else {
        regularHours += 40;
        overtimeHours += (weekHours - 40);
      }
    }

    regularPay = regularHours * worker.hourly_rate;
    overtimePay = overtimeHours * worker.hourly_rate * 1.5; // Overtime is 1.5x
  }

  // Handle piece rate workers
  if (worker.piece_rate && !worker.hourly_rate) {
    // For piece rate, we calculate based on total hours
    // In a real system, you'd track pieces completed
    // For now, we'll use total hours as a proxy
    pieceRatePay = totalHours * worker.piece_rate;
    regularHours = totalHours;
  }

  const totalPay = regularPay + overtimePay + pieceRatePay;

  return {
    worker_id: worker.id,
    worker_name: workerName,
    hourly_rate: worker.hourly_rate,
    piece_rate: worker.piece_rate,
    time_entries: entryDetails,
    regular_hours: parseFloat(regularHours.toFixed(2)),
    overtime_hours: parseFloat(overtimeHours.toFixed(2)),
    regular_pay: parseFloat(regularPay.toFixed(2)),
    overtime_pay: parseFloat(overtimePay.toFixed(2)),
    piece_rate_pay: parseFloat(pieceRatePay.toFixed(2)),
    total_pay: parseFloat(totalPay.toFixed(2)),
    total_hours: parseFloat(totalHours.toFixed(2)),
  };
}

/**
 * Calculate hours worked per week for overtime calculation
 * @param entries - Time entries
 * @param payPeriod - Pay period
 * @returns Map of week start dates to total hours
 */
function calculateWeeklyHours(
  entries: TimeEntryDetail[],
  payPeriod: PayPeriod
): Map<string, number> {
  const weeklyHours = new Map<string, number>();

  for (const entry of entries) {
    const weekStart = startOfWeek(entry.clock_in, { weekStartsOn: 0 }); // Sunday
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    const currentHours = weeklyHours.get(weekKey) || 0;
    weeklyHours.set(weekKey, currentHours + entry.total_hours);
  }

  return weeklyHours;
}

/**
 * Get current pay period (weekly, Sunday to Saturday)
 * @param date - Reference date
 * @returns Pay period
 */
export function getCurrentPayPeriod(date: Date = new Date()): PayPeriod {
  return {
    start_date: startOfWeek(date, { weekStartsOn: 0 }),
    end_date: endOfWeek(date, { weekStartsOn: 0 }),
  };
}

/**
 * Get previous pay period
 * @param date - Reference date
 * @returns Pay period
 */
export function getPreviousPayPeriod(date: Date = new Date()): PayPeriod {
  const prevWeek = new Date(date);
  prevWeek.setDate(prevWeek.getDate() - 7);
  return getCurrentPayPeriod(prevWeek);
}

/**
 * Get custom pay period
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Pay period
 */
export function getCustomPayPeriod(startDate: Date, endDate: Date): PayPeriod {
  return {
    start_date: startDate,
    end_date: endDate,
  };
}

/**
 * Format payroll report as simple text
 * @param report - Payroll report
 * @returns Formatted text report
 */
export function formatPayrollAsText(report: PayrollReport): string {
  let output = '';

  output += `==========================================================\n`;
  output += `PAYROLL REPORT - ${report.farm_name}\n`;
  output += `==========================================================\n`;
  output += `Pay Period: ${format(report.pay_period.start_date, 'MMM dd, yyyy')} - ${format(report.pay_period.end_date, 'MMM dd, yyyy')}\n`;
  output += `Generated: ${format(report.generated_at, 'MMM dd, yyyy HH:mm')}\n`;
  output += `==========================================================\n\n`;

  for (const entry of report.worker_entries) {
    if (entry.total_hours === 0) continue; // Skip workers with no hours

    output += `Worker: ${entry.worker_name}\n`;
    output += `  Total Hours: ${entry.total_hours.toFixed(2)}\n`;

    if (entry.hourly_rate) {
      output += `  Hourly Rate: $${entry.hourly_rate.toFixed(2)}\n`;
      output += `  Regular Hours: ${entry.regular_hours.toFixed(2)} x $${entry.hourly_rate.toFixed(2)} = $${entry.regular_pay.toFixed(2)}\n`;

      if (entry.overtime_hours > 0) {
        output += `  Overtime Hours: ${entry.overtime_hours.toFixed(2)} x $${(entry.hourly_rate * 1.5).toFixed(2)} = $${entry.overtime_pay.toFixed(2)}\n`;
      }
    }

    if (entry.piece_rate && !entry.hourly_rate) {
      output += `  Piece Rate: $${entry.piece_rate.toFixed(2)}/unit\n`;
      output += `  Piece Rate Pay: $${entry.piece_rate_pay.toFixed(2)}\n`;
    }

    output += `  TOTAL PAY: $${entry.total_pay.toFixed(2)}\n`;
    output += `  Time Entries: ${entry.time_entries.length}\n`;

    const unverifiedCount = entry.time_entries.filter(e => !e.verified).length;
    if (unverifiedCount > 0) {
      output += `  ⚠️  ${unverifiedCount} unverified time entries\n`;
    }

    output += `\n`;
  }

  output += `==========================================================\n`;
  output += `SUMMARY\n`;
  output += `==========================================================\n`;
  output += `Total Workers: ${report.total_workers}\n`;
  output += `Total Regular Hours: ${report.total_regular_hours.toFixed(2)}\n`;
  output += `Total Overtime Hours: ${report.total_overtime_hours.toFixed(2)}\n`;
  output += `TOTAL PAYROLL: $${report.total_payroll.toFixed(2)}\n`;
  output += `==========================================================\n`;

  return output;
}

/**
 * Generate PDF payroll report
 * @param report - Payroll report
 * @returns PDF document stream
 */
export function generatePayrollPDF(report: PayrollReport): PassThrough {
  const doc = new PDFDocument({ margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Header
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .text('PAYROLL REPORT', { align: 'center' });

  doc.moveDown();

  // Farm and date info
  doc.fontSize(12)
    .font('Helvetica')
    .text(`Farm: ${report.farm_name}`, { align: 'center' });

  doc.fontSize(10)
    .text(`Pay Period: ${format(report.pay_period.start_date, 'MMM dd, yyyy')} - ${format(report.pay_period.end_date, 'MMM dd, yyyy')}`, { align: 'center' })
    .text(`Generated: ${format(report.generated_at, 'MMM dd, yyyy HH:mm')}`, { align: 'center' });

  doc.moveDown(2);

  // Worker entries
  for (const entry of report.worker_entries) {
    // Skip workers with no hours
    if (entry.total_hours === 0) continue;

    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    // Worker header
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text(entry.worker_name);

    doc.moveDown(0.5);

    // Worker details
    doc.fontSize(10)
      .font('Helvetica')
      .text(`Total Hours: ${entry.total_hours.toFixed(2)}`, { indent: 20 });

    if (entry.hourly_rate) {
      doc.text(`Hourly Rate: $${entry.hourly_rate.toFixed(2)}`, { indent: 20 })
        .text(`Regular Hours: ${entry.regular_hours.toFixed(2)} × $${entry.hourly_rate.toFixed(2)} = $${entry.regular_pay.toFixed(2)}`, { indent: 20 });

      if (entry.overtime_hours > 0) {
        doc.text(`Overtime Hours: ${entry.overtime_hours.toFixed(2)} × $${(entry.hourly_rate * 1.5).toFixed(2)} = $${entry.overtime_pay.toFixed(2)}`, { indent: 20 });
      }
    }

    if (entry.piece_rate && !entry.hourly_rate) {
      doc.text(`Piece Rate: $${entry.piece_rate.toFixed(2)}/unit`, { indent: 20 })
        .text(`Piece Rate Pay: $${entry.piece_rate_pay.toFixed(2)}`, { indent: 20 });
    }

    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total Pay: $${entry.total_pay.toFixed(2)}`, { indent: 20 });

    doc.fontSize(9)
      .font('Helvetica')
      .text(`Time Entries: ${entry.time_entries.length}`, { indent: 20 });

    const unverifiedCount = entry.time_entries.filter(e => !e.verified).length;
    if (unverifiedCount > 0) {
      doc.fillColor('red')
        .text(`⚠ ${unverifiedCount} unverified time entries`, { indent: 20 })
        .fillColor('black');
    }

    // Draw line separator
    doc.moveDown(0.5);
    doc.moveTo(70, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown();
  }

  // Summary section
  doc.moveDown();
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text('SUMMARY', { align: 'center' });

  doc.moveDown();

  // Summary table
  const summaryX = 150;
  doc.fontSize(11)
    .font('Helvetica')
    .text('Total Workers:', summaryX, doc.y, { continued: true })
    .text(report.total_workers.toString(), 400, doc.y, { align: 'right' });

  doc.text('Total Regular Hours:', summaryX, doc.y + 20, { continued: true })
    .text(report.total_regular_hours.toFixed(2), 400, doc.y + 20, { align: 'right' });

  doc.text('Total Overtime Hours:', summaryX, doc.y + 40, { continued: true })
    .text(report.total_overtime_hours.toFixed(2), 400, doc.y + 40, { align: 'right' });

  doc.moveDown(3);

  // Total payroll - highlighted
  const totalY = doc.y;
  doc.rect(summaryX - 10, totalY - 5, 320, 30)
    .fillAndStroke('#f0f0f0', '#000000');

  doc.fillColor('black')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('TOTAL PAYROLL:', summaryX, totalY + 5, { continued: true })
    .text(`$${report.total_payroll.toFixed(2)}`, 400, totalY + 5, { align: 'right' });

  // Footer
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('gray')
    .text(
      'This is a confidential document. Please handle with care.',
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

  doc.end();

  return stream;
}
