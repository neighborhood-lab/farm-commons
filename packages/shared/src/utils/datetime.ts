/**
 * Date/Time Utility Functions
 *
 * Common date/time operations for Farm Commons
 * - Format dates for display (i18n ready)
 * - Calculate hours between timestamps
 * - Week/month range calculations
 * - Timezone handling utilities
 */

import {
  format,
  parseISO,
  differenceInHours,
  differenceInMinutes,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  endOfDay,
} from 'date-fns';

// Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FormatOptions {
  locale?: string;
}

/**
 * Parse a date string or Date object into a Date
 */
function parseDate(date: Date | string): Date {
  return typeof date === 'string' ? parseISO(date) : date;
}

/**
 * Format a date for display (i18n ready)
 *
 * @param date - Date or ISO string
 * @param formatStr - Format pattern (default: 'yyyy-MM-dd')
 * @param options - Optional locale
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  formatStr = 'yyyy-MM-dd',
  options?: FormatOptions
): string {
  const dateObj = parseDate(date);
  return format(dateObj, formatStr);
}

/**
 * Format time for display
 *
 * @param date - Date or ISO string
 * @param formatStr - Format pattern (default: 'HH:mm')
 * @param options - Optional locale
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  formatStr = 'HH:mm',
  options?: FormatOptions
): string {
  const dateObj = parseDate(date);
  return format(dateObj, formatStr);
}

/**
 * Format date and time together (i18n ready)
 *
 * @param date - Date or ISO string
 * @param options - Optional locale
 * @returns Formatted datetime string
 */
export function formatDateTime(
  date: Date | string,
  options?: FormatOptions
): string {
  const dateObj = parseDate(date);
  const formatStr = 'MMM d, yyyy HH:mm';
  return format(dateObj, formatStr);
}

/**
 * Format date in a human-friendly way (e.g., "Today", "Yesterday", or date)
 *
 * @param date - Date or ISO string
 * @param options - Optional timezone
 * @returns Human-friendly date string
 */
