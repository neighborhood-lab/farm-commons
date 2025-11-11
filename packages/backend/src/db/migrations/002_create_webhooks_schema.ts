import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create webhooks table for webhook registrations
  await knex.schema.createTable('webhooks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('url', 2048).notNullable();
    table.string('secret_key', 255).notNullable(); // For HMAC signature verification
    table.specificType('events', 'text[]').notNullable(); // Events to subscribe to
    table.boolean('active').defaultTo(true);
    table.text('description').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('active');
  });

  // Create webhook_deliveries table for tracking delivery attempts
  await knex.schema.createTable('webhook_deliveries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('webhook_id').notNullable().references('id').inTable('webhooks').onDelete('CASCADE');
    table.string('event_type', 100).notNullable();
    table.jsonb('payload').notNullable();
    table.enum('status', ['pending', 'success', 'failed']).defaultTo('pending');
    table.integer('attempt_count').defaultTo(0);
    table.integer('response_status').nullable();
    table.text('response_body').nullable();
    table.text('error_message').nullable();
    table.timestamp('next_retry_at').nullable();
    table.timestamp('delivered_at').nullable();
    table.timestamps(true, true);
    table.index('webhook_id');
    table.index('status');
    table.index('next_retry_at');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('webhook_deliveries');
  await knex.schema.dropTableIfExists('webhooks');
}
