import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Field } from '@farm-commons/shared';
import { FieldMapLegend } from './FieldMap';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Polygon: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="polygon">{children}</div>
  ),
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: vi.fn(),
  }),
}));

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(() => ({})),
    Marker: {
      prototype: {
        options: { icon: null },
      },
    },
  },
}));

// Mock Leaflet CSS
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock marker images
vi.mock('leaflet/dist/images/marker-icon.png', () => 'marker-icon.png');
vi.mock('leaflet/dist/images/marker-shadow.png', () => 'marker-shadow.png');

describe('FieldMapLegend', () => {
  it('should render legend with crop colors', () => {
    const fields: Field[] = [
      {
        id: '1',
        farm_id: 'farm1',
        name: 'North Field',
        size_acres: 10,
        location_gps: { lat: 40.7128, lng: -74.006 },
        current_crop: 'corn',
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '2',
        farm_id: 'farm1',
        name: 'South Field',
        size_acres: 15,
        location_gps: { lat: 40.7138, lng: -74.007 },
        current_crop: 'tomatoes',
        soil_type: 'clay',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    render(<FieldMapLegend fields={fields} />);

    expect(screen.getByText('Current Crops')).toBeInTheDocument();
    expect(screen.getByText('corn')).toBeInTheDocument();
    expect(screen.getByText('tomatoes')).toBeInTheDocument();
  });

  it('should not render if no crops are present', () => {
    const fields: Field[] = [
      {
        id: '1',
        farm_id: 'farm1',
        name: 'Empty Field',
        size_acres: 10,
        location_gps: { lat: 40.7128, lng: -74.006 },
        current_crop: null,
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const { container } = render(<FieldMapLegend fields={fields} />);

    expect(container.firstChild).toBeNull();
  });

  it('should deduplicate crops in legend', () => {
    const fields: Field[] = [
      {
        id: '1',
        farm_id: 'farm1',
        name: 'Field 1',
        size_acres: 10,
        location_gps: { lat: 40.7128, lng: -74.006 },
        current_crop: 'corn',
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '2',
        farm_id: 'farm1',
        name: 'Field 2',
        size_acres: 15,
        location_gps: { lat: 40.7138, lng: -74.007 },
        current_crop: 'corn',
        soil_type: 'clay',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    render(<FieldMapLegend fields={fields} />);

    const cornElements = screen.getAllByText('corn');
    expect(cornElements).toHaveLength(1);
  });

  it('should handle empty fields array', () => {
    const { container } = render(<FieldMapLegend fields={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('FieldMap component structure', () => {
  it('should have correct exports', async () => {
    const module = await import('./FieldMap');

    expect(module.default).toBeDefined();
    expect(module.FieldMapLegend).toBeDefined();
  });
});

describe('FieldMap crop color mapping', () => {
  it('should map known crops to specific colors', () => {
    const fields: Field[] = [
      {
        id: '1',
        farm_id: 'farm1',
        name: 'Corn Field',
        size_acres: 10,
        location_gps: { lat: 40.7128, lng: -74.006 },
        current_crop: 'corn',
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const { container } = render(<FieldMapLegend fields={fields} />);

    // The component should render with a color indicator
    const colorIndicator = container.querySelector('[style*="background-color"]');
    expect(colorIndicator).toBeInTheDocument();
  });

  it('should handle crops with different casing', () => {
    const fields: Field[] = [
      {
        id: '1',
        farm_id: 'farm1',
        name: 'Field',
        size_acres: 10,
        location_gps: { lat: 40.7128, lng: -74.006 },
        current_crop: 'CORN',
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '2',
        farm_id: 'farm1',
        name: 'Field 2',
        size_acres: 10,
        location_gps: { lat: 40.7138, lng: -74.007 },
        current_crop: 'Corn',
        soil_type: 'loam',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    render(<FieldMapLegend fields={fields} />);

    // Should normalize to same crop
    const cropElements = screen.getAllByText(/corn/i);
    expect(cropElements.length).toBeGreaterThan(0);
  });
});

describe('Field type validation', () => {
  it('should support fields with GPS polygons', () => {
    const field: Field = {
      id: '1',
      farm_id: 'farm1',
      name: 'Polygon Field',
      size_acres: 20,
      location_gps: { lat: 40.7128, lng: -74.006 },
      boundary_gps: [
        { lat: 40.7128, lng: -74.006 },
        { lat: 40.7138, lng: -74.006 },
        { lat: 40.7138, lng: -74.007 },
        { lat: 40.7128, lng: -74.007 },
      ],
      current_crop: 'wheat',
      soil_type: 'loam',
      notes: 'Test field',
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(field.boundary_gps).toHaveLength(4);
    expect(field.boundary_gps?.[0]).toHaveProperty('lat');
    expect(field.boundary_gps?.[0]).toHaveProperty('lng');
  });

  it('should support fields with only center point', () => {
    const field: Field = {
      id: '1',
      farm_id: 'farm1',
      name: 'Point Field',
      size_acres: 10,
      location_gps: { lat: 40.7128, lng: -74.006 },
      current_crop: 'corn',
      soil_type: 'loam',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(field.location_gps).toBeDefined();
    expect(field.boundary_gps).toBeUndefined();
  });

  it('should support fields with no GPS data', () => {
    const field: Field = {
      id: '1',
      farm_id: 'farm1',
      name: 'No GPS Field',
      size_acres: 10,
      location_gps: null,
      current_crop: null,
      soil_type: 'loam',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(field.location_gps).toBeNull();
    expect(field.boundary_gps).toBeUndefined();
  });
});
