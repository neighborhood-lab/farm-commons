// Farm Commons Validation Utilities Tests
import { describe, it, expect } from 'vitest';
import {
  validateUSPhone,
  validateMexicoPhone,
  validatePhone,
  validateEmail,
  validateGPSCoordinates,
  isValidGPSCoordinates,
  sanitizeString,
  sanitizeAndTrim,
  sanitizeTextField,
  sanitizeNumeric,
  normalizeWhitespace,
  validateName,
  sanitizeName,
} from '../validation.js';

describe('Phone Number Validation', () => {
  describe('validateUSPhone', () => {
    it('should validate 10-digit US phone number', () => {
      expect(validateUSPhone('2025551234')).toBe(true);
      expect(validateUSPhone('4155551234')).toBe(true);
    });

    it('should validate formatted US phone numbers', () => {
      expect(validateUSPhone('(202) 555-1234')).toBe(true);
      expect(validateUSPhone('202-555-1234')).toBe(true);
      expect(validateUSPhone('202.555.1234')).toBe(true);
    });

    it('should validate 11-digit US phone number with country code', () => {
      expect(validateUSPhone('12025551234')).toBe(true);
      expect(validateUSPhone('+1-202-555-1234')).toBe(true);
    });

    it('should reject invalid US phone numbers', () => {
      expect(validateUSPhone('1234567890')).toBe(false); // Starts with 1
      expect(validateUSPhone('0125551234')).toBe(false); // Starts with 0
      expect(validateUSPhone('202555123')).toBe(false); // Too short
      expect(validateUSPhone('20255512345')).toBe(false); // Too long
      expect(validateUSPhone('202155512')).toBe(false); // Second part starts with 0
    });

    it('should handle edge cases', () => {
      expect(validateUSPhone('')).toBe(false);
      expect(validateUSPhone('abc')).toBe(false);
      expect(validateUSPhone('12345')).toBe(false);
    });
  });

  describe('validateMexicoPhone', () => {
    it('should validate 10-digit Mexico phone number', () => {
      expect(validateMexicoPhone('5512345678')).toBe(true);
      expect(validateMexicoPhone('3312345678')).toBe(true);
    });

    it('should validate Mexico phone number with country code', () => {
      expect(validateMexicoPhone('525512345678')).toBe(true);
      expect(validateMexicoPhone('+52 55 1234 5678')).toBe(true);
    });

    it('should reject invalid Mexico phone numbers', () => {
      expect(validateMexicoPhone('551234567')).toBe(false); // Too short
      expect(validateMexicoPhone('55123456789')).toBe(false); // Too long
      expect(validateMexicoPhone('545512345678')).toBe(false); // Wrong country code
    });

    it('should handle edge cases', () => {
      expect(validateMexicoPhone('')).toBe(false);
      expect(validateMexicoPhone('abc')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate and detect US phone numbers', () => {
      const result = validatePhone('(202) 555-1234');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('US');
      expect(result.formatted).toBe('(202) 555-1234');
    });

    it('should validate and detect Mexico phone numbers', () => {
      const result = validatePhone('525512345678');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('Mexico');
      expect(result.formatted).toBe('+52 551 234 5678');
    });

    it('should return error for invalid phone numbers', () => {
      const result = validatePhone('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle edge cases', () => {
      expect(validatePhone('').isValid).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(validatePhone(null).isValid).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(validatePhone(undefined).isValid).toBe(false);
    });
  });
});

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should validate valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
      expect(validateEmail('first.last@example.com')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should accept special characters in local part', () => {
      expect(validateEmail('user+filter@example.com')).toBe(true);
      expect(validateEmail('user_name@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false); // No TLD
      expect(validateEmail('user..name@example.com')).toBe(false); // Double dot
      expect(validateEmail('.user@example.com')).toBe(false); // Starts with dot
      expect(validateEmail('user.@example.com')).toBe(false); // Ends with dot
    });

    it('should enforce length constraints', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(validateEmail(longLocal)).toBe(false);

      const longDomain = 'user@' + 'a'.repeat(250) + '.com';
      expect(validateEmail(longDomain)).toBe(false);

      const tooLong = 'a'.repeat(255) + '@example.com';
      expect(validateEmail(tooLong)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('   ')).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(validateEmail(null)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(validateEmail(' test@example.com ')).toBe(true); // Should trim
      expect(validateEmail('test @example.com')).toBe(false); // Space in local part
    });
  });
});

