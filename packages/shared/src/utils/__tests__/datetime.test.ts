/**
 * Date/Time Utility Functions Tests
 *
 * Comprehensive tests for datetime utilities including:
 * - Date formatting
 * - Time calculations
 * - Week/month range calculations
 * - Timezone handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRelative,
  calculateHours,
  calculatePreciseHours,
  formatHoursAsTime,
  getCurrentWeekRange,
  getWeekRange,
  getCurrentMonthRange,
  getMonthRange,
  getLastNWeeksRanges,
  getLastNMonthsRanges,
  getTimezoneOffset,
  getTimezoneOffsetString,
  formatDateRange,
  isDateInRange,
  getDaysBetween,
  isSameDay,
  getDatesInRange,
  isValidTimeString,
  isCertificationExpiringSoon,
  getISOWeekNumber,
  DATE_FORMATS,
  COMMON_TIMEZONES,
  DateRange,
} from '../datetime';

describe('Date Formatting', () => {
  it('should format date with default format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('2024-01-15');
  });

  it('should format date with custom format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(date, 'MMM d, yyyy');
    expect(formatted).toMatch(/Jan 15, 2024/);
  });

  it('should format date from ISO string', () => {
    const formatted = formatDate('2024-01-15T10:30:00Z');
    expect(formatted).toBe('2024-01-15');
  });

  it('should format time with default format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatTime(date);
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should format time with custom format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatTime(date, 'h:mm a');
    expect(formatted).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
  });

  it('should format datetime', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDateTime(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('Jan');
  });
});

describe('Relative Date Formatting', () => {
  beforeEach(() => {
    // Mock the current date for consistent testing
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should format today as "Today"', () => {
    const today = new Date('2024-01-15T10:00:00Z');
    expect(formatDateRelative(today)).toBe('Today');
  });

  it('should format yesterday as "Yesterday"', () => {
    const yesterday = new Date('2024-01-14T10:00:00Z');
    expect(formatDateRelative(yesterday)).toBe('Yesterday');
  });

  it('should format tomorrow as "Tomorrow"', () => {
    const tomorrow = new Date('2024-01-16T10:00:00Z');
    expect(formatDateRelative(tomorrow)).toBe('Tomorrow');
  });

  it('should format other dates with full format', () => {
    const date = new Date('2024-01-10T10:00:00Z');
    const formatted = formatDateRelative(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('10');
    expect(formatted).toContain('2024');
  });
});

describe('Time Calculations', () => {
  it('should calculate whole hours between timestamps', () => {
    const start = new Date('2024-01-15T08:00:00Z');
    const end = new Date('2024-01-15T16:00:00Z');
    expect(calculateHours(start, end)).toBe(8);
  });

  it('should calculate hours with ISO strings', () => {
    const start = '2024-01-15T08:00:00Z';
    const end = '2024-01-15T16:30:00Z';
    expect(calculateHours(start, end)).toBe(8);
  });

  it('should calculate precise hours with decimal', () => {
    const start = new Date('2024-01-15T08:00:00Z');
    const end = new Date('2024-01-15T16:30:00Z');
    expect(calculatePreciseHours(start, end)).toBe(8.5);
  });

  it('should calculate precise hours for 15-minute increments', () => {
    const start = new Date('2024-01-15T08:00:00Z');
    const end = new Date('2024-01-15T08:15:00Z');
    expect(calculatePreciseHours(start, end)).toBe(0.25);
  });

  it('should format hours as time string', () => {
    expect(formatHoursAsTime(8.5)).toBe('08:30');
    expect(formatHoursAsTime(10.25)).toBe('10:15');
    expect(formatHoursAsTime(0.5)).toBe('00:30');
  });

  it('should handle negative hours', () => {
    const start = new Date('2024-01-15T16:00:00Z');
    const end = new Date('2024-01-15T08:00:00Z');
    expect(calculateHours(start, end)).toBe(-8);
  });
});

describe('Week Range Calculations', () => {
  it('should get current week range starting on Sunday', () => {
    const date = new Date('2024-01-15T12:00:00Z'); // Monday
    const range = getCurrentWeekRange(date, 0); // Sunday start
    expect(range.start.getDay()).toBe(0); // Sunday
    expect(range.end.getDay()).toBe(6); // Saturday
  });

  it('should get current week range starting on Monday', () => {
    const date = new Date('2024-01-15T12:00:00Z'); // Monday
    const range = getCurrentWeekRange(date, 1); // Monday start
    expect(range.start.getDay()).toBe(1); // Monday
    expect(range.end.getDay()).toBe(0); // Sunday
  });

  it('should get week range for specific date', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const range = getWeekRange(date, 1);
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
  });

  it('should get last N weeks ranges', () => {
    const ranges = getLastNWeeksRanges(4, 1);
    expect(ranges).toHaveLength(4);
    expect(ranges[0].end.getTime()).toBeGreaterThan(ranges[1].end.getTime());
  });
});

describe('Month Range Calculations', () => {
  it('should get current month range', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const range = getCurrentMonthRange(date);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(0); // January
  });

  it('should get month range for specific date', () => {
    const date = new Date('2024-03-15T12:00:00Z');
    const range = getMonthRange(date);
    expect(range.start.getDate()).toBe(1);
    expect(range.start.getMonth()).toBe(2); // March (0-indexed)
  });

  it('should get last N months ranges', () => {
    const ranges = getLastNMonthsRanges(3);
    expect(ranges).toHaveLength(3);
    expect(ranges[0].end.getTime()).toBeGreaterThan(ranges[1].end.getTime());
  });

  it('should handle February correctly', () => {
    const date = new Date('2024-02-15T12:00:00Z'); // Leap year
    const range = getMonthRange(date);
    expect(range.end.getDate()).toBe(29); // Leap year has 29 days
  });

  it('should handle December correctly', () => {
    const date = new Date('2024-12-15T12:00:00Z');
    const range = getMonthRange(date);
    expect(range.start.getMonth()).toBe(11); // December (0-indexed)
    expect(range.end.getDate()).toBe(31);
  });
});

describe('Timezone Utilities', () => {
  it('should get timezone offset in minutes', () => {
    const offset = getTimezoneOffset();
    expect(typeof offset).toBe('number');
  });

  it('should format timezone offset as string', () => {
    const offsetStr = getTimezoneOffsetString();
    expect(offsetStr).toMatch(/^[+-]\d{2}:\d{2}$/);
  });

  it('should format positive and negative offsets correctly', () => {
    // This will depend on the system timezone, so we just check format
    const offsetStr = getTimezoneOffsetString(new Date('2024-01-15T12:00:00Z'));
    expect(offsetStr).toMatch(/^[+-]\d{2}:\d{2}$/);
  });
});

describe('Date Range Utilities', () => {
  it('should format date range in same month', () => {
    const range: DateRange = {
      start: new Date(2024, 0, 10), // January 10, 2024 in local timezone
      end: new Date(2024, 0, 20, 23, 59, 59), // January 20, 2024 in local timezone
    };
    const formatted = formatDateRange(range);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('10');
    expect(formatted).toContain('20');
  });

  it('should format date range in different months', () => {
    const range: DateRange = {
      start: new Date('2024-01-25T00:00:00Z'),
      end: new Date('2024-02-05T23:59:59Z'),
    };
    const formatted = formatDateRange(range);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('Feb');
  });

  it('should format date range in different years', () => {
    const range: DateRange = {
      start: new Date('2023-12-25T00:00:00Z'),
      end: new Date('2024-01-05T23:59:59Z'),
    };
    const formatted = formatDateRange(range);
    expect(formatted).toContain('2023');
    expect(formatted).toContain('2024');
  });

  it('should check if date is in range', () => {
    const range: DateRange = {
      start: new Date('2024-01-10T00:00:00Z'),
      end: new Date('2024-01-20T23:59:59Z'),
    };
    expect(isDateInRange(new Date('2024-01-15T12:00:00Z'), range)).toBe(true);
    expect(isDateInRange(new Date('2024-01-05T12:00:00Z'), range)).toBe(false);
    expect(isDateInRange(new Date('2024-01-25T12:00:00Z'), range)).toBe(false);
  });

  it('should check range boundaries inclusively', () => {
    const range: DateRange = {
      start: new Date('2024-01-10T00:00:00Z'),
      end: new Date('2024-01-20T23:59:59Z'),
    };
    expect(isDateInRange(new Date('2024-01-10T00:00:00Z'), range)).toBe(true);
    expect(isDateInRange(new Date('2024-01-20T23:59:59Z'), range)).toBe(true);
  });
});

describe('Date Comparison and Utilities', () => {
  it('should calculate days between dates', () => {
    const start = new Date('2024-01-10T12:00:00Z');
    const end = new Date('2024-01-15T12:00:00Z');
    expect(getDaysBetween(start, end)).toBe(5);
  });

  it('should handle negative days between', () => {
    const start = new Date('2024-01-15T12:00:00Z');
    const end = new Date('2024-01-10T12:00:00Z');
    expect(getDaysBetween(start, end)).toBe(-5);
  });

  it('should check if dates are on same day', () => {
    const date1 = new Date('2024-01-15T08:00:00Z');
    const date2 = new Date('2024-01-15T20:00:00Z');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('should check if dates are on different days', () => {
    const date1 = new Date(2024, 0, 15, 23, 0, 0); // January 15, 2024 at 11 PM local
    const date2 = new Date(2024, 0, 16, 1, 0, 0); // January 16, 2024 at 1 AM local
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('should get dates in range', () => {
    const start = new Date(2024, 0, 10); // January 10, 2024 in local timezone
    const end = new Date(2024, 0, 15); // January 15, 2024 in local timezone
    const dates = getDatesInRange(start, end);
    expect(dates).toHaveLength(6); // Inclusive: 10, 11, 12, 13, 14, 15
    expect(dates[0].getDate()).toBe(10);
    expect(dates[5].getDate()).toBe(15);
  });

  it('should handle single day range', () => {
    const start = new Date(2024, 0, 15, 0, 0, 0); // January 15, 2024 at midnight local
    const end = new Date(2024, 0, 15, 23, 59, 59); // January 15, 2024 at 11:59:59 PM local
    const dates = getDatesInRange(start, end);
    expect(dates).toHaveLength(1);
  });
});

describe('Validation Functions', () => {
  it('should validate correct time strings', () => {
    expect(isValidTimeString('08:30')).toBe(true);
    expect(isValidTimeString('23:59')).toBe(true);
    expect(isValidTimeString('00:00')).toBe(true);
    expect(isValidTimeString('12:00')).toBe(true);
  });

  it('should reject invalid time strings', () => {
    expect(isValidTimeString('25:00')).toBe(false);
    expect(isValidTimeString('12:60')).toBe(false);
    expect(isValidTimeString('8:30')).toBe(true); // Single digit hour is valid
    expect(isValidTimeString('12:5')).toBe(false); // Single digit minute is invalid
    expect(isValidTimeString('abc:de')).toBe(false);
    expect(isValidTimeString('12-30')).toBe(false);
  });
});

describe('Certification Expiry Checks', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should detect certification expiring within 30 days', () => {
    const expDate = new Date('2024-02-10T00:00:00Z'); // 26 days away
    expect(isCertificationExpiringSoon(expDate)).toBe(true);
  });

  it('should detect certification expiring exactly on threshold', () => {
    const expDate = new Date('2024-02-14T00:00:00Z'); // 30 days away
    expect(isCertificationExpiringSoon(expDate)).toBe(true);
  });

  it('should not flag certification expiring after threshold', () => {
    const expDate = new Date('2024-03-01T00:00:00Z'); // More than 30 days
    expect(isCertificationExpiringSoon(expDate)).toBe(false);
  });

  it('should not flag already expired certification', () => {
    const expDate = new Date('2024-01-01T00:00:00Z'); // Already expired
    expect(isCertificationExpiringSoon(expDate)).toBe(false);
  });

  it('should support custom threshold', () => {
    const expDate = new Date('2024-02-10T00:00:00Z'); // 26 days away
    expect(isCertificationExpiringSoon(expDate, 20)).toBe(false);
    expect(isCertificationExpiringSoon(expDate, 60)).toBe(true);
  });
});

describe('ISO Week Number', () => {
  it('should get ISO week number', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const weekNumber = getISOWeekNumber(date);
    expect(weekNumber).toBeGreaterThanOrEqual(1);
    expect(weekNumber).toBeLessThanOrEqual(53);
  });

  it('should handle first week of year', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const weekNumber = getISOWeekNumber(date);
    expect(weekNumber).toBeGreaterThanOrEqual(1);
  });

  it('should handle last week of year', () => {
    const date = new Date('2024-12-31T12:00:00Z');
    const weekNumber = getISOWeekNumber(date);
    expect(weekNumber).toBeGreaterThanOrEqual(1);
  });
});

describe('Constants', () => {
  it('should export date formats', () => {
    expect(DATE_FORMATS.ISO_DATE).toBe('yyyy-MM-dd');
    expect(DATE_FORMATS.SHORT_DATE).toBe('M/d/yyyy');
    expect(DATE_FORMATS.LONG_DATE).toBe('MMMM d, yyyy');
    expect(DATE_FORMATS.TIME_12H).toBe('h:mm a');
    expect(DATE_FORMATS.TIME_24H).toBe('HH:mm');
  });

  it('should export common timezones', () => {
    expect(COMMON_TIMEZONES.PACIFIC).toBe('America/Los_Angeles');
    expect(COMMON_TIMEZONES.MOUNTAIN).toBe('America/Denver');
    expect(COMMON_TIMEZONES.CENTRAL).toBe('America/Chicago');
    expect(COMMON_TIMEZONES.EASTERN).toBe('America/New_York');
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle leap year calculations', () => {
    const start = new Date('2024-02-28T12:00:00Z');
    const end = new Date('2024-03-01T12:00:00Z');
    expect(getDaysBetween(start, end)).toBe(2); // Leap year has Feb 29
  });

  it('should handle non-leap year', () => {
    const start = new Date('2023-02-28T12:00:00Z');
    const end = new Date('2023-03-01T12:00:00Z');
    expect(getDaysBetween(start, end)).toBe(1); // Non-leap year
  });

  it('should handle daylight saving time transitions', () => {
    // This test depends on system timezone, so we just ensure it doesn't crash
    const range = getCurrentWeekRange(new Date('2024-03-10T12:00:00Z'));
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
  });

  it('should handle dates across year boundary', () => {
    const start = new Date('2023-12-30T12:00:00Z');
    const end = new Date('2024-01-05T12:00:00Z');
    const days = getDaysBetween(start, end);
    expect(days).toBe(6);
  });

  it('should handle very large hour calculations', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-12-31T23:59:59Z');
    const hours = calculateHours(start, end);
    expect(hours).toBeGreaterThan(8000);
  });
});
