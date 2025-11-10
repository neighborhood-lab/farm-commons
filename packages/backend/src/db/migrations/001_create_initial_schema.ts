import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create farms table
  await knex.schema.createTable('farms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('location').notNullable();
    table.decimal('size_acres', 10, 2).notNullable();
    table.boolean('organic_certified').defaultTo(false);
    table.timestamps(true, true);
  });

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.text('password_hash').notNullable();
    table.enum('role', ['admin', 'manager', 'worker']).notNullable();
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.timestamps(true, true);
    table.index('farm_id');
  });

  // Create workers table
  await knex.schema.createTable('workers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).nullable();
    table.string('phone', 20).notNullable();
    table.string('preferred_language', 10).defaultTo('en');
    table.string('emergency_contact_name', 200).nullable();
    table.string('emergency_contact_phone', 20).nullable();
    table.date('hire_date').notNullable();
    table.enum('status', ['active', 'inactive', 'seasonal']).defaultTo('active');
    table.decimal('hourly_rate', 10, 2).nullable();
    table.decimal('piece_rate', 10, 2).nullable();
    table.specificType('certifications', 'text[]').defaultTo('{}');
    table.specificType('skills', 'text[]').defaultTo('{}');
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('status');
  });

  // Create fields table
  await knex.schema.createTable('fields', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.decimal('size_acres', 10, 2).notNullable();
    table.jsonb('location_gps').nullable();
    table.string('current_crop', 100).nullable();
    table.string('soil_type', 100).nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
  });

  // Create schedules table
  await knex.schema.createTable('schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.uuid('field_id').nullable().references('id').inTable('fields').onDelete('SET NULL');
    table.date('scheduled_date').notNullable();
    table.string('start_time', 5).notNullable();
    table.string('end_time', 5).notNullable();
    table.string('task_type', 100).notNullable();
    table.text('task_description').nullable();
    table.enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled');
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('worker_id');
    table.index('scheduled_date');
    table.index('status');
  });

  // Create time_entries table
  await knex.schema.createTable('time_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.uuid('schedule_id').nullable().references('id').inTable('schedules').onDelete('SET NULL');
    table.timestamp('clock_in').notNullable();
    table.timestamp('clock_out').nullable();
    table.integer('break_minutes').defaultTo(0);
    table.decimal('total_hours', 10, 2).nullable();
    table.string('task_type', 100).notNullable();
    table.uuid('field_id').nullable().references('id').inTable('fields').onDelete('SET NULL');
    table.text('notes').nullable();
    table.uuid('verified_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('verified_at').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('worker_id');
    table.index('clock_in');
  });

  // Create certifications table
  await knex.schema.createTable('certifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('issuing_organization', 200).notNullable();
    table.date('issue_date').notNullable();
    table.date('expiration_date').nullable();
    table.text('document_url').nullable();
    table.boolean('verified').defaultTo(false);
    table.timestamps(true, true);
    table.index('worker_id');
    table.index('expiration_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('certifications');
  await knex.schema.dropTableIfExists('time_entries');
  await knex.schema.dropTableIfExists('schedules');
  await knex.schema.dropTableIfExists('fields');
  await knex.schema.dropTableIfExists('workers');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('farms');
}
