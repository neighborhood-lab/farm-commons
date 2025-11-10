import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create field_notes table
  await knex.schema.createTable('field_notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('field_id').notNullable().references('id').inTable('fields').onDelete('CASCADE');
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.specificType('tags', 'text[]').defaultTo('{}');
    table.specificType('photo_urls', 'text[]').defaultTo('{}');
    table.timestamps(true, true);
    table.index('field_id');
    table.index('farm_id');
    table.index('created_by');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('field_notes');
}
