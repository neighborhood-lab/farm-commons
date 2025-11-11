import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create H-2A visas table
  await knex.schema.createTable('h2a_visas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.string('visa_number', 100).notNullable().unique();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['active', 'expired', 'cancelled']).defaultTo('active');
    table.string('petition_number', 100).notNullable();
    table.string('job_title', 200).notNullable();
    table.text('job_description').nullable();
    table.text('document_url').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('worker_id');
    table.index('end_date');
    table.index('status');
  });

  // Create H-2A housing assignments table
  await knex.schema.createTable('h2a_housing', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('h2a_visa_id').notNullable().references('id').inTable('h2a_visas').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.string('housing_type', 50).notNullable(); // employer_provided, worker_arranged, etc.
    table.text('address').notNullable();
    table.jsonb('location_gps').nullable();
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.decimal('monthly_cost', 10, 2).nullable();
    table.decimal('worker_contribution', 10, 2).nullable();
    table.integer('occupants_count').notNullable().defaultTo(1);
    table.text('amenities').nullable(); // kitchen, bathroom, beds, etc.
    table.date('last_inspection_date').nullable();
    table.boolean('inspection_passed').nullable();
    table.text('inspection_notes').nullable();
    table.text('document_url').nullable(); // housing agreement document
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('h2a_visa_id');
    table.index('worker_id');
    table.index('start_date');
  });

  // Create H-2A transportation records table
  await knex.schema.createTable('h2a_transportation', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('h2a_visa_id').notNullable().references('id').inTable('h2a_visas').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.enum('transport_type', ['inbound', 'outbound', 'daily_commute', 'emergency']).notNullable();
    table.date('transport_date').notNullable();
    table.string('origin', 200).notNullable();
    table.string('destination', 200).notNullable();
    table.enum('method', ['bus', 'van', 'car', 'plane', 'other']).notNullable();
    table.decimal('cost', 10, 2).notNullable();
    table.boolean('employer_paid').defaultTo(true);
    table.decimal('worker_reimbursement', 10, 2).nullable();
    table.date('reimbursement_date').nullable();
    table.text('receipt_url').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('h2a_visa_id');
    table.index('worker_id');
    table.index('transport_date');
    table.index('transport_type');
  });

  // Create H-2A compliance checklist table
  await knex.schema.createTable('h2a_compliance_checks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('h2a_visa_id').notNullable().references('id').inTable('h2a_visas').onDelete('CASCADE');
    table.string('requirement', 200).notNullable();
    table.text('description').nullable();
    table.boolean('completed').defaultTo(false);
    table.date('due_date').nullable();
    table.date('completed_date').nullable();
    table.uuid('verified_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('document_url').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('h2a_visa_id');
    table.index('due_date');
    table.index('completed');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('h2a_compliance_checks');
  await knex.schema.dropTableIfExists('h2a_transportation');
  await knex.schema.dropTableIfExists('h2a_housing');
  await knex.schema.dropTableIfExists('h2a_visas');
}
