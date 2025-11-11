import { useState, useEffect, useCallback } from 'react';
import { Clock, Coffee, Moon, AlertTriangle, Square } from 'lucide-react';
import { formatHoursAsTime } from '@farm-commons/shared';
import { format, differenceInSeconds } from 'date-fns';

export type BreakType = 'lunch' | 'rest' | 'restroom';

export interface Break {
  id: string;
  type: BreakType;
  start: Date;
  end: Date | null;
  durationMinutes: number;
}

interface BreakTimerProps {
  timeEntryId: string;
  workerId: string;
  onBreakComplete?: (break_: Break) => void;
  existingBreaks?: Break[];
  minLunchBreakMinutes?: number;
  minRestBreakMinutes?: number;
  workHoursForLunchRequirement?: number;
}

const BREAK_TYPE_CONFIG = {
  lunch: {
    label: 'Lunch Break',
    icon: Coffee,
    color: 'blue',
    minMinutes: 30,
    description: 'Meal break (unpaid)',
  },
  rest: {
    label: 'Rest Break',
    icon: Moon,
    color: 'purple',
    minMinutes: 10,
    description: 'Rest period (paid)',
  },
  restroom: {
    label: 'Restroom',
    icon: Clock,
    color: 'gray',
    minMinutes: 0,
    description: 'Quick break',
  },
} as const;

// Format elapsed time
function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function BreakTimer({
  timeEntryId,
  workerId: _workerId,
  onBreakComplete,
  existingBreaks = [],
  minLunchBreakMinutes = 30,
  minRestBreakMinutes = 10,
  workHoursForLunchRequirement = 6,
}: BreakTimerProps) {
  const [activeBreak, setActiveBreak] = useState<{
    type: BreakType;
    start: Date;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breaks, setBreaks] = useState<Break[]>(existingBreaks);

  // Timer effect
  useEffect(() => {
    if (!activeBreak) {
      setElapsedSeconds(0);
      return;
    }

    const interval = globalThis.setInterval(() => {
      setElapsedSeconds(differenceInSeconds(new Date(), activeBreak.start));
    }, 1000);

    return () => globalThis.clearInterval(interval);
  }, [activeBreak]);

  const startBreak = useCallback((type: BreakType) => {
    setActiveBreak({
      type,
      start: new Date(),
    });
  }, []);

  const stopBreak = useCallback(() => {
    if (!activeBreak) return;

    const completedBreak: Break = {
      id: `${timeEntryId}-break-${Date.now()}`,
      type: activeBreak.type,
      start: activeBreak.start,
      end: new Date(),
      durationMinutes: Math.round(elapsedSeconds / 60),
    };

    setBreaks((prev) => [...prev, completedBreak]);
    setActiveBreak(null);
    setElapsedSeconds(0);

    if (onBreakComplete) {
      onBreakComplete(completedBreak);
    }
  }, [activeBreak, elapsedSeconds, timeEntryId, onBreakComplete]);

  // Calculate total break time
  const totalBreakMinutes = breaks.reduce((sum, b) => sum + b.durationMinutes, 0);

  // Calculate break time by type
  const lunchBreakMinutes = breaks
    .filter((b) => b.type === 'lunch')
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  const restBreakMinutes = breaks
    .filter((b) => b.type === 'rest')
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  // Compliance checks
  const needsLunchBreak =
    workHoursForLunchRequirement > 0 && lunchBreakMinutes < minLunchBreakMinutes;
  const needsRestBreak = restBreakMinutes < minRestBreakMinutes;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock size={20} />
          Break Time Tracking
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Total break time: {formatHoursAsTime(totalBreakMinutes / 60)}
        </p>
      </div>

      <div className="p-6">
        {/* Active Break Timer */}
        {activeBreak && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = BREAK_TYPE_CONFIG[activeBreak.type].icon;
                  return <Icon className="text-blue-600" size={20} />;
                })()}
                <div>
                  <p className="font-semibold text-gray-900">
                    {BREAK_TYPE_CONFIG[activeBreak.type].label}
                  </p>
                  <p className="text-sm text-gray-600">
                    Started at {format(activeBreak.start, 'h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-700">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-3xl font-mono font-bold text-blue-700">
                {formatElapsed(elapsedSeconds)}
              </div>
              <button
                onClick={stopBreak}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Square size={16} />
                End Break
              </button>
            </div>
          </div>
        )}

        {/* Compliance Warnings */}
        {!activeBreak && (needsLunchBreak || needsRestBreak) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-yellow-900 mb-2">Break Requirements</p>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {needsLunchBreak && (
                    <li>
                      • Lunch break required: Minimum {minLunchBreakMinutes} minutes for shifts over{' '}
                      {workHoursForLunchRequirement} hours ({lunchBreakMinutes} minutes taken)
                    </li>
                  )}
                  {needsRestBreak && (
                    <li>
                      • Rest break recommended: Minimum {minRestBreakMinutes} minutes (
                      {restBreakMinutes} minutes taken)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Break Type Buttons */}
        {!activeBreak && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Start a break:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(BREAK_TYPE_CONFIG) as BreakType[]).map((type) => {
                const config = BREAK_TYPE_CONFIG[type];
                const Icon = config.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
                  purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
                  gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700',
                };

                return (
                  <button
                    key={type}
                    onClick={() => startBreak(type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      colorClasses[config.color]
                    }`}
                  >
                    <Icon size={24} />
                    <div className="text-center">
                      <p className="font-semibold">{config.label}</p>
                      <p className="text-xs mt-1 opacity-75">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Break History */}
        {breaks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Break History</h4>
            <div className="space-y-2">
              {breaks.map((break_) => {
                const config = BREAK_TYPE_CONFIG[break_.type];
                const Icon = config.icon;
                const bgColors = {
                  blue: 'bg-blue-100',
                  purple: 'bg-purple-100',
                  gray: 'bg-gray-100',
                };
                const textColors = {
                  blue: 'text-blue-700',
                  purple: 'text-purple-700',
                  gray: 'text-gray-700',
                };

                return (
                  <div
                    key={break_.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${bgColors[config.color]}`}>
                        <Icon className={textColors[config.color]} size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{config.label}</p>
                        <p className="text-xs text-gray-600">
                          {format(break_.start, 'h:mm a')} -{' '}
                          {break_.end ? format(break_.end, 'h:mm a') : 'In progress'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {break_.durationMinutes} min
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {breaks.length === 0 && !activeBreak && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto mb-3 opacity-50" size={48} />
            <p className="text-sm">No breaks recorded yet</p>
            <p className="text-xs mt-1">Start a break to begin tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
