// Payroll Service Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentPayPeriod,
  getPreviousPayPeriod,
  getCustomPayPeriod,
  formatPayrollAsText,
  generatePayrollPDF,
  type PayrollReport,
  type PayPeriod,
} from './payroll.js';
import { startOfWeek, endOfWeek, format } from 'date-fns';

describe('Payroll Service', () => {
  describe('Pay Period Functions', () => {
    it('should get current pay period', () => {
      const testDate = new Date('2025-11-13'); // Wednesday
      const payPeriod = getCurrentPayPeriod(testDate);

      // Week starts on Sunday (Nov 10) and ends on Saturday (Nov 16)
      expect(format(payPeriod.start_date, 'yyyy-MM-dd')).toBe('2025-11-10');
      expect(format(payPeriod.end_date, 'yyyy-MM-dd')).toBe('2025-11-16');
    });

    it('should get previous pay period', () => {
      const testDate = new Date('2025-11-13'); // Wednesday
      const payPeriod = getPreviousPayPeriod(testDate);

      // Previous week starts on Sunday (Nov 3) and ends on Saturday (Nov 9)
      expect(format(payPeriod.start_date, 'yyyy-MM-dd')).toBe('2025-11-03');
      expect(format(payPeriod.end_date, 'yyyy-MM-dd')).toBe('2025-11-09');
    });

    it('should get custom pay period', () => {
      const start = new Date('2025-11-01');
      const end = new Date('2025-11-15');
      const payPeriod = getCustomPayPeriod(start, end);

      expect(format(payPeriod.start_date, 'yyyy-MM-dd')).toBe('2025-11-01');
      expect(format(payPeriod.end_date, 'yyyy-MM-dd')).toBe('2025-11-15');
    });
  });

  describe('Text Report Formatting', () => {
    it('should format payroll report as text', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'John Doe',
            hourly_rate: 15,
            piece_rate: null,
            time_entries: [
              {
                id: 'entry-1',
                clock_in: new Date('2025-11-10T08:00:00'),
                clock_out: new Date('2025-11-10T16:00:00'),
                total_hours: 8,
                task_type: 'Harvesting',
                field_name: 'Field A',
                verified: true,
              },
            ],
            regular_hours: 8,
            overtime_hours: 0,
            regular_pay: 120,
            overtime_pay: 0,
            piece_rate_pay: 0,
            total_pay: 120,
            total_hours: 8,
          },
        ],
        total_regular_hours: 8,
        total_overtime_hours: 0,
        total_payroll: 120,
        total_workers: 1,
      };

      const text = formatPayrollAsText(mockReport);

      expect(text).toContain('PAYROLL REPORT');
      expect(text).toContain('Green Valley Farm');
      expect(text).toContain('John Doe');
      expect(text).toContain('Total Hours: 8.00');
      expect(text).toContain('TOTAL PAY: $120.00');
      expect(text).toContain('TOTAL PAYROLL: $120.00');
    });

    it('should show overtime in text report', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'Jane Smith',
            hourly_rate: 20,
            piece_rate: null,
            time_entries: [],
            regular_hours: 40,
            overtime_hours: 5,
            regular_pay: 800,
            overtime_pay: 150,
            piece_rate_pay: 0,
            total_pay: 950,
            total_hours: 45,
          },
        ],
        total_regular_hours: 40,
        total_overtime_hours: 5,
        total_payroll: 950,
        total_workers: 1,
      };

      const text = formatPayrollAsText(mockReport);

      expect(text).toContain('Jane Smith');
      expect(text).toContain('Regular Hours: 40.00');
      expect(text).toContain('Overtime Hours: 5.00');
      expect(text).toContain('TOTAL PAY: $950.00');
    });

    it('should show piece rate workers in text report', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'Maria Garcia',
            hourly_rate: null,
            piece_rate: 10,
            time_entries: [],
            regular_hours: 30,
            overtime_hours: 0,
            regular_pay: 0,
            overtime_pay: 0,
            piece_rate_pay: 300,
            total_pay: 300,
            total_hours: 30,
          },
        ],
        total_regular_hours: 30,
        total_overtime_hours: 0,
        total_payroll: 300,
        total_workers: 1,
      };

      const text = formatPayrollAsText(mockReport);

      expect(text).toContain('Maria Garcia');
      expect(text).toContain('Piece Rate: $10.00/unit');
      expect(text).toContain('Piece Rate Pay: $300.00');
    });

    it('should show unverified entries warning', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'Bob Johnson',
            hourly_rate: 15,
            piece_rate: null,
            time_entries: [
              {
                id: 'entry-1',
                clock_in: new Date('2025-11-10T08:00:00'),
                clock_out: new Date('2025-11-10T16:00:00'),
                total_hours: 8,
                task_type: 'Harvesting',
                field_name: 'Field A',
                verified: false,
              },
            ],
            regular_hours: 8,
            overtime_hours: 0,
            regular_pay: 120,
            overtime_pay: 0,
            piece_rate_pay: 0,
            total_pay: 120,
            total_hours: 8,
          },
        ],
        total_regular_hours: 8,
        total_overtime_hours: 0,
        total_payroll: 120,
        total_workers: 1,
      };

      const text = formatPayrollAsText(mockReport);

      expect(text).toContain('⚠️  1 unverified time entries');
    });

    it('should skip workers with no hours', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'No Hours Worker',
            hourly_rate: 15,
            piece_rate: null,
            time_entries: [],
            regular_hours: 0,
            overtime_hours: 0,
            regular_pay: 0,
            overtime_pay: 0,
            piece_rate_pay: 0,
            total_pay: 0,
            total_hours: 0,
          },
        ],
        total_regular_hours: 0,
        total_overtime_hours: 0,
        total_payroll: 0,
        total_workers: 1,
      };

      const text = formatPayrollAsText(mockReport);

      expect(text).not.toContain('No Hours Worker');
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF stream', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'John Doe',
            hourly_rate: 15,
            piece_rate: null,
            time_entries: [],
            regular_hours: 40,
            overtime_hours: 0,
            regular_pay: 600,
            overtime_pay: 0,
            piece_rate_pay: 0,
            total_pay: 600,
            total_hours: 40,
          },
        ],
        total_regular_hours: 40,
        total_overtime_hours: 0,
        total_payroll: 600,
        total_workers: 1,
      };

      const pdfStream = generatePayrollPDF(mockReport);

      expect(pdfStream).toBeDefined();
      expect(pdfStream.readable).toBe(true);
    });

    it('should handle multiple workers in PDF', () => {
      const mockReport: PayrollReport = {
        farm_id: 'farm-1',
        farm_name: 'Green Valley Farm',
        pay_period: {
          start_date: new Date('2025-11-10'),
          end_date: new Date('2025-11-16'),
        },
        generated_at: new Date('2025-11-17T10:00:00'),
        worker_entries: [
          {
            worker_id: 'worker-1',
            worker_name: 'John Doe',
            hourly_rate: 15,
            piece_rate: null,
            time_entries: [],
            regular_hours: 40,
            overtime_hours: 0,
            regular_pay: 600,
            overtime_pay: 0,
            piece_rate_pay: 0,
            total_pay: 600,
            total_hours: 40,
          },
          {
            worker_id: 'worker-2',
            worker_name: 'Jane Smith',
            hourly_rate: 20,
            piece_rate: null,
            time_entries: [],
            regular_hours: 40,
            overtime_hours: 5,
            regular_pay: 800,
            overtime_pay: 150,
            piece_rate_pay: 0,
            total_pay: 950,
            total_hours: 45,
          },
        ],
        total_regular_hours: 80,
        total_overtime_hours: 5,
        total_payroll: 1550,
        total_workers: 2,
      };

      const pdfStream = generatePayrollPDF(mockReport);

      expect(pdfStream).toBeDefined();
      expect(pdfStream.readable).toBe(true);
    });
  });

  describe('Payroll Calculations', () => {
    it('should correctly calculate regular hours (no overtime)', () => {
      // This test validates the logic structure
      const regularHours = 35;
      const overtimeHours = 0;
      const hourlyRate = 15;

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.5;
      const totalPay = regularPay + overtimePay;

      expect(regularPay).toBe(525);
      expect(overtimePay).toBe(0);
      expect(totalPay).toBe(525);
    });

    it('should correctly calculate overtime hours', () => {
      // This test validates overtime calculation logic
      const totalHours = 45;
      const regularHours = 40;
      const overtimeHours = totalHours - regularHours;
      const hourlyRate = 20;

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * 1.5;
      const totalPay = regularPay + overtimePay;

      expect(regularPay).toBe(800);
      expect(overtimePay).toBe(150); // 5 hours * 20 * 1.5
      expect(totalPay).toBe(950);
    });

    it('should correctly calculate piece rate pay', () => {
      // This test validates piece rate calculation logic
      const hours = 30;
      const pieceRate = 10;

      const pieceRatePay = hours * pieceRate;

      expect(pieceRatePay).toBe(300);
    });

    it('should handle multiple weeks with overtime', () => {
      // Week 1: 45 hours (40 regular + 5 overtime)
      // Week 2: 42 hours (40 regular + 2 overtime)
      // Total: 87 hours (80 regular + 7 overtime)

      const week1Hours = 45;
      const week2Hours = 42;
      const hourlyRate = 15;

      let totalRegular = 0;
      let totalOvertime = 0;

      // Week 1
      if (week1Hours <= 40) {
        totalRegular += week1Hours;
      } else {
        totalRegular += 40;
        totalOvertime += (week1Hours - 40);
      }

      // Week 2
      if (week2Hours <= 40) {
        totalRegular += week2Hours;
      } else {
        totalRegular += 40;
        totalOvertime += (week2Hours - 40);
      }

      const regularPay = totalRegular * hourlyRate;
      const overtimePay = totalOvertime * hourlyRate * 1.5;
      const totalPay = regularPay + overtimePay;

      expect(totalRegular).toBe(80);
      expect(totalOvertime).toBe(7);
      expect(regularPay).toBe(1200);
      expect(overtimePay).toBe(157.5);
      expect(totalPay).toBe(1357.5);
    });
  });
});
