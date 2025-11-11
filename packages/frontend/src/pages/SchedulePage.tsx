import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { Schedule } from '@farm-commons/shared';

export default function SchedulePage() {
  const { t } = useTranslation();
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

  if (isLoading) {
    return <div className="text-center py-12">{t('schedule.loading')}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Weekly schedule and field assignments
          </p>
        </div>
        <button className="flex items-center gap-2 bg-earth-700 dark:bg-earth-600 text-white px-6 py-3 rounded-lg hover:bg-earth-800 dark:hover:bg-earth-700 transition-colors">
          <Plus size={20} />
          {t('schedule.addShift')}
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('schedule.previousWeek')}
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentWeek, 'MMMM d')} - {format(addDays(currentWeek, 6), 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('schedule.nextWeek')}
          </button>
        </div>
      </div>

      {/* Calendar Grid - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-4">
        <div className="min-w-[700px] lg:min-w-0 grid grid-cols-7 gap-2 sm:gap-4">
          {weekDays.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={day.toISOString()}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border p-4 min-h-[200px] ${
                isToday ? 'border-earth-500 dark:border-earth-600 ring-2 ring-earth-200 dark:ring-earth-700' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {format(day, 'EEE')}
                </p>
                <p className={`text-2xl font-bold ${isToday ? 'text-earth-700 dark:text-earth-400' : 'text-gray-900 dark:text-white'}`}>
                  {format(day, 'd')}
                </p>
              </div>

              <div className="space-y-2">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`p-2 rounded text-xs border ${
                      schedule.status === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                        : schedule.status === 'in_progress'
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="font-medium truncate text-gray-900 dark:text-white">{schedule.task_type}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {schedules && schedules.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mt-6">
          <CalendarIcon className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No shifts scheduled</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start planning your week by adding shifts for your workers
          </p>
        </div>
      )}
    </div>
  );
}
