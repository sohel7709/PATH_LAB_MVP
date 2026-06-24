import { describe, it, expect } from 'vitest';
import {
  USER_ROLES,
  REPORT_STATUS,
  TEST_CATEGORIES,
  VALIDATION_RULES,
  DATE_FORMATS,
} from '../utils/constants';

describe('Constants', () => {
  describe('USER_ROLES', () => {
    it('defines admin, technician, receptionist', () => {
      expect(USER_ROLES.ADMIN).toBe('admin');
      expect(USER_ROLES.TECHNICIAN).toBe('technician');
      expect(USER_ROLES.RECEPTIONIST).toBe('receptionist');
    });
  });

  describe('REPORT_STATUS', () => {
    it('defines all lifecycle statuses', () => {
      expect(REPORT_STATUS.PENDING).toBe('pending');
      expect(REPORT_STATUS.IN_PROGRESS).toBe('in-progress');
      expect(REPORT_STATUS.COMPLETED).toBe('completed');
      expect(REPORT_STATUS.VERIFIED).toBe('verified');
      expect(REPORT_STATUS.DELIVERED).toBe('delivered');
    });
  });

  describe('TEST_CATEGORIES', () => {
    it('defines multiple test categories', () => {
      expect(TEST_CATEGORIES.HEMATOLOGY).toBe('hematology');
      expect(TEST_CATEGORIES.BIOCHEMISTRY).toBe('biochemistry');
      expect(Object.keys(TEST_CATEGORIES).length).toBeGreaterThan(5);
    });
  });

  describe('VALIDATION_RULES', () => {
    it('has password min length of 8', () => {
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(8);
    });

    it('email regex accepts valid emails', () => {
      expect(VALIDATION_RULES.EMAIL_REGEX.test('user@example.com')).toBe(true);
      expect(VALIDATION_RULES.EMAIL_REGEX.test('bad-email')).toBe(false);
    });

    it('phone regex accepts 10+ digit numbers', () => {
      expect(VALIDATION_RULES.PHONE_REGEX.test('9876543210')).toBe(true);
      expect(VALIDATION_RULES.PHONE_REGEX.test('123')).toBe(false);
    });
  });

  describe('DATE_FORMATS', () => {
    it('has a DISPLAY format string', () => {
      expect(typeof DATE_FORMATS.DISPLAY).toBe('string');
      expect(DATE_FORMATS.DISPLAY.length).toBeGreaterThan(0);
    });
  });
});
