import { describe, it, expect } from 'vitest';
import { isOutsideRange } from '../utils/reportUtils';

describe('isOutsideRange', () => {
  it('returns false for null/undefined inputs', () => {
    expect(isOutsideRange(null, '10-20')).toBe(false);
    expect(isOutsideRange('15', null)).toBe(false);
    expect(isOutsideRange(null, null)).toBe(false);
  });

  it('returns false for non-numeric values', () => {
    expect(isOutsideRange('positive', '10-20')).toBe(false);
    expect(isOutsideRange('N/A', '10-20')).toBe(false);
  });

  describe('range format "min-max"', () => {
    it('returns false when value is within range', () => {
      expect(isOutsideRange('15', '10-20')).toBe(false);
      expect(isOutsideRange('10', '10-20')).toBe(false);
      expect(isOutsideRange('20', '10-20')).toBe(false);
    });

    it('returns true when value is below range', () => {
      expect(isOutsideRange('5', '10-20')).toBe(true);
    });

    it('returns true when value is above range', () => {
      expect(isOutsideRange('25', '10-20')).toBe(true);
    });

    it('handles ranges with spaces: "10 - 20"', () => {
      expect(isOutsideRange('15', '10 - 20')).toBe(false);
      expect(isOutsideRange('25', '10 - 20')).toBe(true);
    });
  });

  describe('range format "< max" (literal)', () => {
    it('returns false when value is below max', () => {
      expect(isOutsideRange('5', '< 10')).toBe(false);
    });

    it('returns true when value equals or exceeds max', () => {
      expect(isOutsideRange('10', '< 10')).toBe(true);
      expect(isOutsideRange('15', '< 10')).toBe(true);
    });
  });

  describe('range format "&lt; max" (HTML entity)', () => {
    it('returns false when value is below max', () => {
      expect(isOutsideRange('5', '&lt; 10')).toBe(false);
    });

    it('returns true when value equals or exceeds max', () => {
      expect(isOutsideRange('10', '&lt; 10')).toBe(true);
      expect(isOutsideRange('15', '&lt; 10')).toBe(true);
    });
  });

  describe('range format "≤ max"', () => {
    it('returns false when value is at or below max', () => {
      expect(isOutsideRange('10', '≤ 10')).toBe(false);
      expect(isOutsideRange('5', '≤ 10')).toBe(false);
    });

    it('returns true when value exceeds max', () => {
      expect(isOutsideRange('11', '≤ 10')).toBe(true);
    });
  });

  describe('range format "> min" (literal)', () => {
    it('returns false when value exceeds min', () => {
      expect(isOutsideRange('15', '> 10')).toBe(false);
    });

    it('returns true when value is at or below min', () => {
      expect(isOutsideRange('10', '> 10')).toBe(true);
      expect(isOutsideRange('5', '> 10')).toBe(true);
    });
  });

  describe('range format "&gt; min" (HTML entity)', () => {
    it('returns false when value exceeds min', () => {
      expect(isOutsideRange('15', '&gt; 10')).toBe(false);
    });

    it('returns true when value is at or below min', () => {
      expect(isOutsideRange('10', '&gt; 10')).toBe(true);
      expect(isOutsideRange('5', '&gt; 10')).toBe(true);
    });
  });

  describe('text range format', () => {
    it('handles "less than X" format', () => {
      expect(isOutsideRange('5', 'less than 10')).toBe(false);
      expect(isOutsideRange('10', 'less than 10')).toBe(true);
    });

    it('handles "greater than X" format', () => {
      expect(isOutsideRange('15', 'greater than 10')).toBe(false);
      expect(isOutsideRange('10', 'greater than 10')).toBe(true);
    });
  });

  it('handles comma-separated numbers like "1,200"', () => {
    expect(isOutsideRange('1,500', '1000-2000')).toBe(false);
    expect(isOutsideRange('2,500', '1000-2000')).toBe(true);
  });
});
