// Farm Commons Shared Utilities

import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string, formatStr = 'HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Calculate hours between two dates
 */
export function calculateHours(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInHours(endDate, startDate);
}

/**
 * Calculate precise hours with minutes as decimal
 */
export function calculatePreciseHours(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  const minutes = differenceInMinutes(endDate, startDate);
  return parseFloat((minutes / 60).toFixed(2));
}

/**
 * Format hours as HH:MM
 */
export function formatHoursAsTime(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Check if certification is expiring soon (within 30 days)
 */
export function isCertificationExpiringSoon(expirationDate: Date | string): boolean {
  const expDate = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
  const daysUntilExpiry = differenceInHours(expDate, new Date()) / 24;
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = sanitizePhone(phone);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Generate initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Calculate wage from hours and rate
 */
export function calculateWage(hours: number, hourlyRate: number): number {
  return parseFloat((hours * hourlyRate).toFixed(2));
}

/**
 * Check if time string is valid (HH:MM format)
 */
export function isValidTimeString(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
