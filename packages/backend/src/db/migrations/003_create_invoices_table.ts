import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('invoice_number', 50).notNullable().unique();
    table.date('invoice_date').notNullable();
    table.date('due_date').notNullable();
    table.string('client_name', 200).notNullable();
    table.text('client_address').nullable();
    table.string('client_email', 255).nullable();
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('tax_rate', 5, 2).defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable();
    table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
    table.date('paid_date').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('invoice_number');
    table.index('status');
    table.index('invoice_date');
  });

  // Create invoice_items table (for itemized labor charges)
  await knex.schema.createTable('invoice_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    table.uuid('time_entry_id').nullable().references('id').inTable('time_entries').onDelete('SET NULL');
    table.uuid('worker_id').nullable().references('id').inTable('workers').onDelete('SET NULL');
    table.text('description').notNullable();
    table.decimal('quantity', 10, 2).notNullable(); // hours worked
    table.decimal('rate', 10, 2).notNullable(); // hourly rate
    table.decimal('amount', 10, 2).notNullable(); // quantity * rate
    table.timestamps(true, true);
    table.index('invoice_id');
    table.index('time_entry_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
}
