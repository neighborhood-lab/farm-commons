import type { WorkerAttendanceData } from '@farm-commons/shared';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

interface WorkerAttendanceHeatmapProps {
  data: WorkerAttendanceData[];
}

// Function to get color based on hours worked
function getHeatmapColor(hours: number, present: boolean) {
  if (!present) return 'bg-gray-100';
  if (hours === 0) return 'bg-red-100';
  if (hours < 4) return 'bg-yellow-200';
  if (hours < 8) return 'bg-green-300';
  return 'bg-green-500';
}

export default function WorkerAttendanceHeatmap({ data }: WorkerAttendanceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    worker: string;
    date: string;
    hours: number;
  } | null>(null);

  // Get all unique dates from the data
  const allDates = data.length > 0 ? data[0].dates.map((d) => d.date).sort() : [];

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Worker Attendance Heatmap</h2>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No attendance data available</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header with dates */}
            <div className="flex mb-2">
              <div className="w-32 flex-shrink-0" /> {/* Space for worker names */}
              {allDates.map((date) => (
                <div key={date} className="w-16 text-xs text-center text-gray-600 flex-shrink-0">
                  {format(parseISO(date), 'MM/dd')}
                </div>
              ))}
            </div>

            {/* Worker rows */}
            {data.map((worker) => (
              <div key={worker.worker_id} className="flex items-center mb-1">
                <div
                  className="w-32 text-sm font-medium text-gray-700 truncate flex-shrink-0"
                  title={worker.worker_name}
                >
                  {worker.worker_name}
                </div>
                {worker.dates.map((dayData, index) => {
                  const colorClass = getHeatmapColor(dayData.hours, dayData.present);
                  return (
                    <div
                      key={index}
                      className={`w-16 h-8 ${colorClass} border border-gray-200 cursor-pointer transition-opacity hover:opacity-75 flex-shrink-0`}
                      onMouseEnter={() =>
                        setHoveredCell({
                          worker: worker.worker_name,
                          date: dayData.date,
                          hours: dayData.hours,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${worker.worker_name} - ${format(parseISO(dayData.date), 'MMM dd')}: ${dayData.hours}h`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200" />
              <span className="text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-gray-200" />
              <span className="text-gray-600">Present, 0h</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 border border-gray-200" />
              <span className="text-gray-600">&lt;4 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 border border-gray-200" />
              <span className="text-gray-600">4-8 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-gray-200" />
              <span className="text-gray-600">8+ hours</span>
            </div>
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm">
                <span className="font-medium">{hoveredCell.worker}</span>
                {' - '}
                {format(parseISO(hoveredCell.date), 'MMMM dd, yyyy')}
                {': '}
                <span className="font-medium">{hoveredCell.hours} hours</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
