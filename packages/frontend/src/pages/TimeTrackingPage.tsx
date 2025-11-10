import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { formatTime, formatHoursAsTime } from '@farm-commons/shared';
import type { TimeEntry } from '@farm-commons/shared';

export default function TimeTrackingPage() {
  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api.get<TimeEntry[]>('/time-entries'),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading time entries...</div>;
  }

  const entries = timeEntries || [];
  const openEntries = entries.filter((e) => !e.clock_out);
  const completedEntries = entries.filter((e) => e.clock_out);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-gray-600 mt-2">Worker time entries and hours tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 dark:bg-blue-600 p-3 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Shifts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{openEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 dark:bg-green-600 p-3 rounded-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 dark:bg-purple-600 p-3 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {completedEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shifts */}
      {openEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Shifts</h2>
          <div className="space-y-3">
            {openEntries.map((entry) => (
              <div key={entry.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{entry.task_type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Clocked in at {formatTime(entry.clock_in)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">In Progress</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Time Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(entry.clock_in), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {entry.task_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(entry.clock_in)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {entry.clock_out ? formatTime(entry.clock_out) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.total_hours ? formatHoursAsTime(entry.total_hours) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.clock_out ? (
                      entry.verified_at ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded">
                          <Clock size={14} />
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                        <Clock size={14} />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <span className="hidden sm:inline">{format(new Date(entry.clock_in), 'MMM d, yyyy')}</span>
                      <span className="sm:hidden">{format(new Date(entry.clock_in), 'MMM d')}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {entry.task_type}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {formatTime(entry.clock_in)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {entry.clock_out ? formatTime(entry.clock_out) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {entry.total_hours ? formatHoursAsTime(entry.total_hours) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {entry.clock_out ? (
                        entry.verified_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Verified</span>
                            <span className="sm:hidden">✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Pending</span>
                            <span className="sm:hidden">⏳</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Active</span>
                          <span className="sm:hidden">●</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="text-center py-12 px-4">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
            <p className="text-gray-600">Time entries will appear here when workers clock in</p>
          </div>
        )}
      </div>
    </div>
  );
}
