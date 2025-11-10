import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type EventResizeDoneArg, type EventDropArg } from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';
import { Calendar, Filter, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Schedule, Worker, Field } from '@farm-commons/shared';

type ViewMode = 'month' | 'week';
type ColorMode = 'worker' | 'task';

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    schedule: Schedule;
  };
}

interface ScheduleCalendarProps {
  onEventClick?: (schedule: Schedule) => void;
}

// Color palettes for workers and tasks
const WORKER_COLORS = [
  { bg: '#3b82f6', border: '#2563eb' }, // blue
  { bg: '#10b981', border: '#059669' }, // green
  { bg: '#f59e0b', border: '#d97706' }, // amber
  { bg: '#ef4444', border: '#dc2626' }, // red
  { bg: '#8b5cf6', border: '#7c3aed' }, // violet
  { bg: '#ec4899', border: '#db2777' }, // pink
  { bg: '#14b8a6', border: '#0d9488' }, // teal
  { bg: '#f97316', border: '#ea580c' }, // orange
];

const TASK_COLORS: Record<string, { bg: string; border: string }> = {
  planting: { bg: '#10b981', border: '#059669' }, // green
  harvesting: { bg: '#f59e0b', border: '#d97706' }, // amber
  weeding: { bg: '#8b5cf6', border: '#7c3aed' }, // violet
  irrigation: { bg: '#3b82f6', border: '#2563eb' }, // blue
  maintenance: { bg: '#ef4444', border: '#dc2626' }, // red
  default: { bg: '#6b7280', border: '#4b5563' }, // gray
};

export default function ScheduleCalendar({ onEventClick }: ScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [colorMode, setColorMode] = useState<ColorMode>('worker');
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', dateRange],
    queryFn: () =>
      api.get<Schedule[]>(
        `/schedules?start_date=${dateRange.start}&end_date=${dateRange.end}`
      ),
  });

  // Fetch workers for filter
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get<Worker[]>('/workers'),
  });

  // Fetch fields for filter
  const { data: fields = [] } = useQuery({
    queryKey: ['fields'],
    queryFn: () => api.get<Field[]>('/fields'),
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) =>
      api.put<Schedule>(`/schedules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  // Get color for event based on mode
  const getEventColor = (schedule: Schedule, workerId: string) => {
    if (colorMode === 'worker') {
      const workerIndex = workers.findIndex((w) => w.id === workerId);
      return WORKER_COLORS[workerIndex % WORKER_COLORS.length];
    } else {
      const taskType = schedule.task_type.toLowerCase();
      return TASK_COLORS[taskType] || TASK_COLORS.default;
    }
  };

  // Convert schedules to FullCalendar events
  const events: ScheduleEvent[] = useMemo(() => {
    let filteredSchedules = schedules;

    // Apply worker filter
    if (selectedWorker) {
      filteredSchedules = filteredSchedules.filter(
        (s) => s.worker_id === selectedWorker
      );
    }

    // Apply field filter
    if (selectedField) {
      filteredSchedules = filteredSchedules.filter(
        (s) => s.field_id === selectedField
      );
    }

    return filteredSchedules.map((schedule) => {
      const scheduleDate = typeof schedule.scheduled_date === 'string'
        ? schedule.scheduled_date
        : format(new Date(schedule.scheduled_date), 'yyyy-MM-dd');

      const colors = getEventColor(schedule, schedule.worker_id);

      return {
        id: schedule.id,
        title: schedule.task_type,
        start: `${scheduleDate}T${schedule.start_time}`,
        end: `${scheduleDate}T${schedule.end_time}`,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        extendedProps: {
          schedule,
        },
      };
    });
  }, [schedules, selectedWorker, selectedField, colorMode, workers]);

  // Handle event drop (drag-and-drop)
  const handleEventDrop = (info: EventDropArg) => {
    const schedule = info.event.extendedProps.schedule as Schedule;
    const newDate = format(info.event.start!, 'yyyy-MM-dd');
    const newStartTime = format(info.event.start!, 'HH:mm');
    const newEndTime = format(info.event.end!, 'HH:mm');

    updateScheduleMutation.mutate({
      id: schedule.id,
      data: {
        scheduled_date: new Date(newDate),
        start_time: newStartTime,
        end_time: newEndTime,
      },
    });
  };

  // Handle event resize
  const handleEventResize = (info: EventResizeDoneArg) => {
    const schedule = info.event.extendedProps.schedule as Schedule;
    const newEndTime = format(info.event.end!, 'HH:mm');

    updateScheduleMutation.mutate({
      id: schedule.id,
      data: {
        end_time: newEndTime,
      },
    });
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const schedule = info.event.extendedProps.schedule as Schedule;
    if (onEventClick) {
      onEventClick(schedule);
    }
  };

  // Handle date range change
  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      start: format(dateInfo.start, 'yyyy-MM-dd'),
      end: format(dateInfo.end, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="text-earth-700" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Schedule Calendar</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>

          {/* Color Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setColorMode('worker')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                colorMode === 'worker'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Worker
            </button>
            <button
              onClick={() => setColorMode('task')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                colorMode === 'task'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              By Task
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters || selectedWorker || selectedField
                ? 'bg-earth-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            Filters
            {(selectedWorker || selectedField) && (
              <span className="bg-white text-earth-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {[selectedWorker, selectedField].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filter Schedules</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Worker Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Worker
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
              >
                <option value="">All Workers</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.first_name} {worker.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Field
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
              >
                <option value="">All Fields</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedWorker || selectedField) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedWorker('');
                  setSelectedField('');
                }}
                className="text-sm text-earth-700 hover:text-earth-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="schedule-calendar">
        {schedulesLoading ? (
          <div className="text-center py-12 text-gray-500">
            Loading schedule...
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewMode === 'month' ? 'dayGridMonth' : 'timeGridWeek'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={events}
            editable={true}
            droppable={true}
            eventResizableFromStart={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
          />
        )}
      </div>

      {/* Color Legend */}
      {colorMode === 'task' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Task Types</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(TASK_COLORS)
              .filter(([key]) => key !== 'default')
              .map(([task, colors]) => (
                <div key={task} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span className="text-sm text-gray-600 capitalize">{task}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
