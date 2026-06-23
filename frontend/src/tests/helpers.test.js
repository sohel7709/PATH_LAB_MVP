import { describe, it, expect } from 'vitest';
import {
  formatDate,
  validateEmail,
  validatePassword,
  validatePhone,
  formatCurrency,
  getStatusColor,
  truncateText,
  generateId,
} from '../utils/helpers';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('accepts a Date object', () => {
    const date = new Date('2024-06-01');
    const result = formatDate(date);
    expect(result).toMatch(/Jun 01, 2024/);
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@sub.domain.org')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('missing@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts passwords of 8+ characters', () => {
    expect(validatePassword('Password1')).toBe(true);
    expect(validatePassword('12345678')).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts valid phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('+91 9876543210')).toBe(true);
  });

  it('rejects short/invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats a number as INR currency', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('getStatusColor', () => {
  it('returns correct class for known statuses', () => {
    expect(getStatusColor('pending')).toContain('yellow');
    expect(getStatusColor('completed')).toContain('green');
    expect(getStatusColor('verified')).toContain('purple');
    expect(getStatusColor('in-progress')).toContain('blue');
    expect(getStatusColor('delivered')).toContain('gray');
  });

  it('returns default class for unknown status', () => {
    expect(getStatusColor('unknown')).toContain('gray');
    expect(getStatusColor('')).toContain('gray');
  });
});

describe('truncateText', () => {
  it('truncates text longer than maxLength', () => {
    const text = 'a'.repeat(60);
    const result = truncateText(text, 50);
    expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('does not truncate text shorter than maxLength', () => {
    const text = 'Hello World';
    expect(truncateText(text, 50)).toBe(text);
  });

  it('handles null/undefined gracefully', () => {
    expect(truncateText(null)).toBeNull();
    expect(truncateText(undefined)).toBeUndefined();
  });
});

describe('generateId', () => {
  it('generates a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('uses provided prefix', () => {
    const id = generateId('patient_');
    expect(id.startsWith('patient_')).toBe(true);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
