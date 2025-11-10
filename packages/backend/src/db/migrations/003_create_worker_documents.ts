import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create worker_documents table
  await knex.schema.createTable('worker_documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.string('document_name', 255).notNullable();
    table.enum('document_type', [
      'i9_form',
      'w4_form',
      'contract',
      'id_document',
      'work_authorization',
      'training_certificate',
      'other',
    ]).notNullable();
    table.text('file_path').notNullable();
    table.string('file_name', 255).notNullable();
    table.string('mime_type', 100).notNullable();
    table.integer('file_size').notNullable(); // in bytes
    table.date('expiration_date').nullable();
    table.text('notes').nullable();
    table.uuid('uploaded_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.timestamps(true, true);
    table.index('worker_id');
    table.index('farm_id');
    table.index('document_type');
    table.index('expiration_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('worker_documents');
}
