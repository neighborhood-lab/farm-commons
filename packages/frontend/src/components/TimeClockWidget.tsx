import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Square, User } from 'lucide-react';
import { api } from '../lib/api';
import { formatTime, calculatePreciseHours } from '@farm-commons/shared';
import type { Worker, TimeEntry, PaginatedResponse } from '@farm-commons/shared';

interface ClockInData {
  worker_id: string;
  task_type: string;
  field_id?: string | null;
  schedule_id?: string | null;
  notes?: string | null;
}

interface ClockOutData {
  break_minutes: number;
  notes?: string | null;
}

export default function TimeClockWidget() {
  const queryClient = useQueryClient();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  // Fetch workers for dropdown
  const { data: workersData } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get<PaginatedResponse<Worker>>('/workers?per_page=100'),
  });

  // Fetch all time entries
  const { data: timeEntries } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api.get<TimeEntry[]>('/time-entries'),
    refetchInterval: 5000, // Refresh every 5 seconds to keep data current
  });

  const workers = workersData?.data || [];
  const allEntries = timeEntries || [];

  // Find active entry for selected worker
  const activeEntry = allEntries.find(
    (entry) => entry.worker_id === selectedWorkerId && !entry.clock_out
  );

  // Update elapsed time every second
  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime('00:00');
      return;
    }

    const updateElapsedTime = () => {
      const hours = calculatePreciseHours(activeEntry.clock_in, new Date());
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      setElapsedTime(
        `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      );
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: (data: ClockInData) => api.post<TimeEntry>('/time-entries/clock-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setTaskType('');
    },
    onError: (error: Error) => {
      alert(`Clock in failed: ${error.message}`);
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClockOutData }) =>
      api.post<TimeEntry>(`/time-entries/${id}/clock-out`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setBreakMinutes(0);
    },
    onError: (error: Error) => {
      alert(`Clock out failed: ${error.message}`);
    },
  });

  const handleClockIn = () => {
    if (!selectedWorkerId) {
      alert('Please select a worker');
      return;
    }
    if (!taskType) {
      alert('Please enter a task type');
      return;
    }

    clockInMutation.mutate({
      worker_id: selectedWorkerId,
      task_type: taskType,
    });
  };

  const handleClockOut = () => {
    if (!activeEntry) return;

    clockOutMutation.mutate({
      id: activeEntry.id,
      data: {
        break_minutes: breakMinutes,
      },
    });
  };

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500 p-3 rounded-lg">
          <Clock className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Time Clock</h2>
          <p className="text-sm text-gray-600">Quick clock in/out for workers</p>
        </div>
      </div>

      {/* Worker Selector */}
      <div className="mb-4">
        <label htmlFor="worker-select" className="block text-sm font-medium text-gray-700 mb-2">
          Worker
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            id="worker-select"
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!!activeEntry}
          >
            <option value="">Select a worker...</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.first_name} {worker.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Time Entry Display */}
      {activeEntry ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">
                {selectedWorker?.first_name} {selectedWorker?.last_name}
              </p>
              <p className="text-sm text-gray-600 mt-1">{activeEntry.task_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Clocked In</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Clock In Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatTime(activeEntry.clock_in, 'h:mm a')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Elapsed Time</p>
              <p className="text-2xl font-bold text-blue-600">{elapsedTime}</p>
            </div>
          </div>

          {/* Break Minutes Input */}
          <div className="mb-4">
            <label htmlFor="break-minutes" className="block text-sm font-medium text-gray-700 mb-2">
              Break Time (minutes)
            </label>
            <input
              id="break-minutes"
              type="number"
              min="0"
              step="15"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Clock Out Button */}
          <button
            onClick={handleClockOut}
            disabled={clockOutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
          >
            <Square size={18} />
            {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
          </button>
        </div>
      ) : (
        <>
          {/* Task Type Input (only show when no active entry) */}
          {selectedWorkerId && (
            <div className="mb-4">
              <label htmlFor="task-type" className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <input
                id="task-type"
                type="text"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Harvesting, Planting, Weeding"
              />
            </div>
          )}

          {/* Clock In Button */}
          {selectedWorkerId && (
            <button
              onClick={handleClockIn}
              disabled={clockInMutation.isPending || !taskType}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
            >
              <Play size={18} />
              {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
