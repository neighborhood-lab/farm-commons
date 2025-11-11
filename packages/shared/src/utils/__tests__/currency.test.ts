import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  calculateHourlyWage,
  calculatePieceRateEarnings,
  calculateMixedEarnings,
  formatCurrencyLocaleAware,
  parseCurrency,
  calculatePercentage,
  calculateEffectiveHourlyRate,
  roundCurrency,
} from '../currency';

describe('formatCurrency', () => {
  it('should format currency in US locale by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('should format currency in US locale explicitly', () => {
    expect(formatCurrency(1234.56, { locale: 'en-US', currency: 'USD' })).toBe('$1,234.56');
  });

  it('should format currency in Mexican locale', () => {
    const result = formatCurrency(1234.56, { locale: 'es-MX', currency: 'MXN' });
    // Mexican peso uses $ symbol
    expect(result).toContain('1,234.56');
    expect(result).toContain('$');
  });

  it('should format currency in European locale', () => {
    const result = formatCurrency(1234.56, { locale: 'es-ES', currency: 'EUR' });
    // European format uses comma as decimal separator and period as thousands separator
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
    expect(result).toContain('€');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-100.5);
    expect(result).toContain('100.50');
    expect(result).toContain('-');
  });

  it('should respect custom fraction digits', () => {
    expect(
      formatCurrency(10.1, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    ).toBe('$10');

    expect(
      formatCurrency(10.12345, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })
    ).toBe('$10.123');
  });

  it('should handle very large amounts', () => {
    const result = formatCurrency(999999999.99);
    expect(result).toContain('999,999,999.99');
  });

  it('should handle very small amounts', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
    expect(formatCurrency(0.001)).toBe('$0.00');
  });
});

describe('calculateHourlyWage', () => {
  it('should calculate simple hourly wage', () => {
    expect(calculateHourlyWage(40, 15)).toBe(600);
    expect(calculateHourlyWage(8, 10)).toBe(80);
    expect(calculateHourlyWage(0, 15)).toBe(0);
  });

  it('should calculate wage with overtime', () => {
    // 40 hours at $15 + 5 overtime hours at $15 * 1.5
    expect(calculateHourlyWage(45, 15, 5)).toBe(712.5);
    // 40 hours at $20 + 10 overtime hours at $20 * 1.5
    expect(calculateHourlyWage(50, 20, 10)).toBe(1100);
  });

  it('should calculate wage with custom overtime multiplier', () => {
    // 40 hours at $15 + 5 overtime hours at $15 * 2
    expect(calculateHourlyWage(45, 15, 5, 2)).toBe(750);
    // 35 hours at $10 + 5 overtime hours at $10 * 1.5
    expect(calculateHourlyWage(40, 10, 5, 1.5)).toBe(425);
  });

  it('should handle decimal hours', () => {
    expect(calculateHourlyWage(7.5, 10)).toBe(75);
    // 40.5 total hours with 0.5 OT: (40 regular * 15) + (0.5 OT * 15 * 1.5) = 600 + 11.25 = 611.25
    expect(calculateHourlyWage(40.5, 15, 0.5, 1.5)).toBe(611.25);
  });

  it('should throw error for negative hours', () => {
    expect(() => calculateHourlyWage(-5, 15)).toThrow('Hours and rates must be non-negative');
  });

  it('should throw error for negative hourly rate', () => {
    expect(() => calculateHourlyWage(40, -15)).toThrow('Hours and rates must be non-negative');
  });

  it('should throw error for negative overtime hours', () => {
    expect(() => calculateHourlyWage(40, 15, -5)).toThrow('Hours and rates must be non-negative');
  });

  it('should throw error when overtime exceeds total hours', () => {
    expect(() => calculateHourlyWage(40, 15, 45)).toThrow(
      'Overtime hours cannot exceed total hours'
    );
  });

  it('should handle zero overtime hours explicitly', () => {
    expect(calculateHourlyWage(40, 15, 0)).toBe(600);
  });
});

