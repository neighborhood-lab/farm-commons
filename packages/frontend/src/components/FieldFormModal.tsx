import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createFieldSchema } from '@farm-commons/shared';
import { api } from '../lib/api';
import type { Field } from '@farm-commons/shared';
import type { z } from 'zod';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet Icon default setup
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type FieldFormData = z.infer<typeof createFieldSchema>;

interface FieldFormModalProps {
  field?: Field | null;
  onClose: () => void;
}

function LocationPicker({
  location,
  onLocationChange,
}: {
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return location ? <Marker position={[location.lat, location.lng]} /> : null;
}

export default function FieldFormModal({ field, onClose }: FieldFormModalProps) {
  const isEditing = !!field;
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(field?.location_gps || null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FieldFormData>({
    resolver: zodResolver(createFieldSchema),
    defaultValues: field
      ? {
          name: field.name,
          size_acres: field.size_acres,
          location_gps: field.location_gps,
          current_crop: field.current_crop,
          soil_type: field.soil_type,
          notes: field.notes,
        }
      : {
          location_gps: null,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FieldFormData) => api.post('/fields', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FieldFormData) => api.put(`/fields/${field?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      onClose();
    },
  });

  useEffect(() => {
    if (selectedLocation) {
      setValue('location_gps', selectedLocation);
    }
  }, [selectedLocation, setValue]);

  const onSubmit = async (data: FieldFormData) => {
    await (isEditing ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data));
  };

  const mapCenter = selectedLocation || { lat: 39.8283, lng: -98.5795 }; // Default to center of US

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Field' : 'Add New Field'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Name *</label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                placeholder="North Field"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size (acres) *</label>
              <input
                {...register('size_acres', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                placeholder="5.5"
              />
              {errors.size_acres && (
                <p className="mt-1 text-sm text-red-600">{errors.size_acres.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Crop</label>
              <input
                {...register('current_crop')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                placeholder="Tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
              <input
                {...register('soil_type')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
                placeholder="Sandy loam"
              />
            </div>
          </div>

          {/* GPS Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              GPS Location
            </label>
            <p className="text-sm text-gray-600 mb-2">Click on the map to set the field location</p>
            {selectedLocation && (
              <p className="text-sm text-gray-700 mb-2">
                Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            )}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={13}
                style={{ height: '300px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  location={selectedLocation}
                  onLocationChange={setSelectedLocation}
                />
              </MapContainer>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-earth-500 focus:border-transparent"
              placeholder="Additional notes about this field..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-earth-700 text-white rounded-lg hover:bg-earth-800 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                  ? 'Update Field'
                  : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
