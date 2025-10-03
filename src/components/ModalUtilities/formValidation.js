/**
 * Form validation helpers for consistent validation across modals
 * @description Provides reusable validators and form validation utilities
 */

/**
 * Collection of reusable field validators
 * @type {Object}
 */
export const validators = {
  /**
   * Check if a value is not empty
   * @param {any} value - Value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {string|null} Error message or null if valid
   */
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Check minimum length
  minLength:
    min =>
    (value, fieldName = 'Field') => {
      if (value && value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return null;
    },

  // Check maximum length
  maxLength:
    max =>
    (value, fieldName = 'Field') => {
      if (value && value.length > max) {
        return `${fieldName} must be no more than ${max} characters`;
      }
      return null;
    },

  // Check if value matches a pattern
  pattern: (regex, message) => value => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  // Check if value is a valid email
  // SECURITY: ReDoS-safe email regex - replaced vulnerable [^\s@]+ patterns
  email: value => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Check if value is a number
  number: (value, fieldName = 'Field') => {
    if (value && isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  // Check if value is within a range
  range:
    (min, max) =>
    (value, fieldName = 'Field') => {
      const num = Number(value);
      if (!isNaN(num) && (num < min || num > max)) {
        return `${fieldName} must be between ${min} and ${max}`;
      }
      return null;
    },

  // Combine multiple validators
  compose:
    (...validators) =>
    (value, fieldName) => {
      for (const validator of validators) {
        const error = validator(value, fieldName);
        if (error) return error;
      }
      return null;
    },
};

/**
 * Validate a form object with multiple fields
 * @param {Object} formData - Form data object with field values
 * @param {Object} validationRules - Object mapping field names to validator functions
 * @returns {{isValid: boolean, errors: Object}} Validation result with errors object
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(fieldName => {
    const value = formData[fieldName];
    const validator = validationRules[fieldName];
    const error = validator(value, fieldName);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: !Object.keys(errors).length,
    errors,
  };
};

/**
 * Hook-like function to manage form state and validation
 * @param {Object} initialValues - Initial form field values
 * @param {Object} validationRules - Object mapping field names to validator functions
 * @returns {{validate: Function, validateField: Function}} Validation helper functions
 */
export const useFormValidation = (initialValues, validationRules) => {
  const validate = (values = initialValues) => {
    return validateForm(values, validationRules);
  };

  const validateField = (fieldName, value) => {
    if (validationRules[fieldName]) {
      return validationRules[fieldName](value, fieldName);
    }
    return null;
  };

  return {
    validate,
    validateField,
  };
};