describe('calculatePieceRateEarnings', () => {
  it('should calculate piece rate earnings', () => {
    expect(calculatePieceRateEarnings(100, 0.5)).toBe(50);
    expect(calculatePieceRateEarnings(250, 1.25)).toBe(312.5);
    expect(calculatePieceRateEarnings(1000, 0.1)).toBe(100);
  });

  it('should handle zero units', () => {
    expect(calculatePieceRateEarnings(0, 0.5)).toBe(0);
  });

  it('should handle zero rate', () => {
    expect(calculatePieceRateEarnings(100, 0)).toBe(0);
  });

  it('should handle decimal units', () => {
    expect(calculatePieceRateEarnings(100.5, 2)).toBe(201);
    expect(calculatePieceRateEarnings(75.25, 0.5)).toBe(37.63);
  });

  it('should handle decimal rates', () => {
    expect(calculatePieceRateEarnings(100, 0.125)).toBe(12.5);
    expect(calculatePieceRateEarnings(50, 2.75)).toBe(137.5);
  });

  it('should throw error for negative units', () => {
    expect(() => calculatePieceRateEarnings(-100, 0.5)).toThrow(
      'Units and rate must be non-negative'
    );
  });

  it('should throw error for negative rate', () => {
    expect(() => calculatePieceRateEarnings(100, -0.5)).toThrow(
      'Units and rate must be non-negative'
    );
  });

  it('should round to 2 decimal places', () => {
    expect(calculatePieceRateEarnings(33, 0.33)).toBe(10.89);
    expect(calculatePieceRateEarnings(7, 1.43)).toBe(10.01);
  });
});

describe('calculateMixedEarnings', () => {
  it('should calculate combined earnings', () => {
    expect(calculateMixedEarnings(500, 150)).toBe(650);
    expect(calculateMixedEarnings(1000, 250.5)).toBe(1250.5);
  });

  it('should handle zero hourly wage', () => {
    expect(calculateMixedEarnings(0, 150)).toBe(150);
  });

  it('should handle zero piece rate earnings', () => {
    expect(calculateMixedEarnings(500, 0)).toBe(500);
  });

  it('should handle both zero', () => {
    expect(calculateMixedEarnings(0, 0)).toBe(0);
  });

  it('should throw error for negative hourly wage', () => {
    expect(() => calculateMixedEarnings(-500, 150)).toThrow('Earnings must be non-negative');
  });

  it('should throw error for negative piece rate earnings', () => {
    expect(() => calculateMixedEarnings(500, -150)).toThrow('Earnings must be non-negative');
  });

  it('should handle decimal values', () => {
    expect(calculateMixedEarnings(123.45, 67.89)).toBe(191.34);
  });
});

describe('formatCurrencyLocaleAware', () => {
  it('should format in US locale', () => {
    expect(formatCurrencyLocaleAware(1234.56, 'en-US', 'USD')).toBe('$1,234.56');
  });

  it('should format in Mexican locale', () => {
    const result = formatCurrencyLocaleAware(1234.56, 'es-MX', 'MXN');
    expect(result).toContain('1,234.56');
    expect(result).toContain('$');
  });

  it('should format in European locale', () => {
    const result = formatCurrencyLocaleAware(1234.56, 'es-ES', 'EUR');
    expect(result).toContain('€');
  });

  it('should use defaults when no parameters provided', () => {
    const result = formatCurrencyLocaleAware(100);
    expect(result).toBe('$100.00');
  });
});

