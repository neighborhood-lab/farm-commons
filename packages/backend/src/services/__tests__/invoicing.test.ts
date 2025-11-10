// Invoice Service Tests

import { describe, it, expect } from 'vitest';
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  validateInvoiceData,
  generateInvoicePDF,
} from '../invoicing.js';
import type { InvoiceWithItems } from '@farm-commons/shared';

describe('Invoice Service', () => {
  describe('generateInvoiceNumber', () => {
    it('should generate first invoice number for the day', () => {
      const invoiceNumber = generateInvoiceNumber();
      expect(invoiceNumber).toMatch(/^INV-\d{8}-0001$/);
    });

    it('should increment sequence number for same day', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      const lastNumber = `INV-${dateStr}-0005`;
      const nextNumber = generateInvoiceNumber(lastNumber);

      expect(nextNumber).toBe(`INV-${dateStr}-0006`);
    });

    it('should reset sequence for new day', () => {
      const lastNumber = 'INV-20240101-0099';
      const nextNumber = generateInvoiceNumber(lastNumber);

      expect(nextNumber).toMatch(/^INV-\d{8}-0001$/);
      expect(nextNumber).not.toContain('20240101');
    });

    it('should handle sequence rollover correctly', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      const lastNumber = `INV-${dateStr}-9999`;
      const nextNumber = generateInvoiceNumber(lastNumber);

      expect(nextNumber).toBe(`INV-${dateStr}-10000`);
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { quantity: 8, rate: 15 },
        { quantity: 6, rate: 20 },
        { quantity: 10, rate: 18 },
      ];

      const result = calculateInvoiceTotals(items, 0);

      expect(result.subtotal).toBe(420); // 120 + 120 + 180
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(420);
    });

    it('should calculate tax correctly', () => {
      const items = [{ quantity: 10, rate: 20 }];

      const result = calculateInvoiceTotals(items, 10);

      expect(result.subtotal).toBe(200);
      expect(result.taxAmount).toBe(20);
      expect(result.total).toBe(220);
    });

    it('should handle decimal values correctly', () => {
      const items = [
        { quantity: 8.5, rate: 15.75 },
        { quantity: 4.25, rate: 22.5 },
      ];

      const result = calculateInvoiceTotals(items, 8.5);

      expect(result.subtotal).toBe(229.5);
      expect(result.taxAmount).toBe(19.51);
      expect(result.total).toBe(249.01);
    });

    it('should handle empty items array', () => {
      const result = calculateInvoiceTotals([], 10);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const items = [{ quantity: 1, rate: 10.999 }];

      const result = calculateInvoiceTotals(items, 0);

      expect(result.subtotal).toBe(11);
    });
  });

  describe('validateInvoiceData', () => {
    it('should validate correct invoice data', () => {
      const data = {
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        invoice_date: new Date('2024-01-16'),
        due_date: new Date('2024-02-01'),
      };

      const result = validateInvoiceData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject period_end before period_start', () => {
      const data = {
        period_start: new Date('2024-01-15'),
        period_end: new Date('2024-01-01'),
        invoice_date: new Date('2024-01-16'),
        due_date: new Date('2024-02-01'),
      };

      const result = validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Period end date must be after start date');
    });

    it('should reject due_date before invoice_date', () => {
      const data = {
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        invoice_date: new Date('2024-02-01'),
        due_date: new Date('2024-01-16'),
      };

      const result = validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Due date must be on or after invoice date');
    });

    it('should reject invoice_date too far in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 31);

      const data = {
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        invoice_date: futureDate,
        due_date: new Date(futureDate.getTime() + 86400000), // +1 day
      };

      const result = validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invoice date cannot be more than 30 days in the future');
    });

    it('should accumulate multiple errors', () => {
      const data = {
        period_start: new Date('2024-01-15'),
        period_end: new Date('2024-01-01'),
        invoice_date: new Date('2024-02-01'),
        due_date: new Date('2024-01-16'),
      };

      const result = validateInvoiceData(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateInvoicePDF', () => {
    it('should generate PDF buffer', async () => {
      const invoice: InvoiceWithItems = {
        id: '123',
        farm_id: '456',
        invoice_number: 'INV-20240115-0001',
        invoice_date: new Date('2024-01-15'),
        due_date: new Date('2024-02-01'),
        client_name: 'Test Client',
        client_address: '123 Farm Road, Rural City, ST 12345',
        client_email: 'client@example.com',
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        subtotal: 420,
        tax_rate: 8.5,
        tax_amount: 35.7,
        total_amount: 455.7,
        status: 'sent',
        paid_date: null,
        notes: 'Thank you for your business!',
        created_at: new Date(),
        updated_at: new Date(),
        items: [
          {
            id: '1',
            invoice_id: '123',
            time_entry_id: null,
            worker_id: null,
            description: 'Labor - Field work',
            quantity: 8,
            rate: 15,
            amount: 120,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: '2',
            invoice_id: '123',
            time_entry_id: null,
            worker_id: null,
            description: 'Labor - Equipment operation',
            quantity: 10,
            rate: 20,
            amount: 200,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: '3',
            invoice_id: '123',
            time_entry_id: null,
            worker_id: null,
            description: 'Labor - Harvesting',
            quantity: 5,
            rate: 20,
            amount: 100,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      const buffer = await generateInvoicePDF({
        invoice,
        farmName: 'Test Farm',
        farmAddress: '456 Farm Lane, Rural City, ST 12345',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify PDF signature
      const pdfSignature = buffer.toString('ascii', 0, 4);
      expect(pdfSignature).toBe('%PDF');
    });

    it('should handle invoice without optional fields', async () => {
      const invoice: InvoiceWithItems = {
        id: '123',
        farm_id: '456',
        invoice_number: 'INV-20240115-0002',
        invoice_date: new Date('2024-01-15'),
        due_date: new Date('2024-02-01'),
        client_name: 'Simple Client',
        client_address: null,
        client_email: null,
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        subtotal: 100,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: 100,
        status: 'draft',
        paid_date: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        items: [
          {
            id: '1',
            invoice_id: '123',
            time_entry_id: null,
            worker_id: null,
            description: 'Basic labor',
            quantity: 5,
            rate: 20,
            amount: 100,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      const buffer = await generateInvoicePDF({
        invoice,
        farmName: 'Test Farm',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle multiple pages for many items', async () => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        id: String(i + 1),
        invoice_id: '123',
        time_entry_id: null,
        worker_id: null,
        description: `Labor item ${i + 1} - Various farm work`,
        quantity: 8,
        rate: 15,
        amount: 120,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const invoice: InvoiceWithItems = {
        id: '123',
        farm_id: '456',
        invoice_number: 'INV-20240115-0003',
        invoice_date: new Date('2024-01-15'),
        due_date: new Date('2024-02-01'),
        client_name: 'Large Client',
        client_address: '789 Farm Road',
        client_email: 'large@example.com',
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-15'),
        subtotal: 3600,
        tax_rate: 10,
        tax_amount: 360,
        total_amount: 3960,
        status: 'sent',
        paid_date: null,
        notes: 'Large invoice with many items',
        created_at: new Date(),
        updated_at: new Date(),
        items,
      };

      const buffer = await generateInvoicePDF({
        invoice,
        farmName: 'Test Farm',
        farmAddress: 'Test Address',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
