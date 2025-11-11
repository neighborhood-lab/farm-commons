// Invoice Generation Service
// Handles invoice creation and PDF generation

import PDFDocument from 'pdfkit';
import type { InvoiceWithItems } from '@farm-commons/shared';
import { formatCurrency } from '@farm-commons/shared';
import { format } from 'date-fns';

export interface InvoicePDFOptions {
  invoice: InvoiceWithItems;
  farmName: string;
  farmAddress?: string;
}

/**
 * Generate invoice number based on current date and sequence
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(lastInvoiceNumber?: string): string {
  const today = new Date();
  const datePrefix = format(today, 'yyyyMMdd');
  const prefix = `INV-${datePrefix}`;

  if (!lastInvoiceNumber || !lastInvoiceNumber.startsWith(prefix)) {
    return `${prefix}-0001`;
  }

  // Extract sequence number and increment
  const lastSequence = Number.Number.parseInt(lastInvoiceNumber.split('-')[2] || '0', 10);
  const newSequence = (lastSequence + 1).toString().padStart(4, '0');
  return `${prefix}-${newSequence}`;
}

/**
 * Calculate invoice totals from items
 */
export function calculateInvoiceTotals(
  items: Array<{ quantity: number; rate: number }>,
  taxRate: number
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.rate;
  }, 0);

  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Generate PDF invoice document
 * Returns a Buffer containing the PDF
 */
export async function generateInvoicePDF(options: InvoicePDFOptions): Promise<Buffer> {
  const { invoice, farmName, farmAddress } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INVOICE', 50, 50, { align: 'right' });
      doc.fontSize(10).text(invoice.invoice_number, { align: 'right' });
      doc.moveDown();

      // Farm information (From)
      doc.fontSize(12).text('From:', 50, 120);
      doc.fontSize(10).text(farmName, 50, 140);
      if (farmAddress) {
        doc.text(farmAddress, 50, 155);
      }

      // Client information (To)
      doc.fontSize(12).text('To:', 50, 200);
      doc.fontSize(10).text(invoice.client_name, 50, 220);
      if (invoice.client_address) {
        doc.text(invoice.client_address, 50, 235);
      }
      if (invoice.client_email) {
        doc.text(invoice.client_email, 50, 250);
      }

      // Invoice details
      doc.fontSize(10);
      const detailsX = 350;
      doc.text('Invoice Date:', detailsX, 120);
      doc.text(format(new Date(invoice.invoice_date), 'MMM dd, yyyy'), detailsX + 100, 120);

      doc.text('Due Date:', detailsX, 140);
      doc.text(format(new Date(invoice.due_date), 'MMM dd, yyyy'), detailsX + 100, 140);

      doc.text('Period:', detailsX, 160);
      doc.text(
        `${format(new Date(invoice.period_start), 'MMM dd')} - ${format(new Date(invoice.period_end), 'MMM dd, yyyy')}`,
        detailsX + 100,
        160
      );

      // Items table
      const tableTop = 320;
      const tableHeaders = {
        description: 50,
        quantity: 320,
        rate: 400,
        amount: 480,
      };

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', tableHeaders.description, tableTop)
        .text('Hours', tableHeaders.quantity, tableTop)
        .text('Rate', tableHeaders.rate, tableTop)
        .text('Amount', tableHeaders.amount, tableTop);

      // Draw line under header
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      let yPosition = tableTop + 30;
      doc.font('Helvetica');

      for (const item of invoice.items) {
        doc
          .fontSize(9)
          .text(item.description, tableHeaders.description, yPosition, {
            width: 250,
            lineGap: 2,
          })
          .text(item.quantity.toFixed(2), tableHeaders.quantity, yPosition)
          .text(formatCurrency(item.rate), tableHeaders.rate, yPosition)
          .text(formatCurrency(item.amount), tableHeaders.amount, yPosition);

        yPosition += 25;

        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }

      // Totals section
      yPosition += 20;
      const totalsX = 400;

      doc.fontSize(10);
      doc.text('Subtotal:', totalsX, yPosition);
      doc.text(formatCurrency(invoice.subtotal), totalsX + 100, yPosition, { align: 'right' });

      yPosition += 20;
      if (invoice.tax_rate > 0) {
        doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, yPosition);
        doc.text(formatCurrency(invoice.tax_amount), totalsX + 100, yPosition, { align: 'right' });
        yPosition += 20;
      }

      // Draw line before total
      doc
        .strokeColor('#000000')
        .lineWidth(2)
        .moveTo(totalsX, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 10;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', totalsX, yPosition);
      doc.text(formatCurrency(invoice.total_amount), totalsX + 100, yPosition, { align: 'right' });

      // Notes section
      if (invoice.notes) {
        yPosition += 40;
        doc.font('Helvetica').fontSize(10);
        doc.text('Notes:', 50, yPosition);
        doc.fontSize(9).text(invoice.notes, 50, yPosition + 15, {
          width: 500,
          lineGap: 2,
        });
      }

      // Footer
      doc.fontSize(8).text('Thank you for your business!', 50, 750, {
        align: 'center',
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validate invoice data before creation
 */
export function validateInvoiceData(data: {
  period_start: Date;
  period_end: Date;
  invoice_date: Date;
  due_date: Date;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Period validation
  if (data.period_end <= data.period_start) {
    errors.push('Period end date must be after start date');
  }

  // Due date validation
  if (data.due_date < data.invoice_date) {
    errors.push('Due date must be on or after invoice date');
  }

  // Invoice date validation
  const futureLimit = new Date();
  futureLimit.setDate(futureLimit.getDate() + 30);
  if (data.invoice_date > futureLimit) {
    errors.push('Invoice date cannot be more than 30 days in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
