import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create skills table
  await knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.string('category', 100).nullable();
    table.timestamps(true, true);
    table.unique(['farm_id', 'name']); // Ensure unique skill names per farm
    table.index('farm_id');
  });

  // Create worker_skills junction table
  await knex.schema.createTable('worker_skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert']).nullable();
    table.integer('years_experience').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.unique(['worker_id', 'skill_id']); // Prevent duplicate skill assignments
    table.index('worker_id');
    table.index('skill_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('worker_skills');
  await knex.schema.dropTableIfExists('skills');
}
