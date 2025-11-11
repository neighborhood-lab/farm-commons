import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create task_templates table
  await knex.schema.createTable('task_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('task_type', 100).notNullable();
    table.text('task_description').nullable();
    table.decimal('default_duration_hours', 5, 2).nullable();
    table.string('default_start_time', 5).nullable();
    table.boolean('field_required').defaultTo(false);
    table.specificType('required_skills', 'text[]').defaultTo('{}');
    table.enum('season', ['spring', 'summer', 'fall', 'winter', 'year_round']).defaultTo('year_round');
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('season');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('task_templates');
}
