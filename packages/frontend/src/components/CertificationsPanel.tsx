import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '@farm-commons/shared';
import type { Certification } from '@farm-commons/shared';

interface CertificationsPanelProps {
  workerId: string;
}

// Note: getDaysUntilExpiry function removed - getExpiryStatus is used instead

export default function CertificationsPanel({ workerId }: CertificationsPanelProps) {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    document_url: '',
    verified: false,
  });

  // Fetch certifications for the worker
  const { data: certifications, isLoading } = useQuery({
    queryKey: ['certifications', workerId],
    queryFn: () => api.get<Certification[]>(`/certifications/worker/${workerId}`),
  });

  // Create certification mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Certification, 'id' | 'created_at' | 'updated_at'>) =>
      api.post('/certifications', { ...data, worker_id: workerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', workerId] });
      resetForm();
    },
  });

  // Update certification mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Certification, 'id' | 'created_at' | 'updated_at'>>;
    }) => api.put(`/certifications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', workerId] });
      resetForm();
    },
  });

  // Delete certification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', workerId] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiration_date: '',
      document_url: '',
      verified: false,
    });
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert form data with string dates to Certification format with Date objects
    const certData = {
      ...formData,
      worker_id: workerId,
      issue_date: new Date(formData.issue_date),
      expiration_date: formData.expiration_date ? new Date(formData.expiration_date) : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: certData });
    } else {
      createMutation.mutate(certData);
    }
  };

  const handleEdit = (cert: Certification) => {
    setFormData({
      name: cert.name,
      issuing_organization: cert.issuing_organization,
      issue_date: formatDate(cert.issue_date),
      expiration_date: cert.expiration_date ? formatDate(cert.expiration_date) : '',
      document_url: cert.document_url || '',
      verified: cert.verified,
    });
    setEditingId(cert.id);
    setIsAddingNew(true);
  };

  const handleDelete = (id: string) => {
    if (globalThis.confirm('Are you sure you want to delete this certification?')) {
      deleteMutation.mutate(id);
    }
  };

  // Get expiry status and styling
  const getExpiryStatus = (expirationDate: Date | string | null) => {
    if (!expirationDate) {
      return { text: 'No expiration', color: 'text-gray-600', bg: 'bg-gray-100', icon: null };
    }

    // Calculate days until expiration
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <XCircle size={16} className="text-red-600" />,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <AlertTriangle size={16} className="text-red-600" />,
      };
    } else if (daysUntilExpiry <= 60) {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: 'text-orange-700',
        bg: 'bg-orange-100',
        icon: <AlertTriangle size={16} className="text-orange-600" />,
      };
    } else if (daysUntilExpiry <= 90) {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: <Clock size={16} className="text-yellow-600" />,
      };
    } else {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: null,
      };
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading certifications...</div>;
  }

  const certs = certifications || [];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-earth-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
              <p className="text-sm text-gray-600">
                {certs.length} certification{certs.length === 1 ? '' : 's'} on file
              </p>
            </div>
          </div>
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 bg-earth-700 text-white px-4 py-2 rounded-lg hover:bg-earth-800 transition-colors"
            >
              <Plus size={20} />
              Add Certification
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Certification' : 'Add New Certification'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                  placeholder="e.g., Pesticide Applicator License"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.issuing_organization}
                  onChange={(e) =>
                    setFormData({ ...formData, issuing_organization: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                  placeholder="e.g., State Department of Agriculture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
                <input
                  type="url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4 text-earth-600 border-gray-300 rounded focus:ring-earth-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Verified</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-earth-700 text-white rounded-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
              >
                {editingId ? 'Update' : 'Add'} Certification
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certifications List */}
      <div className="p-6">
        {certs.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No certifications on file</p>
            <p className="text-sm text-gray-500 mt-1">
              Add certifications to track worker qualifications and expiry dates
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {certs.map((cert) => {
              const expiryStatus = getExpiryStatus(cert.expiration_date);

              return (
                <div
                  key={cert.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Certification Name and Verification Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                        {cert.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <CheckCircle size={14} />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            <Clock size={14} />
                            Pending Verification
                          </span>
                        )}
                      </div>

                      {/* Organization */}
                      <p className="text-sm text-gray-600 mb-3">
                        Issued by: {cert.issuing_organization}
                      </p>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Issued: </span>
                          <span className="text-gray-900 font-medium">
                            {formatDate(cert.issue_date, 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {cert.expiration_date && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Expires: </span>
                            <span className={`font-medium ${expiryStatus.color}`}>
                              {formatDate(cert.expiration_date, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expiry Warning */}
                      {cert.expiration_date && (
                        <div
                          className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${expiryStatus.bg}`}
                        >
                          {expiryStatus.icon}
                          <span className={`text-sm font-medium ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        </div>
                      )}

                      {/* Document Link */}
                      {cert.document_url && (
                        <div className="mt-3">
                          <a
                            href={cert.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-earth-700 hover:text-earth-800 text-sm font-medium"
                          >
                            <Upload size={16} />
                            View Document
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(cert)}
                        className="p-2 text-gray-600 hover:text-earth-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit certification"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cert.id)}
                        className="p-2 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete certification"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