describe('GPS Coordinates Validation', () => {
  describe('validateGPSCoordinates', () => {
    it('should validate valid coordinates', () => {
      const result = validateGPSCoordinates(40.7128, -74.006);
      expect(result.isValid).toBe(true);
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
    });

    it('should validate coordinates at boundaries', () => {
      expect(validateGPSCoordinates(90, 180).isValid).toBe(true);
      expect(validateGPSCoordinates(-90, -180).isValid).toBe(true);
      expect(validateGPSCoordinates(0, 0).isValid).toBe(true);
    });

    it('should accept string coordinates', () => {
      const result = validateGPSCoordinates('40.7128', '-74.006');
      expect(result.isValid).toBe(true);
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
    });

    it('should reject out of range latitude', () => {
      const result1 = validateGPSCoordinates(91, 0);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Latitude');

      const result2 = validateGPSCoordinates(-91, 0);
      expect(result2.isValid).toBe(false);
    });

    it('should reject out of range longitude', () => {
      const result1 = validateGPSCoordinates(0, 181);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Longitude');

      const result2 = validateGPSCoordinates(0, -181);
      expect(result2.isValid).toBe(false);
    });

    it('should reject invalid number formats', () => {
      const result1 = validateGPSCoordinates('abc' as any, 0);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('valid numbers');

      const result2 = validateGPSCoordinates(0, 'xyz' as any);
      expect(result2.isValid).toBe(false);
    });

    it('should reject infinity and NaN', () => {
      expect(validateGPSCoordinates(Infinity, 0).isValid).toBe(false);
      expect(validateGPSCoordinates(0, -Infinity).isValid).toBe(false);
      expect(validateGPSCoordinates(NaN, 0).isValid).toBe(false);
    });
  });

  describe('isValidGPSCoordinates', () => {
    it('should return boolean for valid coordinates', () => {
      expect(isValidGPSCoordinates(40.7128, -74.006)).toBe(true);
      expect(isValidGPSCoordinates(91, 0)).toBe(false);
    });
  });
});

describe('String Sanitization', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeString('Test & "quotes" <tag>')).toBe(
        'Test &amp; &quot;quotes&quot; &lt;tag&gt;'
      );
    });

    it('should escape single quotes and forward slashes', () => {
      expect(sanitizeString("It's a test")).toBe('It&#x27;s a test');
      expect(sanitizeString('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeString('')).toBe('');
      // @ts-ignore - Testing runtime behavior
      expect(sanitizeString(null)).toBe('');
      // @ts-ignore - Testing runtime behavior
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should preserve regular text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('123456')).toBe('123456');
    });
  });

  describe('sanitizeAndTrim', () => {
    it('should sanitize and trim whitespace', () => {
      expect(sanitizeAndTrim('  <script>alert("xss")</script>  ')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeAndTrim('  Hello World  ')).toBe('Hello World');
    });
  });

  describe('sanitizeTextField', () => {
    it('should allow alphanumeric and common punctuation', () => {
      expect(sanitizeTextField('John Doe')).toBe('John Doe');
      expect(sanitizeTextField('123 Main St., Apt #4')).toBe('123 Main St., Apt 4');
      expect(sanitizeTextField('test@example.com')).toBe('test@example.com');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeTextField('<script>alert()</script>')).toBe('scriptalert()script');
      expect(sanitizeTextField('test<>test')).toBe('testtest');
    });

    it('should trim whitespace', () => {
      expect(sanitizeTextField('  test  ')).toBe('test');
    });

    it('should handle empty input', () => {
      expect(sanitizeTextField('')).toBe('');
      // @ts-ignore - Testing runtime behavior
      expect(sanitizeTextField(null)).toBe('');
    });
  });

  describe('sanitizeNumeric', () => {
    it('should allow numeric input with decimal', () => {
      expect(sanitizeNumeric('123.45')).toBe('123.45');
      expect(sanitizeNumeric('-123.45')).toBe('-123.45');
    });

    it('should allow numeric input without decimal', () => {
      expect(sanitizeNumeric('12345', false)).toBe('12345');
      expect(sanitizeNumeric('-12345', false)).toBe('-12345');
    });

    it('should remove non-numeric characters', () => {
      expect(sanitizeNumeric('abc123def')).toBe('123');
      expect(sanitizeNumeric('$1,234.56')).toBe('1234.56');
    });

    it('should handle multiple decimal points', () => {
      expect(sanitizeNumeric('123.45.67')).toBe('123.4567');
    });

    it('should handle multiple minus signs', () => {
      expect(sanitizeNumeric('-12-34')).toBe('-1234');
      expect(sanitizeNumeric('12-34')).toBe('1234');
    });

    it('should handle empty input', () => {
      expect(sanitizeNumeric('')).toBe('');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should replace multiple spaces with single space', () => {
      expect(normalizeWhitespace('Hello    World')).toBe('Hello World');
      expect(normalizeWhitespace('Test   with   spaces')).toBe('Test with spaces');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalizeWhitespace('  Hello World  ')).toBe('Hello World');
    });

    it('should handle tabs and newlines', () => {
      expect(normalizeWhitespace('Hello\t\nWorld')).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(normalizeWhitespace('')).toBe('');
      expect(normalizeWhitespace('   ')).toBe('');
    });
  });
});

