// Farm Commons Validation Utilities
// Common validation helpers for phone numbers, emails, GPS coordinates, and string sanitization

/**
 * Phone number validation result
 */
export interface PhoneValidationResult {
  isValid: boolean;
  country?: 'US' | 'Mexico';
  formatted?: string;
  error?: string;
}

/**
 * GPS coordinates validation result
 */
export interface GPSValidationResult {
  isValid: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

/**
 * Validate US phone number
 * Accepts formats: 1234567890, (123) 456-7890, 123-456-7890, +1-123-456-7890
 */
export function validateUSPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // US phone numbers should be 10 digits, or 11 digits starting with 1
  if (cleaned.length === 10) {
    return /^[2-9]\d{2}[2-9]\d{6}$/.test(cleaned);
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return /^1[2-9]\d{2}[2-9]\d{6}$/.test(cleaned);
  }

  return false;
}

/**
 * Validate Mexico phone number
 * Mexico phone numbers are 10 digits (after country code)
 * Format: +52 XXX XXX XXXX or 01 XXX XXX XXXX
 */
export function validateMexicoPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Mexico phone numbers should be 10 digits, or 12 digits with country code (52)
  if (cleaned.length === 10) {
    return /^\d{10}$/.test(cleaned);
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return /^52\d{10}$/.test(cleaned);
  }

  return false;
}

/**
 * Validate phone number for US or Mexico
 * Returns validation result with country detection
 */
export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required'
    };
  }

  const cleaned = phone.replace(/\D/g, '');

  // Try US validation first
  if (validateUSPhone(phone)) {
    const digits = cleaned.length === 11 ? cleaned.slice(1) : cleaned;
    return {
      isValid: true,
      country: 'US',
      formatted: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    };
  }

  // Try Mexico validation
  if (validateMexicoPhone(phone)) {
    const digits = cleaned.length === 12 ? cleaned.slice(2) : cleaned;
    return {
      isValid: true,
      country: 'Mexico',
      formatted: `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    };
  }

  return {
    isValid: false,
    error: 'Invalid phone number format. Must be a valid US or Mexico phone number.'
  };
}

/**
 * Validate email address
 * Uses a comprehensive regex pattern that follows RFC 5322 guidelines
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // Check length constraints
  if (email.length === 0 || email.length > 254) {
    return false;
  }

  // Comprehensive email regex pattern
  // This pattern checks for:
  // - Valid local part (before @)
  // - Valid domain part (after @)
  // - Proper structure
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part should not exceed 64 characters
  if (localPart.length > 64) {
    return false;
  }

  // Domain should not exceed 253 characters
  if (domain.length > 253) {
    return false;
  }

  // Domain should have at least one dot and valid TLD
  if (!domain.includes('.')) {
    return false;
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }

  // Check that it doesn't start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Validate GPS coordinates
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function validateGPSCoordinates(
  latitude: number | string,
  longitude: number | string
): GPSValidationResult {
  // Convert to numbers if strings
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lon = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  // Check if valid numbers
  if (isNaN(lat) || isNaN(lon)) {
    return {
      isValid: false,
      error: 'Coordinates must be valid numbers'
    };
  }

  // Check if numbers are finite
  if (!isFinite(lat) || !isFinite(lon)) {
    return {
      isValid: false,
      error: 'Coordinates must be finite numbers'
    };
  }

  // Validate latitude range (-90 to 90)
  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90 degrees'
    };
  }

  // Validate longitude range (-180 to 180)
  if (lon < -180 || lon > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180 degrees'
    };
  }

  return {
    isValid: true,
    latitude: lat,
    longitude: lon
  };
}

/**
 * Check if coordinates are valid (simple boolean check)
 */
export function isValidGPSCoordinates(latitude: number, longitude: number): boolean {
  return validateGPSCoordinates(latitude, longitude).isValid;
}

/**
 * Sanitize string to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Escape HTML special characters
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize string and trim whitespace
 */
export function sanitizeAndTrim(input: string): string {
  return sanitizeString(input).trim();
}

/**
 * Remove all non-alphanumeric characters except spaces and common punctuation
 * Useful for names, addresses, etc.
 */
export function sanitizeTextField(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Allow letters, numbers, spaces, and common punctuation
  // Remove any potentially dangerous characters
  return input
    .replace(/[^\w\s\-.,@()]/gi, '')
    .trim();
}

/**
 * Sanitize numeric input (allow only digits, optional decimal point and minus sign)
 */
export function sanitizeNumeric(input: string, allowDecimal: boolean = true): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  if (allowDecimal) {
    // Allow digits, minus sign (at start), and one decimal point
    return input
      .replace(/[^\d.-]/g, '')
      .replace(/(?!^)-/g, '') // Remove minus signs not at the start
      .replace(/(\..*)\./g, '$1'); // Remove duplicate decimal points
  } else {
    // Allow only digits and minus sign at start
    return input
      .replace(/[^\d-]/g, '')
      .replace(/(?!^)-/g, ''); // Remove minus signs not at the start
  }
}

/**
 * Normalize whitespace (replace multiple spaces with single space)
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Validate and sanitize name (first name, last name)
 * Names should only contain letters, spaces, hyphens, and apostrophes
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Name should be at least 1 character and no more than 100 characters
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  // Support Unicode letters for international names
  return /^[\p{L}\s'-]+$/u.test(trimmed);
}

/**
 * Sanitize name field
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
  return name
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
