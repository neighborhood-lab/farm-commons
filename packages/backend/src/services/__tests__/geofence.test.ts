// Tests for Geofence Validation Service

import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  isValidCoordinate,
  isPointInCircle,
  isPointInPolygon,
  distanceToPolygonBoundary,
  validateGeofence,
  createCircularBoundary,
  createPolygonBoundary,
  type Coordinate,
  type FarmBoundary,
} from '../geofence.js';

describe('Geofence Validation Service', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two nearby points', () => {
      const point1: Coordinate = { lat: 40.7128, lng: -74.106 }; // New York
      const point2: Coordinate = { lat: 40.7614, lng: -73.9776 }; // Times Square

      const distance = calculateDistance(point1, point2);

      // Distance should be approximately 5.9 km
      expect(distance).toBeGreaterThan(5800);
      expect(distance).toBeLessThan(6000);
    });

    it('should return 0 for same points', () => {
      const point: Coordinate = { lat: 40.7128, lng: -74.106 };
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should calculate large distances correctly', () => {
      const newYork: Coordinate = { lat: 40.7128, lng: -74.106 };
      const london: Coordinate = { lat: 51.5074, lng: -0.1278 };

      const distance = calculateDistance(newYork, london);

      // Distance should be approximately 5,571 km
      expect(distance).toBeGreaterThan(5_500_000);
      expect(distance).toBeLessThan(5_600_000);
    });

    it('should handle points across the equator', () => {
      const north: Coordinate = { lat: 10, lng: 0 };
      const south: Coordinate = { lat: -10, lng: 0 };

      const distance = calculateDistance(north, south);

      // Distance should be approximately 2,223 km (20 degrees of latitude)
      expect(distance).toBeGreaterThan(2_200_000);
      expect(distance).toBeLessThan(2_300_000);
    });

    it('should handle points across the prime meridian', () => {
      const west: Coordinate = { lat: 0, lng: -10 };
      const east: Coordinate = { lat: 0, lng: 10 };

      const distance = calculateDistance(west, east);

      // Distance should be approximately 2,223 km (20 degrees of longitude at equator)
      expect(distance).toBeGreaterThan(2_200_000);
      expect(distance).toBeLessThan(2_300_000);
    });
  });

  describe('isValidCoordinate', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinate({ lat: 40.7128, lng: -74.106 })).toBe(true);
      expect(isValidCoordinate({ lat: 0, lng: 0 })).toBe(true);
      expect(isValidCoordinate({ lat: 90, lng: 180 })).toBe(true);
      expect(isValidCoordinate({ lat: -90, lng: -180 })).toBe(true);
    });

    it('should reject invalid latitude', () => {
      expect(isValidCoordinate({ lat: 91, lng: 0 })).toBe(false);
      expect(isValidCoordinate({ lat: -91, lng: 0 })).toBe(false);
      expect(isValidCoordinate({ lat: 100, lng: 0 })).toBe(false);
    });

    it('should reject invalid longitude', () => {
      expect(isValidCoordinate({ lat: 0, lng: 181 })).toBe(false);
      expect(isValidCoordinate({ lat: 0, lng: -181 })).toBe(false);
      expect(isValidCoordinate({ lat: 0, lng: 200 })).toBe(false);
    });

    it('should reject NaN values', () => {
      expect(isValidCoordinate({ lat: Number.NaN, lng: 0 })).toBe(false);
      expect(isValidCoordinate({ lat: 0, lng: Number.NaN })).toBe(false);
    });

    it('should reject Infinity values', () => {
      expect(isValidCoordinate({ lat: Infinity, lng: 0 })).toBe(false);
      expect(isValidCoordinate({ lat: 0, lng: -Infinity })).toBe(false);
    });

    it('should reject non-number values', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidCoordinate({ lat: '40.7128' as any, lng: -74.106 })).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidCoordinate({ lat: 40.7128, lng: '-74.106' as any })).toBe(false);
    });
  });

  describe('isPointInCircle', () => {
    const center: Coordinate = { lat: 40.7128, lng: -74.106 };
    const radiusMeters = 1000; // 1 km

    it('should return true for points inside circle', () => {
      // Point 500m away (approximately)
      const insidePoint: Coordinate = { lat: 40.7173, lng: -74.106 };
      const result = isPointInCircle(insidePoint, center, radiusMeters);

      expect(result.isInside).toBe(true);
      expect(result.distance).toBeLessThan(radiusMeters);
    });

    it('should return false for points outside circle', () => {
      // Point approximately 2km away
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = isPointInCircle(outsidePoint, center, radiusMeters);

      expect(result.isInside).toBe(false);
      expect(result.distance).toBeGreaterThan(radiusMeters);
    });

    it('should return true for center point', () => {
      const result = isPointInCircle(center, center, radiusMeters);

      expect(result.isInside).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('should handle points on the boundary', () => {
      // Calculate a point exactly at the boundary (approximate)
      const boundaryPoint: Coordinate = { lat: 40.7218, lng: -74.106 };
      const result = isPointInCircle(boundaryPoint, center, radiusMeters);

      // Should be very close to the radius
      expect(Math.abs(result.distance - radiusMeters)).toBeLessThan(10); // Within 10 meters
    });
  });

  describe('isPointInPolygon', () => {
    it('should return true for point inside square polygon', () => {
      const square: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      const insidePoint: Coordinate = { lat: 5, lng: 5 };

      expect(isPointInPolygon(insidePoint, square)).toBe(true);
    });

    it('should return false for point outside square polygon', () => {
      const square: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      const outsidePoint: Coordinate = { lat: 15, lng: 15 };

      expect(isPointInPolygon(outsidePoint, square)).toBe(false);
    });

    it('should handle complex polygon shapes', () => {
      // L-shaped polygon
      const lShape: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 5 },
        { lat: 5, lng: 5 },
        { lat: 5, lng: 2 },
        { lat: 10, lng: 2 },
        { lat: 10, lng: 0 },
      ];

      expect(isPointInPolygon({ lat: 2, lng: 1 }, lShape)).toBe(true);
      expect(isPointInPolygon({ lat: 7, lng: 1 }, lShape)).toBe(true);
      expect(isPointInPolygon({ lat: 7, lng: 4 }, lShape)).toBe(false);
    });

    it('should return false for polygon with less than 3 points', () => {
      const invalidPolygon: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 10, lng: 10 },
      ];

      expect(isPointInPolygon({ lat: 5, lng: 5 }, invalidPolygon)).toBe(false);
    });

    it('should handle points on polygon edges', () => {
      const triangle: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      // Point on edge - behavior may vary, but should be consistent
      const edgePoint: Coordinate = { lat: 0, lng: 5 };
      const result = isPointInPolygon(edgePoint, triangle);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('distanceToPolygonBoundary', () => {
    it('should calculate minimum distance to polygon boundary', () => {
      const square: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      const centerPoint: Coordinate = { lat: 5, lng: 5 };
      const distance = distanceToPolygonBoundary(centerPoint, square);

      // Distance from center to nearest edge should be approximately 5 degrees
      // which is roughly 555 km at this latitude
      expect(distance).toBeGreaterThan(500_000);
      expect(distance).toBeLessThan(800_000);
    });

    it('should return Infinity for empty polygon', () => {
      const distance = distanceToPolygonBoundary({ lat: 0, lng: 0 }, []);
      expect(distance).toBe(Infinity);
    });

    it('should calculate distance to nearest edge', () => {
      const square: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      const nearLeftEdge: Coordinate = { lat: 5, lng: 1 };
      const distance = distanceToPolygonBoundary(nearLeftEdge, square);

      // Should be close to the left edge (approximately 1 degree longitude at this latitude)
      expect(distance).toBeGreaterThan(100_000);
      expect(distance).toBeLessThan(600_000);
    });
  });

  describe('validateGeofence - Circular Boundary', () => {
    const boundary: FarmBoundary = createCircularBoundary(
      { lat: 40.7128, lng: -74.106 },
      1000 // 1 km radius
    );

    it('should validate point inside boundary', () => {
      const insidePoint: Coordinate = { lat: 40.7173, lng: -74.106 };
      const result = validateGeofence(insidePoint, boundary);

      expect(result.isValid).toBe(true);
      expect(result.distance).toBeDefined();
      expect(result.distance).toBeLessThan(1000);
      expect(result.message).toContain('Within farm boundary');
    });

    it('should reject point outside boundary', () => {
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = validateGeofence(outsidePoint, boundary);

      expect(result.isValid).toBe(false);
      expect(result.distance).toBeDefined();
      expect(result.distance).toBeGreaterThan(1000);
      expect(result.message).toContain('Outside farm boundary');
    });

    it('should reject invalid coordinates', () => {
      const invalidPoint: Coordinate = { lat: 200, lng: -74.106 };
      const result = validateGeofence(invalidPoint, boundary);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid GPS coordinates');
    });

    it('should reject boundary without center', () => {
      const invalidBoundary: FarmBoundary = {
        type: 'circle',
        radiusMeters: 1000,
      };

      const result = validateGeofence({ lat: 40.7128, lng: -74.106 }, invalidBoundary);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid boundary definition');
    });
  });

  describe('validateGeofence - Polygon Boundary', () => {
    const boundary: FarmBoundary = createPolygonBoundary([
      { lat: 40.71, lng: -74.11 },
      { lat: 40.71, lng: -74 },
      { lat: 40.72, lng: -74 },
      { lat: 40.72, lng: -74.11 },
    ]);

    it('should validate point inside polygon boundary', () => {
      const insidePoint: Coordinate = { lat: 40.715, lng: -74.105 };
      const result = validateGeofence(insidePoint, boundary);

      expect(result.isValid).toBe(true);
      expect(result.distance).toBeDefined();
      expect(result.message).toContain('Within farm boundary');
    });

    it('should reject point outside polygon boundary', () => {
      const outsidePoint: Coordinate = { lat: 40.73, lng: -74.12 };
      const result = validateGeofence(outsidePoint, boundary);

      expect(result.isValid).toBe(false);
      expect(result.distance).toBeDefined();
      expect(result.message).toContain('Outside farm boundary');
    });

    it('should reject polygon with less than 3 points', () => {
      const invalidBoundary: FarmBoundary = {
        type: 'polygon',
        points: [
          { lat: 40.71, lng: -74.11 },
          { lat: 40.71, lng: -74 },
        ],
      };

      const result = validateGeofence({ lat: 40.715, lng: -74.105 }, invalidBoundary);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid boundary definition');
    });
  });

  describe('validateGeofence - Override Mechanism', () => {
    const boundary: FarmBoundary = createCircularBoundary({ lat: 40.7128, lng: -74.106 }, 1000);

    it('should allow override with proper authorization', () => {
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = validateGeofence(outsidePoint, boundary, {
        allowOverride: true,
        overrideReason: 'Emergency situation - worker at hospital',
        overrideApprovedBy: 'Manager John Doe',
      });

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Override approved');
      expect(result.message).toContain('Manager John Doe');
    });

    it('should not allow override without reason', () => {
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = validateGeofence(outsidePoint, boundary, {
        allowOverride: true,
        overrideApprovedBy: 'Manager John Doe',
      });

      expect(result.isValid).toBe(false);
    });

    it('should not allow override without approver', () => {
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = validateGeofence(outsidePoint, boundary, {
        allowOverride: true,
        overrideReason: 'Emergency situation',
      });

      expect(result.isValid).toBe(false);
    });

    it('should not allow override when allowOverride is false', () => {
      const outsidePoint: Coordinate = { lat: 40.7308, lng: -74.106 };
      const result = validateGeofence(outsidePoint, boundary, {
        allowOverride: false,
        overrideReason: 'Emergency situation',
        overrideApprovedBy: 'Manager John Doe',
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('Boundary Creation Helpers', () => {
    it('should create circular boundary correctly', () => {
      const center: Coordinate = { lat: 40.7128, lng: -74.106 };
      const radius = 500;

      const boundary = createCircularBoundary(center, radius);

      expect(boundary.type).toBe('circle');
      expect(boundary.center).toEqual(center);
      expect(boundary.radiusMeters).toBe(radius);
    });

    it('should create polygon boundary correctly', () => {
      const points: Coordinate[] = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
      ];

      const boundary = createPolygonBoundary(points);

      expect(boundary.type).toBe('polygon');
      expect(boundary.points).toEqual(points);
    });
  });

  describe('Real-world Farm Scenarios', () => {
    it('should validate typical farm scenario with circular boundary', () => {
      // Farm center at a location
      const farmCenter: Coordinate = { lat: 42.3601, lng: -71.1589 }; // Boston area
      const farmRadius = 500; // 500m radius farm

      const boundary = createCircularBoundary(farmCenter, farmRadius);

      // Worker clocking in from barn (200m from center)
      const barnLocation: Coordinate = { lat: 42.3619, lng: -71.1589 };
      const barnResult = validateGeofence(barnLocation, boundary);

      expect(barnResult.isValid).toBe(true);

      // Worker trying to clock in from home (2km away)
      const homeLocation: Coordinate = { lat: 42.3781, lng: -71.1589 };
      const homeResult = validateGeofence(homeLocation, boundary);

      expect(homeResult.isValid).toBe(false);
    });

    it('should validate typical farm scenario with polygon boundary', () => {
      // Rectangular farm field
      const farmBoundary: Coordinate[] = [
        { lat: 42.36, lng: -71.16 },
        { lat: 42.36, lng: -71.15 },
        { lat: 42.37, lng: -71.15 },
        { lat: 42.37, lng: -71.16 },
      ];

      const boundary = createPolygonBoundary(farmBoundary);

      // Worker in the middle of the field
      const fieldCenter: Coordinate = { lat: 42.365, lng: -71.155 };
      const centerResult = validateGeofence(fieldCenter, boundary);

      expect(centerResult.isValid).toBe(true);

      // Worker outside the field boundary
      const roadLocation: Coordinate = { lat: 42.38, lng: -71.155 };
      const roadResult = validateGeofence(roadLocation, boundary);

      expect(roadResult.isValid).toBe(false);
    });

    it('should handle edge case with manager override for off-site meeting', () => {
      const farmCenter: Coordinate = { lat: 42.3601, lng: -71.1589 };
      const boundary = createCircularBoundary(farmCenter, 500);

      // Worker at agricultural supplier (off-site but work-related)
      const supplierLocation: Coordinate = { lat: 42.3781, lng: -71.1589 };

      const result = validateGeofence(supplierLocation, boundary, {
        allowOverride: true,
        overrideReason: 'Picking up supplies from agricultural supplier',
        overrideApprovedBy: 'Farm Manager Sarah',
      });

      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Override approved');
    });
  });
});
