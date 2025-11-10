import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Clock, User, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { createScheduleSchema, updateScheduleSchema } from '@farm-commons/shared';
import type { Worker, Field, Schedule, PaginatedResponse } from '@farm-commons/shared';

// Common farm task types
const COMMON_TASK_TYPES = [
  'Planting',
  'Harvesting',
  'Weeding',
  'Watering/Irrigation',
  'Pruning',
  'Pest Control',
  'Fertilizing',
  'Soil Preparation',
  'Equipment Maintenance',
  'Field Maintenance',
  'Packing/Processing',
  'General Labor',
  'Other',
];

// Form data type based on create/update schema
type ScheduleFormData = z.infer<typeof createScheduleSchema>;

interface ScheduleFormProps {
  schedule?: Schedule;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function ScheduleForm({
  schedule,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ScheduleFormProps) {
  const isEditMode = !!schedule;

  // Fetch workers for selector
  const { data: workersData, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get<PaginatedResponse<Worker>>('/workers'),
  });

  // Fetch fields for selector
  const { data: fieldsData, isLoading: isLoadingFields } = useQuery({
    queryKey: ['fields'],
    queryFn: () => api.get<PaginatedResponse<Field>>('/fields'),
  });

  const workers = workersData?.data || [];
  const fields = fieldsData?.data || [];

  // Setup form with validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(isEditMode ? updateScheduleSchema : createScheduleSchema),
    defaultValues: schedule
      ? {
          worker_id: schedule.worker_id,
          field_id: schedule.field_id,
          scheduled_date: format(new Date(schedule.scheduled_date), 'yyyy-MM-dd'),
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          task_type: schedule.task_type,
          task_description: schedule.task_description || '',
          notes: schedule.notes || '',
        }
      : {
          scheduled_date: format(new Date(), 'yyyy-MM-dd'),
          start_time: '08:00',
          end_time: '17:00',
        },
  });

  const taskType = watch('task_type');

  // Set default values for new schedule
  useEffect(() => {
    if (!isEditMode && workers.length > 0 && !watch('worker_id')) {
      setValue('worker_id', workers[0].id);
    }
  }, [isEditMode, workers, setValue, watch]);

  const handleFormSubmit = async (data: ScheduleFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Worker Selection */}
      <div>
        <label
          htmlFor="worker_id"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <User size={16} />
          Worker *
        </label>
        <select
          id="worker_id"
          {...register('worker_id')}
          disabled={isLoadingWorkers || isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.worker_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a worker...</option>
          {workers
            .filter((w) => w.status === 'active')
            .map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.first_name} {worker.last_name}
              </option>
            ))}
        </select>
        {errors.worker_id && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.worker_id.message}
          </p>
        )}
      </div>

      {/* Field Selection (Optional) */}
      <div>
        <label
          htmlFor="field_id"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <MapPin size={16} />
          Field
        </label>
        <select
          id="field_id"
          {...register('field_id')}
          disabled={isLoadingFields || isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.field_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">No specific field</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name} ({field.size_acres} acres)
              {field.current_crop && ` - ${field.current_crop}`}
            </option>
          ))}
        </select>
        {errors.field_id && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.field_id.message}
          </p>
        )}
      </div>

      {/* Date Picker */}
      <div>
        <label
          htmlFor="scheduled_date"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <Calendar size={16} />
          Date *
        </label>
        <input
          id="scheduled_date"
          type="date"
          {...register('scheduled_date')}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.scheduled_date && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.scheduled_date.message}
          </p>
        )}
      </div>

      {/* Time Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="start_time"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <Clock size={16} />
            Start Time *
          </label>
          <input
            id="start_time"
            type="time"
            {...register('start_time')}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
              errors.start_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.start_time.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_time"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <Clock size={16} />
            End Time *
          </label>
          <input
            id="end_time"
            type="time"
            {...register('end_time')}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
              errors.end_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.end_time.message}
            </p>
          )}
        </div>
      </div>

      {/* Task Type Dropdown */}
      <div>
        <label
          htmlFor="task_type"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <Briefcase size={16} />
          Task Type *
        </label>
        <select
          id="task_type"
          {...register('task_type')}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.task_type ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select task type...</option>
          {COMMON_TASK_TYPES.map((taskType) => (
            <option key={taskType} value={taskType}>
              {taskType}
            </option>
          ))}
        </select>
        {errors.task_type && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.task_type.message}
          </p>
        )}
      </div>

      {/* Task Description (Optional) */}
      <div>
        <label
          htmlFor="task_description"
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Task Description
        </label>
        <textarea
          id="task_description"
          {...register('task_description')}
          disabled={isSubmitting}
          rows={3}
          placeholder="Provide additional details about the task..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.task_description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.task_description && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.task_description.message}
          </p>
        )}
      </div>

      {/* Notes (Optional) */}
      <div>
        <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          disabled={isSubmitting}
          rows={2}
          placeholder="Any additional notes..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-earth-500 ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Future Feature Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Coming soon:</strong> Repeating schedule functionality will allow you to
          create recurring shifts (daily, weekly, etc.)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-earth-700 text-white rounded-lg hover:bg-earth-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving...'
            : isEditMode
            ? 'Update Schedule'
            : 'Create Schedule'}
        </button>
      </div>
    </form>
  );
}
