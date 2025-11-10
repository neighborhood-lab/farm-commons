import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create soil_tests table
  await knex.schema.createTable('soil_tests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('field_id').notNullable().references('id').inTable('fields').onDelete('CASCADE');
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.date('test_date').notNullable();
    table.string('lab_name', 200).nullable();
    table.string('test_type', 100).notNullable();

    // Soil properties
    table.decimal('ph_level', 4, 2).nullable();
    table.decimal('organic_matter_percent', 5, 2).nullable();

    // Macronutrients (ppm or lbs/acre)
    table.decimal('nitrogen_ppm', 10, 2).nullable();
    table.decimal('phosphorus_ppm', 10, 2).nullable();
    table.decimal('potassium_ppm', 10, 2).nullable();

    // Secondary nutrients (ppm)
    table.decimal('calcium_ppm', 10, 2).nullable();
    table.decimal('magnesium_ppm', 10, 2).nullable();
    table.decimal('sulfur_ppm', 10, 2).nullable();

    // Micronutrients (ppm)
    table.decimal('iron_ppm', 10, 2).nullable();
    table.decimal('manganese_ppm', 10, 2).nullable();
    table.decimal('zinc_ppm', 10, 2).nullable();
    table.decimal('copper_ppm', 10, 2).nullable();
    table.decimal('boron_ppm', 10, 2).nullable();

    // Other properties
    table.decimal('cec_meq_100g', 10, 2).nullable(); // Cation Exchange Capacity
    table.string('texture', 100).nullable(); // e.g., sandy, loam, clay

    // Recommendations and notes
    table.text('recommendations').nullable();
    table.text('notes').nullable();
    table.text('document_url').nullable(); // Link to full test report

    table.timestamps(true, true);

    table.index('field_id');
    table.index('farm_id');
    table.index('test_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('soil_tests');
}
