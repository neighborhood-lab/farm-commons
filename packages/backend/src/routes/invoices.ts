// Invoice management routes

import express, { type Router } from 'express';
import { createInvoiceSchema, updateInvoiceSchema, invoiceItemSchema } from '@farm-commons/shared';
import type { InvoiceWithItems } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  generateInvoicePDF,
  validateInvoiceData,
} from '../services/invoicing.js';

const router: Router = express.Router();

router.use(authenticateToken);

// Get all invoices for farm
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const { status } = req.query;

    let query = db('invoices').where({ farm_id: farmId });

    if (status && typeof status === 'string') {
      query = query.where({ status });
    }

    const invoices = await query.orderBy('invoice_date', 'desc');

    res.json({
      success: true,
      data: invoices,
    });
  } catch {
    next(error);
  }
});

// Get single invoice with items
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Get invoice items with worker details
    const items = await db('invoice_items')
      .where({ invoice_id: id })
      .leftJoin('workers', 'invoice_items.worker_id', 'workers.id')
      .select(
        'invoice_items.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name'
      )
      .orderBy('invoice_items.created_at');

    const invoiceWithItems: InvoiceWithItems = {
      ...invoice,
      items,
    };

    res.json({
      success: true,
      data: invoiceWithItems,
    });
  } catch {
    next(error);
  }
});

// Create new invoice
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Validate invoice data
    const validation = validateInvoiceData({
      period_start: data.period_start,
      period_end: data.period_end,
      invoice_date: data.invoice_date,
      due_date: data.due_date,
    });

    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    // Generate invoice number
    const lastInvoice = await db('invoices')
      .where({ farm_id: farmId })
      .orderBy('created_at', 'desc')
      .first();

    const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoice_number);

    // If time_entry_ids provided, fetch and create items automatically
    let items: Array<{
      description: string;
      quantity: number;
      rate: number;
      time_entry_id?: string;
      worker_id?: string;
    }> = [];

    if (data.time_entry_ids && data.time_entry_ids.length > 0) {
      const timeEntries = await db('time_entries')
        .whereIn('id', data.time_entry_ids)
        .where({ farm_id: farmId })
        .leftJoin('workers', 'time_entries.worker_id', 'workers.id')
        .select(
          'time_entries.*',
          'workers.first_name',
          'workers.last_name',
          'workers.hourly_rate'
        );

      items = timeEntries.map((entry) => ({
        time_entry_id: entry.id,
        worker_id: entry.worker_id,
        description: `${entry.first_name} ${entry.last_name} - ${entry.task_type}`,
        quantity: entry.total_hours || 0,
        rate: entry.hourly_rate || 0,
      }));
    }

    // Calculate totals
    const totals = calculateInvoiceTotals(items, data.tax_rate);

    // Create invoice
    const [invoice] = await db('invoices')
      .insert({
        farm_id: farmId,
        invoice_number: invoiceNumber,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        client_name: data.client_name,
        client_address: data.client_address,
        client_email: data.client_email,
        period_start: data.period_start,
        period_end: data.period_end,
        subtotal: totals.subtotal,
        tax_rate: data.tax_rate,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        status: 'draft',
        notes: data.notes,
      })
      .returning('*');

    // Create invoice items if any
    if (items.length > 0) {
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        time_entry_id: item.time_entry_id || null,
        worker_id: item.worker_id || null,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      }));

      await db('invoice_items').insert(invoiceItems);
    }

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch {
    next(error);
  }
});

// Add items to invoice
router.post('/:id/items', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const itemsData = Array.isArray(req.body) ? req.body : [req.body];

    // Validate invoice exists and belongs to farm
    const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status !== 'draft') {
      throw new AppError('Can only add items to draft invoices', 400);
    }

    // Validate and prepare items
    const validatedItems = itemsData.map((item) => {
      const validated = invoiceItemSchema.parse(item);
      return {
        invoice_id: id,
        time_entry_id: validated.time_entry_id,
        worker_id: validated.worker_id,
        description: validated.description,
        quantity: validated.quantity,
        rate: validated.rate,
        amount: validated.quantity * validated.rate,
      };
    });

    // Insert items
    const insertedItems = await db('invoice_items').insert(validatedItems).returning('*');

    // Recalculate invoice totals
    const allItems = await db('invoice_items').where({ invoice_id: id });
    const totals = calculateInvoiceTotals(allItems, invoice.tax_rate);

    await db('invoices').where({ id }).update({
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      updated_at: new Date(),
    });

    res.status(201).json({
      success: true,
      data: insertedItems,
    });
  } catch {
    next(error);
  }
});

// Update invoice
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateInvoiceSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Don't allow editing paid or cancelled invoices
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      throw new AppError(`Cannot edit ${invoice.status} invoices`, 400);
    }

    // Recalculate totals if tax rate changed
    let updateData: Record<string, unknown> = { ...data, updated_at: new Date() };

    if (data.tax_rate !== undefined && data.tax_rate !== invoice.tax_rate) {
      const items = await db('invoice_items').where({ invoice_id: id });
      const totals = calculateInvoiceTotals(items, data.tax_rate);
      updateData = {
        ...updateData,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
      };
    }

    const [updatedInvoice] = await db('invoices')
      .where({ id, farm_id: farmId })
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      data: updatedInvoice,
    });
  } catch {
    next(error);
  }
});

// Delete invoice item
router.delete(
  '/:id/items/:itemId',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id, itemId } = req.params;
      const farmId = req.user?.farm_id;

      // Verify invoice exists and is a draft
      const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      if (invoice.status !== 'draft') {
        throw new AppError('Can only delete items from draft invoices', 400);
      }

      // Delete item
      const deleted = await db('invoice_items').where({ id: itemId, invoice_id: id }).delete();

      if (deleted === 0) {
        throw new AppError('Invoice item not found', 404);
      }

      // Recalculate totals
      const allItems = await db('invoice_items').where({ invoice_id: id });
      const totals = calculateInvoiceTotals(allItems, invoice.tax_rate);

      await db('invoices').where({ id }).update({
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        updated_at: new Date(),
      });

      res.json({
        success: true,
        message: 'Invoice item deleted',
      });
    } catch {
      next(error);
    }
  }
);

// Generate PDF for invoice
router.get('/:id/pdf', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Get invoice with items
    const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const items = await db('invoice_items').where({ invoice_id: id }).orderBy('created_at');

    const invoiceWithItems: InvoiceWithItems = {
      ...invoice,
      items,
    };

    // Get farm details
    const farm = await db('farms').where({ id: farmId }).first();

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoice: invoiceWithItems,
      farmName: farm?.name || 'Farm',
      farmAddress: farm?.location,
    });

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch {
    next(error);
  }
});

// Delete invoice (draft only)
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const invoice = await db('invoices').where({ id, farm_id: farmId }).first();

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status !== 'draft') {
      throw new AppError('Can only delete draft invoices', 400);
    }

    // Delete invoice (items will be cascade deleted)
    await db('invoices').where({ id, farm_id: farmId }).delete();

    res.json({
      success: true,
      message: 'Invoice deleted',
    });
  } catch {
    next(error);
  }
});

export default router;
