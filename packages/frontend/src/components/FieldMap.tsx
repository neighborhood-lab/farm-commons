import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import type { Field } from '@farm-commons/shared';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FieldMapProps {
  fields: Field[];
  selectedFieldId?: string | null;
  onFieldClick?: (field: Field) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

// Crop color mapping for visual distinction
const CROP_COLORS: Record<string, string> = {
  corn: '#FFD700',
  wheat: '#F4E4C1',
  soybeans: '#90EE90',
  tomatoes: '#FF6347',
  lettuce: '#98FB98',
  carrots: '#FF8C00',
  potatoes: '#DEB887',
  peppers: '#DC143C',
  cucumbers: '#006400',
  beans: '#32CD32',
  squash: '#FFB347',
  pumpkins: '#FF8200',
  default: '#4A90E2',
};

// Get color for a crop type
function getCropColor(crop: string | null): string {
  if (!crop) return CROP_COLORS.default;
  const normalizedCrop = crop.toLowerCase().trim();
  return CROP_COLORS[normalizedCrop] || CROP_COLORS.default;
}

// Component to auto-fit map bounds to fields
function MapBoundsSetter({ fields }: { fields: Field[] }) {
  const map = useMap();

  useEffect(() => {
    if (fields.length === 0) return;

    const bounds: LatLngExpression[] = [];

    for (const field of fields) {
      if (field.boundary_gps && field.boundary_gps.length > 0) {
        for (const point of field.boundary_gps) {
          bounds.push([point.lat, point.lng]);
        }
      } else if (field.location_gps) {
        bounds.push([field.location_gps.lat, field.location_gps.lng]);
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds as LatLngBoundsExpression, { padding: [50, 50] });
    }
  }, [fields, map]);

  return null;
}

export default function FieldMap({
  fields,
  selectedFieldId,
  onFieldClick,
  center = [40.7128, -74.006], // Default to NYC coordinates
  zoom = 13,
  height = '600px',
  className = '',
}: FieldMapProps) {
  // Calculate center based on fields if not provided and fields exist
  const mapCenter = useMemo<[number, number]>(() => {
    if (fields.length === 0) return center;

    const validPoints: [number, number][] = [];
    for (const field of fields) {
      if (field.location_gps) {
        validPoints.push([field.location_gps.lat, field.location_gps.lng]);
      } else if (field.boundary_gps && field.boundary_gps.length > 0) {
        const firstPoint = field.boundary_gps[0];
        validPoints.push([firstPoint.lat, firstPoint.lng]);
      }
    }

    if (validPoints.length === 0) return center;

    // Calculate average center
    const avgLat = validPoints.reduce((sum, p) => sum + p[0], 0) / validPoints.length;
    const avgLng = validPoints.reduce((sum, p) => sum + p[1], 0) / validPoints.length;

    return [avgLat, avgLng];
  }, [fields, center]);

  return (
    <div className={`field-map-container ${className}`} style={{ height, width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsSetter fields={fields} />

        {fields.map((field) => {
          const color = getCropColor(field.current_crop);
          const isSelected = selectedFieldId === field.id;

          // Render polygon if boundary exists
          if (field.boundary_gps && field.boundary_gps.length > 2) {
            const positions: LatLngExpression[] = field.boundary_gps.map((point) => [
              point.lat,
              point.lng,
            ]);

            return (
              <Polygon
                key={field.id}
                positions={positions}
                pathOptions={{
                  color: isSelected ? '#FF0000' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.5 : 0.3,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onFieldClick) {
                      onFieldClick(field);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="field-popup">
                    <h3 className="font-bold text-lg">{field.name}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Size:</span> {field.size_acres} acres
                      </p>
                      {field.current_crop && (
                        <p>
                          <span className="font-semibold">Crop:</span> {field.current_crop}
                        </p>
                      )}
                      {field.soil_type && (
                        <p>
                          <span className="font-semibold">Soil:</span> {field.soil_type}
                        </p>
                      )}
                      {field.notes && <p className="mt-2 text-gray-600">{field.notes}</p>}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          }

          // Fallback to marker if only center point exists
          if (field.location_gps) {
            return (
              <Marker
                key={field.id}
                position={[field.location_gps.lat, field.location_gps.lng]}
                eventHandlers={{
                  click: () => {
                    if (onFieldClick) {
                      onFieldClick(field);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="field-popup">
                    <h3 className="font-bold text-lg">{field.name}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Size:</span> {field.size_acres} acres
                      </p>
                      {field.current_crop && (
                        <p>
                          <span className="font-semibold">Crop:</span> {field.current_crop}
                        </p>
                      )}
                      {field.soil_type && (
                        <p>
                          <span className="font-semibold">Soil:</span> {field.soil_type}
                        </p>
                      )}
                      {field.notes && <p className="mt-2 text-gray-600">{field.notes}</p>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }

          return null;
        })}
      </MapContainer>
    </div>
  );
}

// Legend component to show crop colors
export function FieldMapLegend({ fields }: { fields: Field[] }) {
  const cropColors = useMemo(() => {
    const uniqueCrops = new Set<string>();
    for (const field of fields) {
      if (field.current_crop) {
        uniqueCrops.add(field.current_crop);
      }
    }

    return [...uniqueCrops].map((crop) => ({
      crop,
      color: getCropColor(crop),
    }));
  }, [fields]);

  if (cropColors.length === 0) return null;

  return (
    <div className="field-map-legend bg-white p-4 rounded-lg shadow-md">
      <h4 className="font-semibold text-sm mb-3">Current Crops</h4>
      <div className="space-y-2">
        {cropColors.map(({ crop, color }) => (
          <div key={crop} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm capitalize">{crop}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
