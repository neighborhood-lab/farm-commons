import { schema } from '../../database/schema';

/**
 * Schema Tests
 * Validates the database schema structure
 */

describe('Database Schema', () => {
  it('should have version 1', () => {
    expect(schema.version).toBe(1);
  });

  it('should have all required tables', () => {
    const tableNames = schema.tables.map((table) => table.name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('farms');
    expect(tableNames).toContain('workers');
    expect(tableNames).toContain('fields');
    expect(tableNames).toContain('schedules');
    expect(tableNames).toContain('time_entries');
    expect(tableNames).toContain('certifications');
    expect(tableNames).toContain('sync_queue');
  });

  it('should have correct number of tables', () => {
    expect(schema.tables).toHaveLength(8);
  });

  describe('Users Table', () => {
    it('should have correct columns', () => {
      const usersTable = schema.tables.find((t) => t.name === 'users');
      expect(usersTable).toBeDefined();

      const columnNames = usersTable!.columns.map((c) => c.name);
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('farm_id');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('synced_at');
    });

    it('should have indexed columns', () => {
      const usersTable = schema.tables.find((t) => t.name === 'users');
      const emailColumn = usersTable!.columns.find((c) => c.name === 'email');
      const roleColumn = usersTable!.columns.find((c) => c.name === 'role');

      expect(emailColumn?.isIndexed).toBe(true);
      expect(roleColumn?.isIndexed).toBe(true);
    });
  });

  describe('Workers Table', () => {
    it('should have all worker fields', () => {
      const workersTable = schema.tables.find((t) => t.name === 'workers');
      expect(workersTable).toBeDefined();

      const columnNames = workersTable!.columns.map((c) => c.name);
      expect(columnNames).toContain('first_name');
      expect(columnNames).toContain('last_name');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('phone');
      expect(columnNames).toContain('hourly_rate');
      expect(columnNames).toContain('certifications');
      expect(columnNames).toContain('skills');
    });

    it('should have indexed foreign keys', () => {
      const workersTable = schema.tables.find((t) => t.name === 'workers');
      const farmIdColumn = workersTable!.columns.find((c) => c.name === 'farm_id');

      expect(farmIdColumn?.isIndexed).toBe(true);
    });
  });

  describe('Time Entries Table', () => {
    it('should have time tracking columns', () => {
      const timeEntriesTable = schema.tables.find((t) => t.name === 'time_entries');
      expect(timeEntriesTable).toBeDefined();

      const columnNames = timeEntriesTable!.columns.map((c) => c.name);
      expect(columnNames).toContain('clock_in');
      expect(columnNames).toContain('clock_out');
      expect(columnNames).toContain('break_minutes');
      expect(columnNames).toContain('total_hours');
    });
  });

  describe('Sync Queue Table', () => {
    it('should have sync tracking columns', () => {
      const syncQueueTable = schema.tables.find((t) => t.name === 'sync_queue');
      expect(syncQueueTable).toBeDefined();

      const columnNames = syncQueueTable!.columns.map((c) => c.name);
      expect(columnNames).toContain('table_name');
      expect(columnNames).toContain('record_id');
      expect(columnNames).toContain('operation');
      expect(columnNames).toContain('data');
      expect(columnNames).toContain('retry_count');
      expect(columnNames).toContain('synced');
    });

    it('should have indexed sync columns', () => {
      const syncQueueTable = schema.tables.find((t) => t.name === 'sync_queue');
      const syncedColumn = syncQueueTable!.columns.find((c) => c.name === 'synced');

      expect(syncedColumn?.isIndexed).toBe(true);
    });
  });
});
