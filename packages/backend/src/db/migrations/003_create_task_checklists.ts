import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create checklist_templates table
  await knex.schema.createTable('checklist_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.string('task_type', 100).nullable(); // Associated task type
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('task_type');
  });

  // Create checklist_template_items table
  await knex.schema.createTable('checklist_template_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('template_id')
      .notNullable()
      .references('id')
      .inTable('checklist_templates')
      .onDelete('CASCADE');
    table.text('description').notNullable();
    table.boolean('is_required').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    table.index('template_id');
  });

  // Create schedule_checklists table (links schedules to templates)
  await knex.schema.createTable('schedule_checklists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('schedule_id')
      .notNullable()
      .references('id')
      .inTable('schedules')
      .onDelete('CASCADE');
    table
      .uuid('template_id')
      .notNullable()
      .references('id')
      .inTable('checklist_templates')
      .onDelete('CASCADE');
    table.timestamps(true, true);
    table.index('schedule_id');
    table.index('template_id');
    // Prevent duplicate template assignments
    table.unique(['schedule_id', 'template_id']);
  });

  // Create checklist_item_completions table (tracks completion of items)
  await knex.schema.createTable('checklist_item_completions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('schedule_checklist_id')
      .notNullable()
      .references('id')
      .inTable('schedule_checklists')
      .onDelete('CASCADE');
    table
      .uuid('template_item_id')
      .notNullable()
      .references('id')
      .inTable('checklist_template_items')
      .onDelete('CASCADE');
    table.boolean('completed').defaultTo(false);
    table.uuid('completed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('completed_at').nullable();
    table.text('notes').nullable();
    table.text('photo_url').nullable(); // For verification photos
    table.timestamps(true, true);
    table.index('schedule_checklist_id');
    table.index('template_item_id');
    // Prevent duplicate completions
    table.unique(['schedule_checklist_id', 'template_item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('checklist_item_completions');
  await knex.schema.dropTableIfExists('schedule_checklists');
  await knex.schema.dropTableIfExists('checklist_template_items');
  await knex.schema.dropTableIfExists('checklist_templates');
}