describe('parseCurrency', () => {
  it('should parse US formatted currency', () => {
    expect(parseCurrency('$1,234.56')).toBe(1234.56);
    expect(parseCurrency('$1,000')).toBe(1000);
    expect(parseCurrency('$0.50')).toBe(0.5);
  });

  it('should parse European formatted currency', () => {
    expect(parseCurrency('1.234,56 €')).toBe(1234.56);
    expect(parseCurrency('1.000,00')).toBe(1000);
  });

  it('should parse currency without symbols', () => {
    expect(parseCurrency('1234.56')).toBe(1234.56);
    expect(parseCurrency('1,234.56')).toBe(1234.56);
  });

  it('should handle negative amounts', () => {
    expect(parseCurrency('-$100.50')).toBe(-100.5);
    expect(parseCurrency('($100.50)')).toBe(-100.5);
  });

  it('should handle amounts with only commas as thousands separator', () => {
    expect(parseCurrency('$1,234,567.89')).toBe(1234567.89);
    expect(parseCurrency('1,000,000')).toBe(1000000);
  });

  it('should handle amounts with comma as decimal separator', () => {
    expect(parseCurrency('100,50')).toBe(100.5);
    expect(parseCurrency('99,99')).toBe(99.99);
  });

  it('should handle plain numbers', () => {
    expect(parseCurrency('100')).toBe(100);
    expect(parseCurrency('0.01')).toBe(0.01);
  });

  it('should throw error for invalid currency strings', () => {
    expect(() => parseCurrency('abc')).toThrow('Invalid currency string');
    expect(() => parseCurrency('')).toThrow('Invalid currency string');
    expect(() => parseCurrency('$$$')).toThrow('Invalid currency string');
  });

  it('should handle various currency symbols', () => {
    expect(parseCurrency('€1.234,56')).toBe(1234.56);
    expect(parseCurrency('£1,234.56')).toBe(1234.56);
    expect(parseCurrency('¥1234')).toBe(1234);
  });

  it('should round to 2 decimal places', () => {
    expect(parseCurrency('$10.126')).toBe(10.13);
    expect(parseCurrency('$10.123')).toBe(10.12);
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage of amount', () => {
    expect(calculatePercentage(1000, 10)).toBe(100);
    expect(calculatePercentage(1500, 5.5)).toBe(82.5);
    expect(calculatePercentage(200, 15)).toBe(30);
  });

  it('should handle zero percentage', () => {
    expect(calculatePercentage(1000, 0)).toBe(0);
  });

  it('should handle zero amount', () => {
    expect(calculatePercentage(0, 10)).toBe(0);
  });

  it('should handle 100 percent', () => {
    expect(calculatePercentage(1000, 100)).toBe(1000);
  });

  it('should handle percentage greater than 100', () => {
    expect(calculatePercentage(100, 200)).toBe(200);
  });

  it('should handle decimal percentages', () => {
    expect(calculatePercentage(1000, 0.5)).toBe(5);
    expect(calculatePercentage(1000, 12.5)).toBe(125);
  });

  it('should throw error for negative amount', () => {
    expect(() => calculatePercentage(-1000, 10)).toThrow(
      'Amount and percentage must be non-negative'
    );
  });

  it('should throw error for negative percentage', () => {
    expect(() => calculatePercentage(1000, -10)).toThrow(
      'Amount and percentage must be non-negative'
    );
  });

  it('should round to 2 decimal places', () => {
    expect(calculatePercentage(100, 33.33)).toBe(33.33);
    expect(calculatePercentage(100, 66.66)).toBe(66.66);
  });
});

describe('calculateEffectiveHourlyRate', () => {
  it('should calculate effective hourly rate', () => {
    expect(calculateEffectiveHourlyRate(100, 0.5, 4)).toBe(12.5);
    expect(calculateEffectiveHourlyRate(200, 0.25, 5)).toBe(10);
    expect(calculateEffectiveHourlyRate(150, 1, 10)).toBe(15);
  });

  it('should handle single hour', () => {
    expect(calculateEffectiveHourlyRate(10, 5, 1)).toBe(50);
  });

  it('should handle decimal hours', () => {
    expect(calculateEffectiveHourlyRate(100, 0.5, 2.5)).toBe(20);
  });

  it('should handle decimal units', () => {
    expect(calculateEffectiveHourlyRate(125.5, 0.5, 5)).toBe(12.55);
  });

  it('should throw error for negative units', () => {
    expect(() => calculateEffectiveHourlyRate(-100, 0.5, 4)).toThrow(
      'Invalid parameters for effective hourly rate calculation'
    );
  });

  it('should throw error for negative rate', () => {
    expect(() => calculateEffectiveHourlyRate(100, -0.5, 4)).toThrow(
      'Invalid parameters for effective hourly rate calculation'
    );
  });

  it('should throw error for zero hours', () => {
    expect(() => calculateEffectiveHourlyRate(100, 0.5, 0)).toThrow(
      'Invalid parameters for effective hourly rate calculation'
    );
  });

  it('should throw error for negative hours', () => {
    expect(() => calculateEffectiveHourlyRate(100, 0.5, -4)).toThrow(
      'Invalid parameters for effective hourly rate calculation'
    );
  });

  it('should calculate high effective rates', () => {
    // Fast worker completing 500 units at $0.5 in 5 hours
    expect(calculateEffectiveHourlyRate(500, 0.5, 5)).toBe(50);
  });

  it('should calculate low effective rates', () => {
    // Slow worker completing 50 units at $0.5 in 10 hours
    expect(calculateEffectiveHourlyRate(50, 0.5, 10)).toBe(2.5);
  });
});

