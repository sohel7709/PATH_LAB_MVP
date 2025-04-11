import { format, parseISO } from 'date-fns';
import { REPORT_STATUS, DATE_FORMATS, VALIDATION_RULES } from './constants';

// Date formatting
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// Form validation helpers
export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email);
};

export const validatePassword = (password) => {
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
};

export const validatePhone = (phone) => {
  return VALIDATION_RULES.PHONE_REGEX.test(phone);
};

// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    [REPORT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
    [REPORT_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [REPORT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
    [REPORT_STATUS.VERIFIED]: 'bg-purple-100 text-purple-800',
    [REPORT_STATUS.DELIVERED]: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Generate random ID
export const generateId = (prefix = '') => {
  return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Sort array of objects by key
export const sortByKey = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] < b[key] ? -1 : 1;
    } else {
      return a[key] > b[key] ? -1 : 1;
    }
  });
};

// Filter array of objects
export const filterArrayByKey = (array, key, value) => {
  return array.filter(item => item[key].toLowerCase().includes(value.toLowerCase()));
};

// Group array of objects by key
export const groupByKey = (array, key) => {
  return array.reduce((hash, obj) => {
    if (obj[key] === undefined) return hash;
    return Object.assign(hash, { [obj[key]]: (hash[obj[key]] || []).concat(obj) });
  }, {});
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Format phone number
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumber;
};

// Check if object is empty
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Remove HTML tags from string
export const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default {
  formatDate,
  validateEmail,
  validatePassword,
  validatePhone,
  formatCurrency,
  getStatusColor,
  truncateText,
  generateId,
  deepClone,
  debounce,
  formatFileSize,
  sortByKey,
  filterArrayByKey,
  groupByKey,
  calculateAge,
  formatPhoneNumber,
  isEmptyObject,
  stripHtml,
};