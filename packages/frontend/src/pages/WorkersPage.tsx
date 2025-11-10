import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Phone, Mail, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, getInitials } from '@farm-commons/shared';
import type { Worker, PaginatedResponse } from '@farm-commons/shared';
import WorkerDetailModal from '../components/WorkerDetailModal';

export default function WorkersPage() {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get<PaginatedResponse<Worker>>('/workers'),
  });

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorker(null);
  };

  const handleEditWorker = (worker: Worker) => {
    // TODO: Implement edit functionality
    console.log('Edit worker:', worker);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading workers...</div>;
  }

  const workers = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-600 mt-2">
            Manage your farm workforce - {workers.length} total
          </p>
        </div>
        <button className="flex items-center gap-2 bg-earth-700 text-white px-6 py-3 rounded-lg hover:bg-earth-800 transition-colors">
          <Plus size={20} />
          Add Worker
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div
            key={worker.id}
            onClick={() => handleWorkerClick(worker)}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Avatar and Name */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-earth-500 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                {getInitials(worker.first_name, worker.last_name)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {worker.first_name} {worker.last_name}
                </h3>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                    worker.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : worker.status === 'seasonal'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {worker.status}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span>{worker.phone}</span>
              </div>
              {worker.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span className="truncate">{worker.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>Hired: {formatDate(worker.hire_date)}</span>
              </div>
            </div>

            {/* Skills */}
            {worker.skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {worker.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-sage-100 text-sage-700 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {worker.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{worker.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {workers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workers yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first farmworker
          </p>
          <button className="inline-flex items-center gap-2 bg-earth-700 text-white px-6 py-3 rounded-lg hover:bg-earth-800 transition-colors">
            <Plus size={20} />
            Add First Worker
          </button>
        </div>
      )}

      {/* Worker Detail Modal */}
      {selectedWorker && (
        <WorkerDetailModal
          worker={selectedWorker}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEdit={handleEditWorker}
        />
      )}
    </div>
  );
}
