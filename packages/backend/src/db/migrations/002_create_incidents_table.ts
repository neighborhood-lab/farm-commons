import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create incidents table for OSHA incident reporting
  await knex.schema.createTable('incidents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');

    // Incident details
    table.timestamp('incident_date').notNullable();
    table.string('incident_time', 5).notNullable(); // HH:MM format
    table.text('location').notNullable();
    table.text('description').notNullable();

    // OSHA classification
    table.enum('incident_type', [
      'injury',
      'illness',
      'near_miss',
      'property_damage',
      'environmental'
    ]).notNullable();

    table.enum('severity', [
      'first_aid',
      'medical_treatment',
      'lost_time',
      'restricted_work',
      'fatality'
    ]).notNullable();

    // Injury details (if applicable)
    table.string('body_part_affected', 100).nullable();
    table.string('nature_of_injury', 200).nullable();

    // Medical treatment
    table.boolean('medical_treatment_required').defaultTo(false);
    table.string('treatment_facility', 200).nullable();
    table.text('treatment_description').nullable();

    // Work impact
    table.integer('days_away_from_work').defaultTo(0);
    table.integer('days_of_restricted_work').defaultTo(0);
    table.date('date_returned_to_work').nullable();

    // Investigation
    table.text('root_cause').nullable();
    table.text('corrective_actions').nullable();
    table.uuid('investigated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('investigated_at').nullable();

    // OSHA reporting
    table.boolean('osha_recordable').defaultTo(false);
    table.string('osha_case_number', 50).nullable();
    table.boolean('reported_to_osha').defaultTo(false);
    table.date('reported_to_osha_date').nullable();

    // Additional documentation
    table.specificType('witness_ids', 'uuid[]').defaultTo('{}');
    table.specificType('document_urls', 'text[]').defaultTo('{}');
    table.text('notes').nullable();

    // Status
    table.enum('status', [
      'reported',
      'under_investigation',
      'investigation_complete',
      'closed'
    ]).defaultTo('reported');

    table.timestamps(true, true);

    // Indexes for common queries
    table.index('farm_id');
    table.index('worker_id');
    table.index('incident_date');
    table.index('incident_type');
    table.index('severity');
    table.index('osha_recordable');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('incidents');
}