describe('roundCurrency', () => {
  it('should round to 2 decimal places', () => {
    expect(roundCurrency(10.126)).toBe(10.13);
    expect(roundCurrency(10.124)).toBe(10.12);
    expect(roundCurrency(10.125)).toBe(10.13);
  });

  it('should handle already rounded values', () => {
    expect(roundCurrency(10.12)).toBe(10.12);
    expect(roundCurrency(10)).toBe(10);
  });

  it('should handle negative values', () => {
    expect(roundCurrency(-10.126)).toBe(-10.13);
    expect(roundCurrency(-10.124)).toBe(-10.12);
  });

  it('should handle zero', () => {
    expect(roundCurrency(0)).toBe(0);
    expect(roundCurrency(0.001)).toBe(0);
  });

  it('should handle very small amounts', () => {
    expect(roundCurrency(0.004)).toBe(0);
    expect(roundCurrency(0.005)).toBe(0.01);
    expect(roundCurrency(0.014)).toBe(0.01);
  });

  it('should handle large amounts', () => {
    expect(roundCurrency(999999.999)).toBe(1000000);
    expect(roundCurrency(123456.789)).toBe(123456.79);
  });
});

describe('Currency utilities - Integration tests', () => {
  it('should calculate weekly pay for hourly worker with overtime', () => {
    // Worker worked 45 hours at $15/hr with 5 hours overtime
    const wage = calculateHourlyWage(45, 15, 5);
    expect(wage).toBe(712.5);
    expect(formatCurrency(wage)).toBe('$712.50');
  });

  it('should calculate weekly pay for piece rate worker', () => {
    // Worker picked 500 units at $0.50 per unit
    const earnings = calculatePieceRateEarnings(500, 0.5);
    expect(earnings).toBe(250);
    expect(formatCurrency(earnings)).toBe('$250.00');
  });

  it('should calculate mixed pay', () => {
    // Worker has hourly base + piece rate bonus
    const hourlyPay = calculateHourlyWage(40, 12);
    const bonusPay = calculatePieceRateEarnings(100, 0.5);
    const totalPay = calculateMixedEarnings(hourlyPay, bonusPay);
    expect(totalPay).toBe(530);
    expect(formatCurrency(totalPay)).toBe('$530.00');
  });

  it('should verify minimum wage compliance', () => {
    // Worker completed 200 units at $0.25/unit in 8 hours
    const effectiveRate = calculateEffectiveHourlyRate(200, 0.25, 8);
    expect(effectiveRate).toBe(6.25);

    // Check if below minimum wage ($15/hr)
    const isCompliant = effectiveRate >= 15;
    expect(isCompliant).toBe(false);
  });

  it('should calculate payroll deductions', () => {
    const grossPay = 1000;
    const taxRate = 15; // 15% tax
    const taxAmount = calculatePercentage(grossPay, taxRate);
    const netPay = grossPay - taxAmount;

    expect(taxAmount).toBe(150);
    expect(netPay).toBe(850);
    expect(formatCurrency(netPay)).toBe('$850.00');
  });

  it('should format payroll for multiple locales', () => {
    const amount = 1234.56;

    const usDollars = formatCurrencyLocaleAware(amount, 'en-US', 'USD');
    const mexicanPesos = formatCurrencyLocaleAware(amount, 'es-MX', 'MXN');
    const euros = formatCurrencyLocaleAware(amount, 'es-ES', 'EUR');

    expect(usDollars).toBe('$1,234.56');
    expect(mexicanPesos).toContain('1,234.56');
    expect(euros).toContain('€');
  });

  it('should parse and recalculate currency', () => {
    const original = '$1,234.56';
    const parsed = parseCurrency(original);
    const formatted = formatCurrency(parsed);

    expect(parsed).toBe(1234.56);
    expect(formatted).toBe('$1,234.56');
  });
});
