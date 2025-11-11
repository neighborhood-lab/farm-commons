import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create crops table for tracking crop rotations and planting history
  await knex.schema.createTable('crops', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms').onDelete('CASCADE');
    table.uuid('field_id').notNullable().references('id').inTable('fields').onDelete('CASCADE');
    table.string('crop_name', 200).notNullable();
    table.string('crop_variety', 200).nullable();
    table.date('planting_date').notNullable();
    table.date('expected_harvest_date').nullable();
    table.date('actual_harvest_date').nullable();
    table.decimal('planted_area_acres', 10, 2).nullable();
    table.decimal('yield_amount', 10, 2).nullable();
    table.string('yield_unit', 50).nullable(); // e.g., 'lbs', 'bushels', 'tons'
    table.enum('season', ['spring', 'summer', 'fall', 'winter']).notNullable();
    table.enum('status', ['planned', 'planted', 'growing', 'harvested', 'failed']).defaultTo('planned');
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index('farm_id');
    table.index('field_id');
    table.index('planting_date');
    table.index('status');
  });

  // Create crop_families table for rotation planning
  await knex.schema.createTable('crop_families', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.text('description').nullable();
    table.specificType('common_crops', 'text[]').defaultTo('{}');
    table.integer('recommended_rotation_years').defaultTo(3);
    table.timestamps(true, true);
  });

  // Create crop_companions table for companion planting suggestions
  await knex.schema.createTable('crop_companions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('crop_name', 200).notNullable();
    table.string('companion_crop', 200).notNullable();
    table.enum('relationship_type', ['beneficial', 'neutral', 'antagonistic']).notNullable();
    table.text('benefits').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index(['crop_name', 'companion_crop']);
  });

  // Add crop_family_id to crops table
  await knex.schema.alterTable('crops', (table) => {
    table.uuid('crop_family_id').nullable().references('id').inTable('crop_families').onDelete('SET NULL');
    table.index('crop_family_id');
  });

  // Seed common crop families
  await knex('crop_families').insert([
    {
      name: 'Brassicas',
      description: 'Cabbage family',
      common_crops: ['broccoli', 'cabbage', 'cauliflower', 'kale', 'brussels sprouts', 'collard greens'],
      recommended_rotation_years: 3,
    },
    {
      name: 'Nightshades',
      description: 'Tomato family',
      common_crops: ['tomatoes', 'peppers', 'eggplant', 'potatoes'],
      recommended_rotation_years: 3,
    },
    {
      name: 'Legumes',
      description: 'Bean family',
      common_crops: ['beans', 'peas', 'lentils', 'soybeans', 'peanuts'],
      recommended_rotation_years: 3,
    },
    {
      name: 'Cucurbits',
      description: 'Squash family',
      common_crops: ['cucumbers', 'squash', 'pumpkins', 'melons', 'zucchini'],
      recommended_rotation_years: 3,
    },
    {
      name: 'Alliums',
      description: 'Onion family',
      common_crops: ['onions', 'garlic', 'leeks', 'shallots', 'chives'],
      recommended_rotation_years: 3,
    },
    {
      name: 'Root Vegetables',
      description: 'Root crops',
      common_crops: ['carrots', 'beets', 'radishes', 'turnips', 'parsnips'],
      recommended_rotation_years: 2,
    },
    {
      name: 'Leafy Greens',
      description: 'Lettuce and greens',
      common_crops: ['lettuce', 'spinach', 'arugula', 'chard', 'mustard greens'],
      recommended_rotation_years: 2,
    },
  ]);

  // Seed common companion planting relationships
  await knex('crop_companions').insert([
    // Tomato companions
    { crop_name: 'tomatoes', companion_crop: 'basil', relationship_type: 'beneficial', benefits: 'Improves flavor and repels pests' },
    { crop_name: 'tomatoes', companion_crop: 'carrots', relationship_type: 'beneficial', benefits: 'Carrots aerate soil for tomato roots' },
    { crop_name: 'tomatoes', companion_crop: 'marigolds', relationship_type: 'beneficial', benefits: 'Repels nematodes and aphids' },
    { crop_name: 'tomatoes', companion_crop: 'potatoes', relationship_type: 'antagonistic', benefits: 'Both attract same pests and diseases' },
    { crop_name: 'tomatoes', companion_crop: 'cabbage', relationship_type: 'antagonistic', benefits: 'Inhibits growth of cabbage' },

    // Bean companions
    { crop_name: 'beans', companion_crop: 'corn', relationship_type: 'beneficial', benefits: 'Beans fix nitrogen, corn provides support' },
    { crop_name: 'beans', companion_crop: 'squash', relationship_type: 'beneficial', benefits: 'Three Sisters companion planting' },
    { crop_name: 'beans', companion_crop: 'carrots', relationship_type: 'beneficial', benefits: 'Beans add nitrogen to soil' },
    { crop_name: 'beans', companion_crop: 'onions', relationship_type: 'antagonistic', benefits: 'Inhibits bean growth' },

    // Carrot companions
    { crop_name: 'carrots', companion_crop: 'onions', relationship_type: 'beneficial', benefits: 'Onions repel carrot fly' },
    { crop_name: 'carrots', companion_crop: 'leeks', relationship_type: 'beneficial', benefits: 'Mutually beneficial pest control' },
    { crop_name: 'carrots', companion_crop: 'dill', relationship_type: 'antagonistic', benefits: 'Dill can stunt carrot growth' },

    // Cabbage companions
    { crop_name: 'cabbage', companion_crop: 'onions', relationship_type: 'beneficial', benefits: 'Repels cabbage worms' },
    { crop_name: 'cabbage', companion_crop: 'dill', relationship_type: 'beneficial', benefits: 'Attracts beneficial insects' },
    { crop_name: 'cabbage', companion_crop: 'strawberries', relationship_type: 'antagonistic', benefits: 'Inhibits growth of both' },

    // Cucumber companions
    { crop_name: 'cucumbers', companion_crop: 'beans', relationship_type: 'beneficial', benefits: 'Beans fix nitrogen' },
    { crop_name: 'cucumbers', companion_crop: 'radishes', relationship_type: 'beneficial', benefits: 'Radishes deter cucumber beetles' },
    { crop_name: 'cucumbers', companion_crop: 'potatoes', relationship_type: 'antagonistic', benefits: 'Compete for nutrients' },

    // Lettuce companions
    { crop_name: 'lettuce', companion_crop: 'carrots', relationship_type: 'beneficial', benefits: 'Lettuce shades carrot roots' },
    { crop_name: 'lettuce', companion_crop: 'radishes', relationship_type: 'beneficial', benefits: 'Radishes deter pests' },
    { crop_name: 'lettuce', companion_crop: 'onions', relationship_type: 'beneficial', benefits: 'Onions repel aphids' },

    // Pepper companions
    { crop_name: 'peppers', companion_crop: 'basil', relationship_type: 'beneficial', benefits: 'Repels aphids and thrips' },
    { crop_name: 'peppers', companion_crop: 'onions', relationship_type: 'beneficial', benefits: 'Repels aphids' },
    { crop_name: 'peppers', companion_crop: 'beans', relationship_type: 'antagonistic', benefits: 'Can spread diseases' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('crop_companions');
  await knex.schema.dropTableIfExists('crops');
  await knex.schema.dropTableIfExists('crop_families');
}
