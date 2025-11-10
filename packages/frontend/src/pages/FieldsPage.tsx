import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Maximize, Trash2, Edit2, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import type { Field, PaginatedResponse } from '@farm-commons/shared';
import FieldMap from '../components/FieldMap';
import FieldFormModal from '../components/FieldFormModal';
import FieldDetailModal from '../components/FieldDetailModal';

export default function FieldsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fields'],
    queryFn: () => api.get<PaginatedResponse<Field>>('/fields'),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });

  const fields = data?.data || [];

  const handleCreateField = () => {
    setSelectedField(null);
    setIsFormOpen(true);
  };

  const handleEditField = (field: Field) => {
    setSelectedField(field);
    setIsFormOpen(true);
  };

  const handleViewField = (field: Field) => {
    setSelectedField(field);
    setIsDetailOpen(true);
  };

  const handleDeleteField = async (id: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      await deleteFieldMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading fields...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fields</h1>
          <p className="text-gray-600 mt-2">
            Manage your farm fields - {fields.length} total
          </p>
        </div>
        <button
          onClick={handleCreateField}
          className="flex items-center gap-2 bg-earth-700 text-white px-6 py-3 rounded-lg hover:bg-earth-800 transition-colors"
        >
          <Plus size={20} />
          Add Field
        </button>
      </div>

      {/* Map View */}
      {fields.some((f) => f.location_gps) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Field Locations</h2>
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <FieldMap fields={fields} onFieldClick={handleViewField} />
          </div>
        </div>
      )}

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div
            key={field.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewField(field)}
          >
            {/* Field Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <Maximize size={14} className="inline mr-1" />
                  {field.size_acres} acres
                </p>
              </div>
            </div>

            {/* Current Crop */}
            {field.current_crop && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  {field.current_crop}
                </span>
              </div>
            )}

            {/* Location Info */}
            <div className="space-y-2 text-sm">
              {field.location_gps && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  <span>
                    {field.location_gps.lat.toFixed(4)}, {field.location_gps.lng.toFixed(4)}
                  </span>
                </div>
              )}
              {field.soil_type && (
                <div className="text-gray-600">
                  <span className="font-medium">Soil:</span> {field.soil_type}
                </div>
              )}
            </div>

            {/* Notes Preview */}
            {field.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 line-clamp-2">{field.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditField(field);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteField(field.id);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {fields.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No fields yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first field</p>
          <button
            onClick={handleCreateField}
            className="inline-flex items-center gap-2 bg-earth-700 text-white px-6 py-3 rounded-lg hover:bg-earth-800 transition-colors"
          >
            <Plus size={20} />
            Add Field
          </button>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <FieldFormModal
          field={selectedField}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedField(null);
          }}
        />
      )}

      {isDetailOpen && selectedField && (
        <FieldDetailModal
          field={selectedField}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedField(null);
          }}
          onEdit={() => {
            setIsDetailOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