describe('Name Validation and Sanitization', () => {
  describe('validateName', () => {
    it('should validate simple names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Mary')).toBe(true);
    });

    it('should validate names with spaces', () => {
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('Mary Jane Smith')).toBe(true);
    });

    it('should validate names with hyphens and apostrophes', () => {
      expect(validateName("O'Brien")).toBe(true);
      expect(validateName('Jean-Pierre')).toBe(true);
      expect(validateName("Mary-Jane O'Connor")).toBe(true);
    });

    it('should validate international names with Unicode characters', () => {
      expect(validateName('José')).toBe(true);
      expect(validateName('François')).toBe(true);
      expect(validateName('Müller')).toBe(true);
      expect(validateName('Наталья')).toBe(true);
      expect(validateName('李明')).toBe(true);
    });

    it('should reject names with numbers', () => {
      expect(validateName('John123')).toBe(false);
      expect(validateName('Mary1')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateName('John@Doe')).toBe(false);
      expect(validateName('Mary$Smith')).toBe(false);
      expect(validateName('Test<script>')).toBe(false);
    });

    it('should enforce length constraints', () => {
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName('a'.repeat(101))).toBe(false);
      expect(validateName('a'.repeat(100))).toBe(true);
    });

    it('should handle edge cases', () => {
      // @ts-ignore - Testing runtime behavior
      expect(validateName(null)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(validateName(undefined)).toBe(false);
    });
  });

  describe('sanitizeName', () => {
    it('should preserve valid names', () => {
      expect(sanitizeName('John Doe')).toBe('John Doe');
      expect(sanitizeName("O'Brien")).toBe("O'Brien");
      expect(sanitizeName('Jean-Pierre')).toBe('Jean-Pierre');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeName('John123')).toBe('John');
      expect(sanitizeName('Mary@Smith')).toBe('MarySmith');
      expect(sanitizeName('Test<script>alert()</script>')).toBe('Testscriptalertscript');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeName('  John   Doe  ')).toBe('John Doe');
      expect(sanitizeName('Mary  Jane  Smith')).toBe('Mary Jane Smith');
    });

    it('should preserve international characters', () => {
      expect(sanitizeName('José García')).toBe('José García');
      expect(sanitizeName('François Müller')).toBe('François Müller');
    });

    it('should handle empty input', () => {
      expect(sanitizeName('')).toBe('');
      expect(sanitizeName('   ')).toBe('');
      // @ts-ignore - Testing runtime behavior
      expect(sanitizeName(null)).toBe('');
    });
  });
});
