// Geofence Validation Service
// Verify that clock-ins occur on farm property

/**
 * GPS Coordinate interface
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Farm boundary definition
 * Can be either a center point with radius or a polygon
 */
export interface FarmBoundary {
  type: 'circle' | 'polygon';
  // For circle type
  center?: Coordinate;
  radiusMeters?: number;
  // For polygon type
  points?: Coordinate[];
}

/**
 * Geofence validation result
 */
export interface GeofenceValidationResult {
  isValid: boolean;
  distance?: number; // Distance to nearest boundary point in meters
  message?: string;
}

/**
 * Options for geofence validation
 */
export interface GeofenceValidationOptions {
  allowOverride?: boolean;
  overrideReason?: string;
  overrideApprovedBy?: string;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(point1.lat);
  const φ2 = toRadians(point2.lat);
  const Δφ = toRadians(point2.lat - point1.lat);
  const Δλ = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if GPS coordinates are within acceptable range
 * @param coordinate GPS coordinate to validate
 * @returns true if coordinates are valid
 */
export function isValidCoordinate(coordinate: Coordinate): boolean {
  const { lat, lng } = coordinate;

  // Check if lat and lng are numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  // Check if lat and lng are not NaN or Infinity
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  // Check latitude range: -90 to 90
  if (lat < -90 || lat > 90) {
    return false;
  }

  // Check longitude range: -180 to 180
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Check if a point is inside a circular boundary
 * @param point Point to check
 * @param center Center of circle
 * @param radiusMeters Radius in meters
 * @returns Object with validation result and distance
 */
export function isPointInCircle(
  point: Coordinate,
  center: Coordinate,
  radiusMeters: number
): { isInside: boolean; distance: number } {
  const distance = calculateDistance(point, center);
  return {
    isInside: distance <= radiusMeters,
    distance,
  };
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point Point to check
 * @param polygon Array of coordinates forming the polygon
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  if (polygon.length < 3) {
    return false; // A polygon must have at least 3 points
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate minimum distance from point to polygon boundary
 * @param point Point to check
 * @param polygon Array of coordinates forming the polygon
 * @returns Minimum distance in meters
 */
export function distanceToPolygonBoundary(point: Coordinate, polygon: Coordinate[]): number {
  if (polygon.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  // Check distance to each edge of the polygon
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const distance = distanceToLineSegment(point, polygon[i], polygon[j]);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Calculate distance from point to line segment
 * @param point Point to check
 * @param lineStart Start of line segment
 * @param lineEnd End of line segment
 * @returns Distance in meters
 */
function distanceToLineSegment(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  // Calculate distances to endpoints
  const distToStart = calculateDistance(point, lineStart);
  const lineLength = calculateDistance(lineStart, lineEnd);

  // If line segment is actually a point
  if (lineLength === 0) {
    return distToStart;
  }

  // Calculate projection onto line segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lat - lineStart.lat) * (lineEnd.lat - lineStart.lat) +
        (point.lng - lineStart.lng) * (lineEnd.lng - lineStart.lng)) /
        (lineLength * lineLength)
    )
  );

  // Calculate closest point on line segment
  const projection = {
    lat: lineStart.lat + t * (lineEnd.lat - lineStart.lat),
    lng: lineStart.lng + t * (lineEnd.lng - lineStart.lng),
  };

  return calculateDistance(point, projection);
}

/**
 * Validate if a GPS coordinate is within farm boundaries
 * @param coordinate GPS coordinate to validate
 * @param boundary Farm boundary definition
 * @param options Validation options
 * @returns Validation result
 */
export function validateGeofence(
  coordinate: Coordinate,
  boundary: FarmBoundary,
  options: GeofenceValidationOptions = {}
): GeofenceValidationResult {
  // First validate coordinate format
  if (!isValidCoordinate(coordinate)) {
    return {
      isValid: false,
      message: 'Invalid GPS coordinates',
    };
  }

  // Check if override is requested and allowed
  if (options.allowOverride && options.overrideReason && options.overrideApprovedBy) {
    return {
      isValid: true,
      message: `Override approved by ${options.overrideApprovedBy}: ${options.overrideReason}`,
    };
  }

  // Validate based on boundary type
  if (boundary.type === 'circle') {
    if (!boundary.center || !boundary.radiusMeters) {
      return {
        isValid: false,
        message: 'Invalid boundary definition: missing center or radius',
      };
    }

    const { isInside, distance } = isPointInCircle(
      coordinate,
      boundary.center,
      boundary.radiusMeters
    );

    return {
      isValid: isInside,
      distance: Math.round(distance),
      message: isInside
        ? `Within farm boundary (${Math.round(distance)}m from center)`
        : `Outside farm boundary (${Math.round(distance)}m from center, allowed radius: ${boundary.radiusMeters}m)`,
    };
  } else if (boundary.type === 'polygon') {
    if (!boundary.points || boundary.points.length < 3) {
      return {
        isValid: false,
        message: 'Invalid boundary definition: polygon must have at least 3 points',
      };
    }

    const isInside = isPointInPolygon(coordinate, boundary.points);
    const distance = distanceToPolygonBoundary(coordinate, boundary.points);

    return {
      isValid: isInside,
      distance: Math.round(distance),
      message: isInside
        ? `Within farm boundary (${Math.round(distance)}m from nearest edge)`
        : `Outside farm boundary (${Math.round(distance)}m from nearest edge)`,
    };
  }

  return {
    isValid: false,
    message: 'Unknown boundary type',
  };
}

/**
 * Create a circular farm boundary
 * @param center Center coordinate
 * @param radiusMeters Radius in meters
 * @returns Farm boundary definition
 */
export function createCircularBoundary(center: Coordinate, radiusMeters: number): FarmBoundary {
  return {
    type: 'circle',
    center,
    radiusMeters,
  };
}

/**
 * Create a polygonal farm boundary
 * @param points Array of coordinates forming the polygon
 * @returns Farm boundary definition
 */
export function createPolygonBoundary(points: Coordinate[]): FarmBoundary {
  return {
    type: 'polygon',
    points,
  };
}
