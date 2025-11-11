import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create audit_logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').nullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 50).notNullable(); // create, update, delete, login, logout, access, etc.
    table.string('resource_type', 50).nullable(); // worker, schedule, time_entry, field, etc.
    table.uuid('resource_id').nullable(); // ID of the resource affected
    table.jsonb('changes').nullable(); // Before/after values for updates
    table.string('ip_address', 45).nullable(); // Support IPv4 and IPv6
    table.text('user_agent').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('farm_id');
    table.index('user_id');
    table.index('action');
    table.index('resource_type');
    table.index('resource_id');
    table.index('created_at');
    table.index(['farm_id', 'created_at']); // Composite index for farm-specific queries
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}
