import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { api } from '../lib/api';
import type { Schedule } from '@farm-commons/shared';
import ScheduleCalendar from '../components/ScheduleCalendar';

type ViewType = 'list' | 'calendar';

export default function SchedulePage() {
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', currentWeek],
    queryFn: () => {
      const startDate = format(currentWeek, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      return api.get<Schedule[]>(`/schedules?start_date=${startDate}&end_date=${endDate}`);
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getSchedulesForDay = (day: Date) => {
    if (!schedules) return [];
    const dayStr = format(day, 'yyyy-MM-dd');
    return schedules.filter(
      (s) => format(new Date(s.scheduled_date), 'yyyy-MM-dd') === dayStr
    );
  };

  const handleEventClick = (schedule: Schedule) => {
    // TODO: Open schedule detail modal
    console.log('Schedule clicked:', schedule);
  };

  if (isLoading && viewType === 'list') {
    return <div className="text-center py-12">Loading schedule...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-2">
            Weekly schedule and field assignments
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'calendar'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon size={16} />
              Calendar
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'list'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              List
            </button>
          </div>

          <button className="flex items-center gap-2 bg-earth-700 text-white px-6 py-3 rounded-lg hover:bg-earth-800 transition-colors">
            <Plus size={20} />
            Add Shift
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewType === 'calendar' && (
        <ScheduleCalendar onEventClick={handleEventClick} />
      )}

      {/* List View */}
      {viewType === 'list' && (
        <>
          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Previous Week
              </button>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {format(currentWeek, 'MMMM d')} - {format(addDays(currentWeek, 6), 'MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Next Week →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white rounded-lg shadow border p-4 min-h-[200px] ${
                    isToday ? 'border-earth-500 ring-2 ring-earth-200' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500">
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-2xl font-bold ${isToday ? 'text-earth-700' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-2 rounded text-xs border ${
                          schedule.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : schedule.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <p className="font-medium truncate">{schedule.task_type}</p>
                        <p className="text-gray-600 mt-1">
                          {schedule.start_time} - {schedule.end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {schedules && schedules.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
              <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts scheduled</h3>
              <p className="text-gray-600 mb-6">
                Start planning your week by adding shifts for your workers
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
