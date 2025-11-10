import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create emergency_contacts table
  await knex.schema.createTable('emergency_contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('relationship', 100).notNullable();
    table.string('phone', 20).notNullable();
    table.string('phone_secondary', 20).nullable();
    table.string('email', 255).nullable();
    table.text('address').nullable();
    table.boolean('is_primary').defaultTo(false);
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('worker_id');
    table.index(['worker_id', 'is_primary']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('emergency_contacts');
}
