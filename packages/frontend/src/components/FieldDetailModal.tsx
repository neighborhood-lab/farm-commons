import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Maximize, Edit2, Calendar, User, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '@farm-commons/shared';
import type { Field, Schedule } from '@farm-commons/shared';
import FieldMap from './FieldMap';

interface FieldDetailModalProps {
  field: Field;
  onClose: () => void;
  onEdit: () => void;
}

interface FieldWithHistory {
  field: Field;
  crop_history: Array<{
    task_type: string;
    scheduled_date: Date;
  }>;
}

interface ScheduleWithWorker extends Schedule {
  worker_first_name: string;
  worker_last_name: string;
}

export default function FieldDetailModal({ field, onClose, onEdit }: FieldDetailModalProps) {
  // Fetch crop history
  const { data: historyData } = useQuery({
    queryKey: ['field-history', field.id],
    queryFn: () => api.get<FieldWithHistory>(`/fields/${field.id}/crop-history`),
  });

  // Fetch schedules for this field
  const { data: schedulesData } = useQuery({
    queryKey: ['field-schedules', field.id],
    queryFn: () => api.get<ScheduleWithWorker[]>(`/fields/${field.id}/schedules`),
  });

  const schedules = schedulesData || [];
  const cropHistory = historyData?.crop_history || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{field.name}</h2>
            <p className="text-gray-600 mt-1">
              <Maximize size={16} className="inline mr-1" />
              {field.size_acres} acres
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-earth-700 bg-earth-100 rounded-lg hover:bg-earth-200 transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Field Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Crop</h3>
              {field.current_crop ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  {field.current_crop}
                </span>
              ) : (
                <p className="text-gray-400">No crop planted</p>
              )}
            </div>

            {field.soil_type && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Soil Type</h3>
                <p className="text-gray-900">{field.soil_type}</p>
              </div>
            )}

            {field.location_gps && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">GPS Coordinates</h3>
                <p className="text-gray-900 flex items-center gap-1">
                  <MapPin size={16} />
                  {field.location_gps.lat.toFixed(6)}, {field.location_gps.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {field.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{field.notes}</p>
            </div>
          )}

          {/* Map */}
          {field.location_gps && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <FieldMap fields={[field]} height="300px" zoom={15} />
              </div>
            </div>
          )}

          {/* Schedules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Scheduled Tasks ({schedules.length})
            </h3>
            {schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules.slice(0, 10).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-earth-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              schedule.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : schedule.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : schedule.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {schedule.status}
                          </span>
                          <h4 className="font-medium text-gray-900">{schedule.task_type}</h4>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Calendar size={14} />
                            {formatDate(schedule.scheduled_date)} • {schedule.start_time} -{' '}
                            {schedule.end_time}
                          </p>
                          <p className="flex items-center gap-2">
                            <User size={14} />
                            {schedule.worker_first_name} {schedule.worker_last_name}
                          </p>
                          {schedule.task_description && (
                            <p className="text-gray-600 mt-2">{schedule.task_description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {schedules.length > 10 && (
                  <p className="text-sm text-gray-600 text-center">
                    Showing 10 of {schedules.length} schedules
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No scheduled tasks for this field</p>
            )}
          </div>

          {/* Crop History */}
          {cropHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={20} />
                Crop History
              </h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {cropHistory.slice(0, 20).map((entry, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <span className="text-gray-900">{entry.task_type}</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(entry.scheduled_date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Created: {formatDate(field.created_at)}</p>
            <p>Last updated: {formatDate(field.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
