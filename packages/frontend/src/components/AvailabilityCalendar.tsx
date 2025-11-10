import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  Calendar as CalendarIcon,
  Repeat,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  Worker,
  WorkerAvailability,
  TimeOffRequest,
  AvailabilityPattern,
  BulkAvailabilityUpdate,
} from '@farm-commons/shared';

interface AvailabilityCalendarProps {
  workerId?: string;
  onAvailabilityChange?: () => void;
  allowBulkUpdate?: boolean;
}

type ViewMode = 'calendar' | 'recurring' | 'timeoff' | 'bulk';

export default function AvailabilityCalendar({
  workerId,
  onAvailabilityChange,
  allowBulkUpdate = false,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch worker availability
  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['availability', workerId, currentMonth],
    queryFn: () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const endpoint = workerId
        ? `/workers/${workerId}/availability?start_date=${start}&end_date=${end}`
        : `/availability?start_date=${start}&end_date=${end}`;
      return api.get<WorkerAvailability[]>(endpoint);
    },
  });

  // Fetch time-off requests
  const { data: timeOffRequests } = useQuery({
    queryKey: ['timeoff', workerId, currentMonth],
    queryFn: () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const endpoint = workerId
        ? `/workers/${workerId}/time-off?start_date=${start}&end_date=${end}`
        : `/time-off?start_date=${start}&end_date=${end}`;
      return api.get<TimeOffRequest[]>(endpoint);
    },
  });

  // Fetch workers for bulk update
  const { data: workersData } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get<{ data: Worker[] }>('/workers'),
    enabled: allowBulkUpdate && viewMode === 'bulk',
  });

  // Mutations
  const updateAvailabilityMutation = useMutation({
    mutationFn: (data: Partial<WorkerAvailability>) =>
      api.post(`/workers/${workerId}/availability`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onAvailabilityChange?.();
    },
  });

  const createTimeOffMutation = useMutation({
    mutationFn: (data: Partial<TimeOffRequest>) =>
      api.post(`/workers/${workerId}/time-off`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeoff'] });
      onAvailabilityChange?.();
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkAvailabilityUpdate) =>
      api.post('/availability/bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onAvailabilityChange?.();
      setSelectedWorkers([]);
    },
  });

  // Calendar calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Helper to check availability for a date
  const getAvailabilityForDate = (date: Date) => {
    if (!availability) return null;
    return availability.find((a) =>
      isSameDay(new Date(a.date), date)
    );
  };

  // Helper to check time-off for a date
  const hasTimeOffForDate = (date: Date) => {
    if (!timeOffRequests) return false;
    return timeOffRequests.some((request) => {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      return date >= start && date <= end && request.status === 'approved';
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSetAvailability = (
    date: Date,
    isAvailable: boolean,
    startTime: string,
    endTime: string
  ) => {
    updateAvailabilityMutation.mutate({
      worker_id: workerId,
      date,
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable,
      recurrence_rule: null,
      notes: null,
    });
    setSelectedDate(null);
  };

  const renderCalendarView = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayAvailability = getAvailabilityForDate(day);
            const hasTimeOff = hasTimeOffForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square p-2 rounded-lg text-sm transition-all
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isDayToday ? 'ring-2 ring-earth-500' : ''}
                  ${hasTimeOff ? 'bg-red-100 hover:bg-red-200' : ''}
                  ${dayAvailability?.is_available ? 'bg-green-100 hover:bg-green-200' : ''}
                  ${!hasTimeOff && !dayAvailability?.is_available && dayAvailability ? 'bg-gray-100 hover:bg-gray-200' : ''}
                  ${!hasTimeOff && !dayAvailability ? 'hover:bg-gray-50' : ''}
                `}
              >
                <div className="font-medium">{format(day, 'd')}</div>
                {dayAvailability && (
                  <div className="text-xs mt-1">
                    {dayAvailability.start_time}-{dayAvailability.end_time}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-gray-200 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>Time Off</span>
        </div>
      </div>
    </div>
  );

  const renderRecurringPatternView = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Repeat size={20} />
        Recurring Availability Patterns
      </h3>
      <p className="text-gray-600 mb-4">
        Set your typical weekly availability that repeats each week.
      </p>

      <div className="space-y-4">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
          (day, index) => (
            <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-24 font-medium">{day}</div>
              <select className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <input
                type="time"
                className="px-3 py-2 border border-gray-300 rounded-lg"
                defaultValue="08:00"
              />
              <span>to</span>
              <input
                type="time"
                className="px-3 py-2 border border-gray-300 rounded-lg"
                defaultValue="17:00"
              />
            </div>
          )
        )}
      </div>

      <button className="mt-6 w-full bg-earth-700 text-white py-3 rounded-lg hover:bg-earth-800 transition-colors">
        Save Recurring Pattern
      </button>
    </div>
  );

  const renderTimeOffView = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CalendarIcon size={20} />
        Time Off Requests
      </h3>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Enter reason for time off..."
          />
        </div>
        <button className="w-full bg-earth-700 text-white py-3 rounded-lg hover:bg-earth-800 transition-colors">
          Submit Request
        </button>
      </div>

      {/* Existing requests */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium mb-3">Your Time Off Requests</h4>
        <div className="space-y-2">
          {timeOffRequests?.map((request) => (
            <div
              key={request.id}
              className={`p-3 rounded-lg border ${
                request.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : request.status === 'denied'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(request.start_date), 'MMM d')} -{' '}
                    {format(new Date(request.end_date), 'MMM d, yyyy')}
                  </p>
                  {request.reason && (
                    <p className="text-xs text-gray-600 mt-1">{request.reason}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBulkUpdateView = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users size={20} />
        Bulk Availability Update
      </h3>
      <p className="text-gray-600 mb-4">
        Update availability for multiple workers at once.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Workers
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {workersData?.data?.map((worker) => (
              <label key={worker.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedWorkers.includes(worker.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWorkers([...selectedWorkers, worker.id]);
                    } else {
                      setSelectedWorkers(selectedWorkers.filter((id) => id !== worker.id));
                    }
                  }}
                  className="rounded"
                />
                <span>
                  {worker.first_name} {worker.last_name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              defaultValue="08:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              defaultValue="17:00"
            />
          </div>
        </div>

        <button
          className="w-full bg-earth-700 text-white py-3 rounded-lg hover:bg-earth-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={selectedWorkers.length === 0}
        >
          Update {selectedWorkers.length} Worker{selectedWorkers.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );

  if (loadingAvailability) {
    return <div className="text-center py-12">Loading availability...</div>;
  }

  return (
    <div>
      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'calendar'
              ? 'bg-earth-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CalendarIcon size={18} />
          Calendar
        </button>
        <button
          onClick={() => setViewMode('recurring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'recurring'
              ? 'bg-earth-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Repeat size={18} />
          Recurring
        </button>
        <button
          onClick={() => setViewMode('timeoff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'timeoff'
              ? 'bg-earth-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Clock size={18} />
          Time Off
        </button>
        {allowBulkUpdate && (
          <button
            onClick={() => setViewMode('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'bulk'
                ? 'bg-earth-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            Bulk Update
          </button>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'recurring' && renderRecurringPatternView()}
      {viewMode === 'timeoff' && renderTimeOffView()}
      {viewMode === 'bulk' && renderBulkUpdateView()}

      {/* Date Detail Modal */}
      {selectedDate && viewMode === 'calendar' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue="08:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue="17:00"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSetAvailability(selectedDate, true, '08:00', '17:00')}
                className="w-full bg-earth-700 text-white py-3 rounded-lg hover:bg-earth-800 transition-colors"
              >
                Save Availability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
