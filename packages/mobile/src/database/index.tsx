import React, { createContext, useContext, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Worker, Schedule, TimeEntry, Field, SyncQueueItem } from './models';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Use JSI for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Worker, Schedule, TimeEntry, Field, SyncQueueItem],
});

const DatabaseContext = createContext<Database | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export * from './models';
export * from './schema';
