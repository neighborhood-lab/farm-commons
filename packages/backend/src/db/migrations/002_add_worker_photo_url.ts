import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workers', (table) => {
    table.text('photo_url').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workers', (table) => {
    table.dropColumn('photo_url');
  });
}
