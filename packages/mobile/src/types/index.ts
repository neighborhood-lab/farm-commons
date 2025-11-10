// Mobile App Types

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface ClockInData {
  worker_id: string;
  task_type: string;
  field_id?: string;
  schedule_id?: string;
  notes?: string;
  location?: LocationCoords;
  photo_uri?: string;
}

export interface ClockOutData {
  break_minutes?: number;
  notes?: string;
  location?: LocationCoords;
  photo_uri?: string;
}

export interface ActiveTimeEntry {
  id: string;
  worker_id: string;
  clock_in: string;
  task_type: string;
  field_id?: string;
  elapsed_hours: number;
}

export type ClockStatus = 'clocked_out' | 'clocked_in' | 'loading' | 'error';