export function formatDateRelative(
  date: Date | string,
  options?: FormatOptions
): string {
  const dateObj = parseDate(date);
  const now = new Date();
  const today = startOfDay(now);
  const dateDay = startOfDay(dateObj);

  const diffDays = Math.floor((dateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';

  return formatDate(dateObj, 'MMM d, yyyy', options);
}

/**
 * Calculate hours between two timestamps
 *
 * @param start - Start date or ISO string
 * @param end - End date or ISO string
 * @returns Whole hours difference
 */
export function calculateHours(start: Date | string, end: Date | string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  return differenceInHours(endDate, startDate);
}

/**
 * Calculate precise hours with minutes as decimal
 *
 * @param start - Start date or ISO string
 * @param end - End date or ISO string
 * @returns Precise hours with decimal (e.g., 8.5 for 8 hours 30 minutes)
 */
export function calculatePreciseHours(start: Date | string, end: Date | string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const minutes = differenceInMinutes(endDate, startDate);
  return parseFloat((minutes / 60).toFixed(2));
}

/**
 * Format hours as HH:MM display
 *
 * @param hours - Number of hours (can be decimal)
 * @returns Formatted time string (e.g., "08:30")
 */
export function formatHoursAsTime(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get the start and end of the current week
 *
 * @param date - Reference date (default: now)
 * @param weekStartsOn - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns DateRange with week start and end
 */
export function getCurrentWeekRange(
  date: Date | string = new Date(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): DateRange {
  const dateObj = parseDate(date);
  return {
    start: startOfWeek(dateObj, { weekStartsOn }),
    end: endOfWeek(dateObj, { weekStartsOn }),
  };
}

/**
 * Get the start and end of a specific week
 *
 * @param date - Any date within the desired week
 * @param weekStartsOn - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns DateRange with week start and end
 */
export function getWeekRange(
  date: Date | string,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): DateRange {
  const dateObj = parseDate(date);
  return {
    start: startOfWeek(dateObj, { weekStartsOn }),
    end: endOfWeek(dateObj, { weekStartsOn }),
  };
}

/**
 * Get the start and end of the current month
 *
 * @param date - Reference date (default: now)
 * @returns DateRange with month start and end
 */
export function getCurrentMonthRange(date: Date | string = new Date()): DateRange {
  const dateObj = parseDate(date);
  return {
    start: startOfMonth(dateObj),
    end: endOfMonth(dateObj),
  };
}

/**
 * Get the start and end of a specific month
 *
 * @param date - Any date within the desired month
 * @returns DateRange with month start and end
 */
export function getMonthRange(date: Date | string): DateRange {
  const dateObj = parseDate(date);
  return {
    start: startOfMonth(dateObj),
    end: endOfMonth(dateObj),
  };
}

/**
 * Get date ranges for the last N weeks
 *
 * @param weeks - Number of weeks to go back
 * @param weekStartsOn - Day of week to start (0 = Sunday, 1 = Monday)
 * @returns Array of DateRanges, most recent first
 */
export function getLastNWeeksRanges(
  weeks: number,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): DateRange[] {
  const ranges: DateRange[] = [];
  const today = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekDate = addWeeks(today, -i);
    ranges.push(getWeekRange(weekDate, weekStartsOn));
  }

  return ranges;
}

/**
 * Get date ranges for the last N months
 *
 * @param months - Number of months to go back
 * @returns Array of DateRanges, most recent first
 */
export function getLastNMonthsRanges(months: number): DateRange[] {
  const ranges: DateRange[] = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const monthDate = addMonths(today, -i);
    ranges.push(getMonthRange(monthDate));
  }

  return ranges;
}

/**
 * Get timezone offset in minutes for a date
 * Note: Returns the local timezone offset. For full timezone support, consider date-fns-tz
 *
 * @param date - Date or ISO string
 * @returns Offset in minutes
 */
export function getTimezoneOffset(date: Date | string = new Date()): number {
  const dateObj = parseDate(date);
  return dateObj.getTimezoneOffset();
}

/**
 * Get timezone offset as a string (e.g., "-08:00")
 *
 * @param date - Date or ISO string
 * @returns Offset string
 */
export function getTimezoneOffsetString(date: Date | string = new Date()): string {
  const offset = getTimezoneOffset(date);
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format a date range as a string
 *
 * @param range - DateRange object
 * @param options - Optional timezone
 * @returns Formatted string (e.g., "Jan 1 - Jan 7, 2024")
 */
export function formatDateRange(range: DateRange, options?: FormatOptions): string {
  const startYear = range.start.getFullYear();
  const endYear = range.end.getFullYear();

  if (startYear === endYear) {
    const startMonth = format(range.start, 'MMM');
    const endMonth = format(range.end, 'MMM');

    if (startMonth === endMonth) {
      // Same month and year
      return `${format(range.start, 'MMM d')} - ${format(range.end, 'd, yyyy')}`;
    } else {
      // Same year, different months
      return `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`;
    }
  } else {
    // Different years
    return `${format(range.start, 'MMM d, yyyy')} - ${format(range.end, 'MMM d, yyyy')}`;
  }
}

/**
 * Check if a date is within a range
 *
 * @param date - Date to check
 * @param range - DateRange to check against
 * @returns True if date is within range (inclusive)
 */
export function isDateInRange(date: Date | string, range: DateRange): boolean {
  const dateObj = parseDate(date);
  return dateObj >= range.start && dateObj <= range.end;
}

/**
 * Get the number of days between two dates
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of days (can be negative if end is before start)
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = startOfDay(parseDate(start));
  const endDate = startOfDay(parseDate(end));
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are on the same day
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  return format(d1, 'yyyy-MM-dd') === format(d2, 'yyyy-MM-dd');
}

/**
 * Get an array of dates between start and end (inclusive)
 *
 * @param start - Start date
 * @param end - End date
 * @returns Array of Date objects for each day in range
 */
export function getDatesInRange(start: Date | string, end: Date | string): Date[] {
  const dates: Date[] = [];
  const startDate = startOfDay(parseDate(start));
  const endDate = startOfDay(parseDate(end));

  let currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Validate if a string is a valid time format (HH:MM)
 *
 * @param time - Time string to validate
 * @returns True if valid time format
 */
export function isValidTimeString(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Check if certification is expiring soon (within specified days)
 *
 * @param expirationDate - Expiration date
 * @param daysThreshold - Days threshold (default: 30)
 * @returns True if expiring within threshold
 */
export function isCertificationExpiringSoon(
  expirationDate: Date | string,
  daysThreshold = 30
): boolean {
  const expDate = parseDate(expirationDate);
  const daysUntilExpiry = getDaysBetween(new Date(), expDate);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= daysThreshold;
}

/**
 * Get the ISO week number for a date
 *
 * @param date - Date or ISO string
 * @returns ISO week number (1-53)
 */
export function getISOWeekNumber(date: Date | string): number {
  const dateObj = parseDate(date);
  return parseInt(format(dateObj, 'I'), 10);
}

/**
 * Common date formats for different use cases
 */
export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  SHORT_DATE: 'M/d/yyyy',
  LONG_DATE: 'MMMM d, yyyy',
  SHORT_DATETIME: 'M/d/yyyy h:mm a',
  LONG_DATETIME: 'MMMM d, yyyy h:mm a',
  TIME_12H: 'h:mm a',
  TIME_24H: 'HH:mm',
  MONTH_YEAR: 'MMMM yyyy',
  SHORT_MONTH_YEAR: 'MMM yyyy',
} as const;

/**
 * Common timezones for farm operations (IANA timezone identifiers)
 * Note: For full timezone conversion support, consider using date-fns-tz
 */
export const COMMON_TIMEZONES = {
  PACIFIC: 'America/Los_Angeles',
  MOUNTAIN: 'America/Denver',
  CENTRAL: 'America/Chicago',
  EASTERN: 'America/New_York',
} as const;
