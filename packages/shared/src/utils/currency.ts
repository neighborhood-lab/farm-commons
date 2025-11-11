// Farm Commons Currency Utilities

/**
 * Supported locales for currency formatting
 */
export type SupportedLocale = 'en-US' | 'es-MX' | 'es-ES';

/**
 * Currency codes
 */
export type CurrencyCode = 'USD' | 'MXN' | 'EUR';

/**
 * Options for currency formatting
 */
export interface CurrencyFormatOptions {
  locale?: SupportedLocale;
  currency?: CurrencyCode;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Default currency format options
 */
const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  locale: 'en-US',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Format a number as currency for display
 * @param amount - The amount to format
 * @param options - Formatting options including locale and currency
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56); // "$1,234.56"
 * formatCurrency(1234.56, { locale: 'es-MX', currency: 'MXN' }); // "$1,234.56"
 * formatCurrency(1234.56, { locale: 'es-ES', currency: 'EUR' }); // "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const formatter = new Intl.NumberFormat(opts.locale, {
      style: 'currency',
      currency: opts.currency,
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits,
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    return `$${amount.toFixed(opts.maximumFractionDigits)}`;
  }
}

/**
 * Calculate hourly wages based on hours worked and hourly rate
 * @param hours - Number of hours worked
 * @param hourlyRate - Hourly rate in currency
 * @param overtimeHours - Optional overtime hours (default: 0)
 * @param overtimeMultiplier - Overtime pay multiplier (default: 1.5)
 * @returns Total wage amount
 *
 * @example
 * calculateHourlyWage(40, 15); // 600
 * calculateHourlyWage(45, 15, 5); // 712.50 (40 * 15 + 5 * 15 * 1.5)
 * calculateHourlyWage(45, 15, 5, 2); // 750 (40 * 15 + 5 * 15 * 2)
 */
export function calculateHourlyWage(
  hours: number,
  hourlyRate: number,
  overtimeHours: number = 0,
  overtimeMultiplier: number = 1.5
): number {
  if (hours < 0 || hourlyRate < 0 || overtimeHours < 0) {
    throw new Error('Hours and rates must be non-negative');
  }

  if (overtimeHours > hours) {
    throw new Error('Overtime hours cannot exceed total hours');
  }

  const regularHours = hours - overtimeHours;
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;

  return parseFloat((regularPay + overtimePay).toFixed(2));
}

/**
 * Calculate piece rate earnings based on units completed and rate per unit
 * @param units - Number of units completed
 * @param ratePerUnit - Rate paid per unit
 * @returns Total earnings from piece rate
 *
 * @example
 * calculatePieceRateEarnings(100, 0.50); // 50.00
 * calculatePieceRateEarnings(250, 1.25); // 312.50
 */
export function calculatePieceRateEarnings(
  units: number,
  ratePerUnit: number
): number {
  if (units < 0 || ratePerUnit < 0) {
    throw new Error('Units and rate must be non-negative');
  }

  return parseFloat((units * ratePerUnit).toFixed(2));
}

/**
 * Calculate mixed earnings (hourly + piece rate)
 * Useful for workers who have both hourly and piece rate components
 * @param hourlyWage - Earnings from hourly work
 * @param pieceRateEarnings - Earnings from piece rate work
 * @returns Total combined earnings
 *
 * @example
 * calculateMixedEarnings(500, 150); // 650.00
 */
export function calculateMixedEarnings(
  hourlyWage: number,
  pieceRateEarnings: number
): number {
  if (hourlyWage < 0 || pieceRateEarnings < 0) {
    throw new Error('Earnings must be non-negative');
  }

  return parseFloat((hourlyWage + pieceRateEarnings).toFixed(2));
}

/**
 * Format currency for locale-aware display with symbol
 * @param amount - The amount to format
 * @param locale - The locale to use for formatting
 * @param currency - The currency code
 * @returns Formatted currency string
 *
 * @example
 * formatCurrencyLocaleAware(1234.56, 'en-US', 'USD'); // "$1,234.56"
 * formatCurrencyLocaleAware(1234.56, 'es-MX', 'MXN'); // "$1,234.56"
 * formatCurrencyLocaleAware(1234.56, 'es-ES', 'EUR'); // "1.234,56 €"
 */
export function formatCurrencyLocaleAware(
  amount: number,
  locale: SupportedLocale = 'en-US',
  currency: CurrencyCode = 'USD'
): string {
  return formatCurrency(amount, { locale, currency });
}

/**
 * Parse currency string to number
 * Removes currency symbols and formatting to extract numeric value
 * @param currencyString - Formatted currency string
 * @returns Numeric value
 *
 * @example
 * parseCurrency("$1,234.56"); // 1234.56
 * parseCurrency("1.234,56 €"); // 1234.56
 * parseCurrency("$1,234"); // 1234.00
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols, letters, and spaces
  let cleaned = currencyString.replace(/[^\d,.-]/g, '');

  // Handle European format (comma as decimal separator)
  // If there's a comma after the last period, or comma is the last separator
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Check which comes last
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');

    if (lastComma > lastPeriod) {
      // European format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Only comma - could be European decimal or US thousands separator
    // If only one comma and it's followed by 1-2 digits, it's likely decimal
    const commaMatch = cleaned.match(/,(\d+)$/);
    if (commaMatch && commaMatch[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const value = parseFloat(cleaned);

  if (isNaN(value)) {
    throw new Error('Invalid currency string');
  }

  return parseFloat(value.toFixed(2));
}

/**
 * Calculate percentage of amount
 * Useful for calculating bonuses, deductions, taxes, etc.
 * @param amount - Base amount
 * @param percentage - Percentage (e.g., 10 for 10%)
 * @returns Calculated percentage amount
 *
 * @example
 * calculatePercentage(1000, 10); // 100.00
 * calculatePercentage(1500, 5.5); // 82.50
 */
export function calculatePercentage(amount: number, percentage: number): number {
  if (amount < 0 || percentage < 0) {
    throw new Error('Amount and percentage must be non-negative');
  }

  return parseFloat((amount * (percentage / 100)).toFixed(2));
}

/**
 * Calculate effective hourly rate from piece rate work
 * Useful for ensuring minimum wage compliance
 * @param units - Number of units completed
 * @param ratePerUnit - Rate per unit
 * @param hoursWorked - Hours spent on piece rate work
 * @returns Effective hourly rate
 *
 * @example
 * calculateEffectiveHourlyRate(100, 0.50, 4); // 12.50
 * calculateEffectiveHourlyRate(200, 0.25, 5); // 10.00
 */
export function calculateEffectiveHourlyRate(
  units: number,
  ratePerUnit: number,
  hoursWorked: number
): number {
  if (units < 0 || ratePerUnit < 0 || hoursWorked <= 0) {
    throw new Error('Invalid parameters for effective hourly rate calculation');
  }

  const totalEarnings = calculatePieceRateEarnings(units, ratePerUnit);
  return parseFloat((totalEarnings / hoursWorked).toFixed(2));
}

/**
 * Round currency amount to nearest cent
 * @param amount - Amount to round
 * @returns Rounded amount
 *
 * @example
 * roundCurrency(10.126); // 10.13
 * roundCurrency(10.124); // 10.12
 */
export function roundCurrency(amount: number): number {
  return parseFloat(amount.toFixed(2));
}
