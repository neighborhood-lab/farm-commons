import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
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
        <p className="text-gray-600 mt-2">
          Worker time entries and hours tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Shifts</p>
              <p className="text-3xl font-bold text-gray-900">{openEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">{completedEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours Today</p>
              <p className="text-3xl font-bold text-gray-900">
                {completedEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shifts */}
      {openEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Shifts</h2>
          <div className="space-y-3">
            {openEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.task_type}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Clocked in at {formatTime(entry.clock_in)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-blue-700">In Progress</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Time Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(entry.clock_in), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.task_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(entry.clock_in)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {entry.clock_out ? formatTime(entry.clock_out) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.total_hours ? formatHoursAsTime(entry.total_hours) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.clock_out ? (
                      entry.verified_at ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          <Clock size={14} />
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        <Clock size={14} />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
            <p className="text-gray-600">
              Time entries will appear here when workers clock in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
