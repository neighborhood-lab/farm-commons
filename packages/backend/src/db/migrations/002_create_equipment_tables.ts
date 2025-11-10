import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create equipment table
  await knex.schema.createTable('equipment', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('type', 100).notNullable(); // tractor, harvester, tool, vehicle, etc.
    table.string('model', 200).nullable();
    table.string('serial_number', 100).nullable();
    table.date('purchase_date').nullable();
    table.enum('status', ['available', 'in_use', 'maintenance', 'retired']).defaultTo('available');
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('status');
  });

  // Create equipment_assignments table
  await knex.schema.createTable('equipment_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('equipment_id').notNullable().references('id').inTable('equipment').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.timestamp('assigned_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('returned_at').nullable();
    table.uuid('assigned_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('returned_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('assignment_notes').nullable();
    table.text('return_notes').nullable();
    table.enum('condition_on_return', ['excellent', 'good', 'fair', 'poor', 'damaged']).nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('equipment_id');
    table.index('worker_id');
    table.index('assigned_at');
    table.index('returned_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('equipment_assignments');
  await knex.schema.dropTableIfExists('equipment');
}
