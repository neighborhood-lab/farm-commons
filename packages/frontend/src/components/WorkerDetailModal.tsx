import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit,
  AlertCircle,
  MapPin,
  Award,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, getInitials, formatCurrency } from '@farm-commons/shared';
import type {
  Worker,
  TimeEntry,
  Schedule,
  Certification,
  PaginatedResponse,
} from '@farm-commons/shared';

interface WorkerDetailModalProps {
  worker: Worker;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (worker: Worker) => void;
}

export default function WorkerDetailModal({
  worker,
  isOpen,
  onClose,
  onEdit,
}: WorkerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'time-entries' | 'schedules' | 'certifications'
  >('overview');

  // Fetch time entries for this worker
  const { data: timeEntriesData } = useQuery({
    queryKey: ['time-entries', worker.id],
    queryFn: () =>
      api.get<PaginatedResponse<TimeEntry>>(
        `/time-entries?worker_id=${worker.id}&limit=10`
      ),
    enabled: isOpen,
  });

  // Fetch upcoming schedules for this worker
  const { data: schedulesData } = useQuery({
    queryKey: ['schedules', worker.id],
    queryFn: () =>
      api.get<PaginatedResponse<Schedule>>(
        `/schedules?worker_id=${worker.id}&status=scheduled&limit=10`
      ),
    enabled: isOpen,
  });

  // Fetch certifications for this worker
  const { data: certificationsData } = useQuery({
    queryKey: ['certifications', worker.id],
    queryFn: () =>
      api.get<Certification[]>(`/certifications/worker/${worker.id}`),
    enabled: isOpen,
  });

  const timeEntries = timeEntriesData?.data || [];
  const schedules = schedulesData?.data || [];
  const certifications = certificationsData || [];

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-earth-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-earth-500 rounded-full flex items-center justify-center text-2xl font-bold">
                    {getInitials(worker.first_name, worker.last_name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {worker.first_name} {worker.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          worker.status === 'active'
                            ? 'bg-green-500/20 text-green-100'
                            : worker.status === 'seasonal'
                            ? 'bg-blue-500/20 text-blue-100'
                            : 'bg-gray-500/20 text-gray-100'
                        }`}
                      >
                        {worker.status}
                      </span>
                      <span className="text-earth-200 text-sm">
                        Hired: {formatDate(worker.hire_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(worker)}
                    className="p-2 rounded-lg hover:bg-earth-600 transition-colors"
                    title="Edit worker"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-earth-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'time-entries', label: 'Time Entries' },
                  { id: 'schedules', label: 'Schedules' },
                  { id: 'certifications', label: 'Certifications' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-earth-700 text-earth-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium">{worker.phone}</p>
                        </div>
                      </div>
                      {worker.email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail size={18} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="font-medium">{worker.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Language</p>
                          <p className="font-medium capitalize">
                            {worker.preferred_language}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {worker.emergency_contact_name && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <AlertCircle size={18} className="text-red-400" />
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="font-medium">
                              {worker.emergency_contact_name}
                            </p>
                          </div>
                        </div>
                        {worker.emergency_contact_phone && (
                          <div className="flex items-center gap-3 text-gray-700">
                            <Phone size={18} className="text-red-400" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="font-medium">
                                {worker.emergency_contact_phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compensation */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Compensation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worker.hourly_rate && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <DollarSign size={18} className="text-green-400" />
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="font-medium">
                              {formatCurrency(worker.hourly_rate)}/hour
                            </p>
                          </div>
                        </div>
                      )}
                      {worker.piece_rate && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Briefcase size={18} className="text-green-400" />
                          <div>
                            <p className="text-xs text-gray-500">Piece Rate</p>
                            <p className="font-medium">
                              {formatCurrency(worker.piece_rate)}/unit
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Skills
                    </h3>
                    {worker.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {worker.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 bg-sage-100 text-sage-700 text-sm rounded-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No skills listed</p>
                    )}
                  </div>

                  {/* Notes */}
                  {worker.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Notes
                      </h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {worker.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'time-entries' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Time Entries
                  </h3>
                  {timeEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clock In
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clock Out
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timeEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(entry.clock_in)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {entry.task_type}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(entry.clock_in).toLocaleTimeString(
                                  'en-US',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {entry.clock_out
                                  ? new Date(entry.clock_out).toLocaleTimeString(
                                      'en-US',
                                      {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {entry.total_hours
                                  ? `${entry.total_hours.toFixed(2)}h`
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {entry.verified_by ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Clock className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600">No time entries found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schedules' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Upcoming Schedules
                  </h3>
                  {schedules.length > 0 ? (
                    <div className="space-y-3">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-earth-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar
                                  size={16}
                                  className="text-earth-600"
                                />
                                <span className="font-medium text-gray-900">
                                  {formatDate(schedule.scheduled_date)}
                                </span>
                                <span className="text-gray-500">
                                  {schedule.start_time} - {schedule.end_time}
                                </span>
                              </div>
                              <p className="text-gray-900 font-medium">
                                {schedule.task_type}
                              </p>
                              {schedule.task_description && (
                                <p className="text-gray-600 text-sm mt-1">
                                  {schedule.task_description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                schedule.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : schedule.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : schedule.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {schedule.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar
                        className="mx-auto text-gray-400 mb-3"
                        size={48}
                      />
                      <p className="text-gray-600">No upcoming schedules</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'certifications' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Certifications
                  </h3>
                  {certifications.length > 0 ? (
                    <div className="space-y-3">
                      {certifications.map((cert) => {
                        const isExpiring =
                          cert.expiration_date &&
                          new Date(cert.expiration_date) <
                            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                        const isExpired =
                          cert.expiration_date &&
                          new Date(cert.expiration_date) < new Date();

                        return (
                          <div
                            key={cert.id}
                            className={`p-4 border rounded-lg ${
                              isExpired
                                ? 'border-red-300 bg-red-50'
                                : isExpiring
                                ? 'border-yellow-300 bg-yellow-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Award
                                  size={20}
                                  className={`mt-0.5 ${
                                    isExpired
                                      ? 'text-red-500'
                                      : isExpiring
                                      ? 'text-yellow-500'
                                      : 'text-earth-600'
                                  }`}
                                />
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {cert.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {cert.issuing_organization}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>
                                      Issued: {formatDate(cert.issue_date)}
                                    </span>
                                    {cert.expiration_date && (
                                      <span
                                        className={
                                          isExpired
                                            ? 'text-red-600 font-medium'
                                            : isExpiring
                                            ? 'text-yellow-600 font-medium'
                                            : ''
                                        }
                                      >
                                        Expires:{' '}
                                        {formatDate(cert.expiration_date)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {cert.verified ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                    Unverified
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                    Expired
                                  </span>
                                )}
                                {isExpiring && !isExpired && (
                                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Award className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-600">No certifications found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
