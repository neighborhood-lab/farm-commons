// Integration tests for task checklist routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';

// Test database configuration
const testDb: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number.Number.Number.Number.Number.Number.Number.Number.parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'farm_commons_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  },
  pool: { min: 0, max: 10 },
});

describe('Task Checklist System', () => {
  let farmId: string;
  let workerId: string;
  let scheduleId: string;
  let templateId: string;
  let templateItemId: string;

  beforeAll(async () => {
    // Run migrations
    try {
      await testDb.migrate.latest({
        directory: './src/db/migrations',
      });
    } catch {
      // Migrations might already be run, continue
      // eslint-disable-next-line no-console
      console.log('Migration setup:', error);
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb('checklist_item_completions').del();
    await testDb('schedule_checklists').del();
    await testDb('checklist_template_items').del();
    await testDb('checklist_templates').del();
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('certifications').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();

    // Create test farm
    [{ id: farmId }] = await testDb('farms')
      .insert({
        name: 'Test Farm',
        location: 'Test Location',
        size_acres: 100,
        organic_certified: true,
      })
      .returning('id');

    // Create test worker
    [{ id: workerId }] = await testDb('workers')
      .insert({
        farm_id: farmId,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0001',
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 20,
      })
      .returning('id');

    // Create test schedule
    [{ id: scheduleId }] = await testDb('schedules')
      .insert({
        farm_id: farmId,
        worker_id: workerId,
        scheduled_date: new Date('2024-11-15'),
        start_time: '08:00',
        end_time: '17:00',
        task_type: 'Harvesting',
        task_description: 'Harvest tomatoes',
        status: 'scheduled',
      })
      .returning('id');
  });

  afterAll(async () => {
    // Clean up and close connection
    await testDb('checklist_item_completions').del();
    await testDb('schedule_checklists').del();
    await testDb('checklist_template_items').del();
    await testDb('checklist_templates').del();
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('certifications').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();
    await testDb.destroy();
  });

  describe('Checklist Templates', () => {
    it('should create a checklist template with items', async () => {
      const [template] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Pre-Harvest Checklist',
          description: 'Tasks to complete before harvesting',
          task_type: 'Harvesting',
        })
        .returning('*');

      expect(template).toBeDefined();
      expect(template.name).toBe('Pre-Harvest Checklist');
      expect(template.task_type).toBe('Harvesting');

      // Add items to template
      const items = await testDb('checklist_template_items')
        .insert([
          {
            template_id: template.id,
            description: 'Check weather conditions',
            is_required: true,
            sort_order: 0,
          },
          {
            template_id: template.id,
            description: 'Inspect harvesting equipment',
            is_required: true,
            sort_order: 1,
          },
          {
            template_id: template.id,
            description: 'Prepare storage containers',
            is_required: false,
            sort_order: 2,
          },
        ])
        .returning('*');

      expect(items.length).toBe(3);
      expect(items[0].description).toBe('Check weather conditions');
      expect(items[0].is_required).toBe(true);
    });

    it('should retrieve template with all items', async () => {
      // Create template
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Safety Checklist',
          description: 'Pre-work safety checks',
          task_type: null,
        })
        .returning('id');

      // Add items
      await testDb('checklist_template_items').insert([
        {
          template_id: templateId,
          description: 'Verify PPE availability',
          is_required: true,
          sort_order: 0,
        },
        {
          template_id: templateId,
          description: 'Check first aid kit',
          is_required: true,
          sort_order: 1,
        },
      ]);

      // Retrieve template with items
      const template = await testDb('checklist_templates').where({ id: templateId }).first();

      const items = await testDb('checklist_template_items')
        .where({ template_id: templateId })
        .orderBy('sort_order', 'asc');

      expect(template).toBeDefined();
      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Verify PPE availability');
      expect(items[1].description).toBe('Check first aid kit');
    });

    it('should update template details', async () => {
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Original Name',
          description: 'Original description',
        })
        .returning('id');

      const [updated] = await testDb('checklist_templates')
        .where({ id: templateId })
        .update({
          name: 'Updated Name',
          description: 'Updated description',
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should delete template and cascade to items', async () => {
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Temp Template',
        })
        .returning('id');

      await testDb('checklist_template_items').insert({
        template_id: templateId,
        description: 'Temp item',
        sort_order: 0,
      });

      // Delete template
      await testDb('checklist_templates').where({ id: templateId }).delete();

      // Verify items were also deleted
      const items = await testDb('checklist_template_items').where({ template_id: templateId });

      expect(items.length).toBe(0);
    });
  });

  describe('Template Items', () => {
    beforeEach(async () => {
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Test Template',
        })
        .returning('id');
    });

    it('should add item to template', async () => {
      const [item] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'New checklist item',
          is_required: false,
          sort_order: 0,
        })
        .returning('*');

      expect(item).toBeDefined();
      expect(item.description).toBe('New checklist item');
      expect(item.is_required).toBe(false);
    });

    it('should update item properties', async () => {
      [{ id: templateItemId }] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Original description',
          is_required: false,
          sort_order: 0,
        })
        .returning('id');

      const [updated] = await testDb('checklist_template_items')
        .where({ id: templateItemId })
        .update({
          description: 'Updated description',
          is_required: true,
          sort_order: 5,
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.description).toBe('Updated description');
      expect(updated.is_required).toBe(true);
      expect(updated.sort_order).toBe(5);
    });

    it('should respect sort order', async () => {
      await testDb('checklist_template_items').insert([
        {
          template_id: templateId,
          description: 'Third item',
          sort_order: 2,
        },
        {
          template_id: templateId,
          description: 'First item',
          sort_order: 0,
        },
        {
          template_id: templateId,
          description: 'Second item',
          sort_order: 1,
        },
      ]);

      const items = await testDb('checklist_template_items')
        .where({ template_id: templateId })
        .orderBy('sort_order', 'asc');

      expect(items[0].description).toBe('First item');
      expect(items[1].description).toBe('Second item');
      expect(items[2].description).toBe('Third item');
    });
  });

  describe('Checklist Assignment', () => {
    beforeEach(async () => {
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Harvest Checklist',
        })
        .returning('id');

      await testDb('checklist_template_items').insert([
        {
          template_id: templateId,
          description: 'Item 1',
          is_required: true,
          sort_order: 0,
        },
        {
          template_id: templateId,
          description: 'Item 2',
          is_required: false,
          sort_order: 1,
        },
      ]);
    });

    it('should assign checklist to schedule', async () => {
      const [scheduleChecklist] = await testDb('schedule_checklists')
        .insert({
          schedule_id: scheduleId,
          template_id: templateId,
        })
        .returning('*');

      expect(scheduleChecklist).toBeDefined();
      expect(scheduleChecklist.schedule_id).toBe(scheduleId);
      expect(scheduleChecklist.template_id).toBe(templateId);
    });

    it('should create completions for all template items', async () => {
      const [scheduleChecklist] = await testDb('schedule_checklists')
        .insert({
          schedule_id: scheduleId,
          template_id: templateId,
        })
        .returning('*');

      const items = await testDb('checklist_template_items').where({ template_id: templateId });

      await testDb('checklist_item_completions').insert(
        items.map((item) => ({
          schedule_checklist_id: scheduleChecklist.id,
          template_item_id: item.id,
          completed: false,
        }))
      );

      const completions = await testDb('checklist_item_completions').where({
        schedule_checklist_id: scheduleChecklist.id,
      });

      expect(completions.length).toBe(2);
      expect(completions.every((c) => c.completed === false)).toBe(true);
    });

    it('should prevent duplicate template assignments', async () => {
      await testDb('schedule_checklists').insert({
        schedule_id: scheduleId,
        template_id: templateId,
      });

      // Attempt duplicate assignment
      await expect(
        testDb('schedule_checklists').insert({
          schedule_id: scheduleId,
          template_id: templateId,
        })
      ).rejects.toThrow();
    });

    it('should retrieve all checklists for schedule', async () => {
      // Create second template
      const [template2Id] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Safety Checklist',
        })
        .returning('id');

      // Assign both templates
      await testDb('schedule_checklists').insert([
        { schedule_id: scheduleId, template_id: templateId },
        { schedule_id: scheduleId, template_id: template2Id.id },
      ]);

      const checklists = await testDb('schedule_checklists')
        .where({ schedule_id: scheduleId })
        .join('checklist_templates', 'schedule_checklists.template_id', 'checklist_templates.id')
        .select('schedule_checklists.*', 'checklist_templates.name');

      expect(checklists.length).toBe(2);
      expect(checklists.some((c) => c.name === 'Harvest Checklist')).toBe(true);
      expect(checklists.some((c) => c.name === 'Safety Checklist')).toBe(true);
    });
  });

  describe('Checklist Completion', () => {
    let scheduleChecklistId: string;
    let completionId: string;
    let userId: string;

    beforeEach(async () => {
      // Create user
      [{ id: userId }] = await testDb('users')
        .insert({
          email: 'test@example.com',
          // eslint-disable-next-line sonarjs/no-hardcoded-passwords
          password_hash: 'hash',
          role: 'manager',
          farm_id: farmId,
        })
        .returning('id');

      // Create template and items
      [{ id: templateId }] = await testDb('checklist_templates')
        .insert({
          farm_id: farmId,
          name: 'Test Checklist',
        })
        .returning('id');

      [{ id: templateItemId }] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Test item',
          is_required: true,
          sort_order: 0,
        })
        .returning('id');

      // Assign to schedule
      [{ id: scheduleChecklistId }] = await testDb('schedule_checklists')
        .insert({
          schedule_id: scheduleId,
          template_id: templateId,
        })
        .returning('id');

      // Create completion
      [{ id: completionId }] = await testDb('checklist_item_completions')
        .insert({
          schedule_checklist_id: scheduleChecklistId,
          template_item_id: templateItemId,
          completed: false,
        })
        .returning('id');
    });

    it('should mark item as completed', async () => {
      const [updated] = await testDb('checklist_item_completions')
        .where({ id: completionId })
        .update({
          completed: true,
          completed_by: userId,
          completed_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.completed).toBe(true);
      expect(updated.completed_by).toBe(userId);
      expect(updated.completed_at).toBeDefined();
    });

    it('should add notes to completion', async () => {
      const [updated] = await testDb('checklist_item_completions')
        .where({ id: completionId })
        .update({
          completed: true,
          completed_by: userId,
          completed_at: new Date(),
          notes: 'Verified all equipment is functioning properly',
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.notes).toBe('Verified all equipment is functioning properly');
    });

    it('should attach photo to completion', async () => {
      const photoUrl = 'https://example.com/photos/checklist-item-verification.jpg';

      const [updated] = await testDb('checklist_item_completions')
        .where({ id: completionId })
        .update({
          completed: true,
          completed_by: userId,
          completed_at: new Date(),
          photo_url: photoUrl,
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.photo_url).toBe(photoUrl);
    });

    it('should unmark completed item', async () => {
      // First, mark as completed
      await testDb('checklist_item_completions').where({ id: completionId }).update({
        completed: true,
        completed_by: userId,
        completed_at: new Date(),
      });

      // Then unmark
      const [updated] = await testDb('checklist_item_completions')
        .where({ id: completionId })
        .update({
          completed: false,
          completed_by: null,
          completed_at: null,
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.completed).toBe(false);
      expect(updated.completed_by).toBeNull();
      expect(updated.completed_at).toBeNull();
    });

    it('should calculate checklist completion percentage', async () => {
      // Add more items
      const [item2] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Second item',
          sort_order: 1,
        })
        .returning('id');

      const [item3] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Third item',
          sort_order: 2,
        })
        .returning('id');

      await testDb('checklist_item_completions').insert([
        {
          schedule_checklist_id: scheduleChecklistId,
          template_item_id: item2.id,
          completed: false,
        },
        {
          schedule_checklist_id: scheduleChecklistId,
          template_item_id: item3.id,
          completed: false,
        },
      ]);

      // Complete first item
      await testDb('checklist_item_completions')
        .where({ id: completionId })
        .update({ completed: true });

      // Calculate completion percentage
      const [stats] = await testDb('checklist_item_completions')
        .where({ schedule_checklist_id: scheduleChecklistId })
        .select(
          testDb.raw('COUNT(*) as total'),
          testDb.raw('SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count')
        );

      const total = Number.Number.Number.Number.Number.Number.Number.Number.parseInt(stats.total as string);
      const completedCount = Number.Number.Number.Number.Number.Number.Number.Number.parseInt(stats.completed_count as string);
      const percentage = (completedCount / total) * 100;

      expect(total).toBe(3);
      expect(completedCount).toBe(1);
      expect(percentage).toBeCloseTo(33.33, 1);
    });

    it('should identify incomplete required items', async () => {
      // Add required and optional items
      const [requiredItem] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Required item',
          is_required: true,
          sort_order: 1,
        })
        .returning('id');

      const [optionalItem] = await testDb('checklist_template_items')
        .insert({
          template_id: templateId,
          description: 'Optional item',
          is_required: false,
          sort_order: 2,
        })
        .returning('id');

      await testDb('checklist_item_completions').insert([
        {
          schedule_checklist_id: scheduleChecklistId,
          template_item_id: requiredItem.id,
          completed: false,
        },
        {
          schedule_checklist_id: scheduleChecklistId,
          template_item_id: optionalItem.id,
          completed: false,
        },
      ]);

      // Get incomplete required items
      const incompleteRequired = await testDb('checklist_item_completions')
        .where({ schedule_checklist_id: scheduleChecklistId, completed: false })
        .join(
          'checklist_template_items',
          'checklist_item_completions.template_item_id',
          'checklist_template_items.id'
        )
        .where({ 'checklist_template_items.is_required': true })
        .select('checklist_template_items.*');

      expect(incompleteRequired.length).toBe(2); // Both the original and the new required item
    });
  });
});
