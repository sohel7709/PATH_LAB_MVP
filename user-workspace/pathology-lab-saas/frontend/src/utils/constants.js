// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TIMEOUT: 10000, // 10 seconds
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  RECEPTIONIST: 'receptionist',
};

// Report Status
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  DELIVERED: 'delivered',
};

// Test Categories
export const TEST_CATEGORIES = {
  HEMATOLOGY: 'hematology',
  BIOCHEMISTRY: 'biochemistry',
  MICROBIOLOGY: 'microbiology',
  IMMUNOLOGY: 'immunology',
  PATHOLOGY: 'pathology',
};

// Form Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  PHONE_REGEX: /^\+?[\d\s-]{10,}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD HH:mm:ss',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    REPORT_CREATED: 'Report created successfully',
    REPORT_UPDATED: 'Report updated successfully',
    REPORT_DELETED: 'Report deleted successfully',
    SETTINGS_UPDATED: 'Settings updated successfully',
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
  },
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NETWORK: 'Network error. Please check your connection.',
    VALIDATION: 'Please check your input and try again.',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
};

// Theme Colors
export const THEME_COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

// Navigation
export const NAVIGATION = {
  DASHBOARD: '/',
  REPORTS: '/reports',
  CREATE_REPORT: '/reports/create',
  VIEW_REPORT: '/reports/:id',
  LAB_SETTINGS: '/settings/lab',
  USER_MANAGEMENT: '/settings/users',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
};

// File Upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_FILES: 5,
};

// Report Templates
export const REPORT_TEMPLATES = {
  BASIC: 'basic',
  DETAILED: 'detailed',
  COMPREHENSIVE: 'comprehensive',
};

export default {
  API_CONFIG,
  USER_ROLES,
  REPORT_STATUS,
  TEST_CATEGORIES,
  VALIDATION_RULES,
  DATE_FORMATS,
  PAGINATION,
  TOAST_MESSAGES,
  STORAGE_KEYS,
  THEME_COLORS,
  NAVIGATION,
  UPLOAD_CONFIG,
  REPORT_TEMPLATES,
};