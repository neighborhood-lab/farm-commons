import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('time_entries', (table) => {
    table.enum('approval_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at').nullable();
    table.text('rejection_reason').nullable();

    table.index('approval_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('time_entries', (table) => {
    table.dropColumn('approval_status');
    table.dropColumn('approved_by');
    table.dropColumn('approved_at');
    table.dropColumn('rejection_reason');
  });
}
