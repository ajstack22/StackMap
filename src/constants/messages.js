/**
 * Centralized message constants for StackMap
 *
 * This file contains all user-facing messages, error messages, and validation messages
 * used throughout the application. By centralizing these strings, we ensure consistency
 * and make it easier to update messages or add internationalization in the future.
 */

/**
 * Error messages displayed to users when operations fail
 */
export const ERROR_MESSAGES = {
  // Sync errors
  SYNC_FAILED: 'Failed to sync data. Please try again.',
  SYNC_INVALID_ID: 'Invalid sync ID or device ID format',
  SYNC_INVALID_RESPONSE: 'Invalid response format from server',
  SYNC_NETWORK_ERROR: 'Network error. Please check your connection.',
  SYNC_SERVER_ERROR: 'Server error. Please try again later.',
  SYNC_NOT_ENABLED: 'Sync must be enabled to perform this action',
  SYNC_INVALID_PHRASE: 'Recovery phrase does not match this sync group',
  SYNC_NO_PHRASE: 'Recovery phrase required to decrypt sync data',
  SYNC_JOIN_FAILED: 'Failed to join sync',
  SYNC_CREATE_FAILED: 'Failed to create share link',
  SYNC_DELETE_FAILED: 'Failed to delete sync data',

  // Validation errors
  VALIDATION_REQUIRED: 'This field is required',
  VALIDATION_INVALID_FORMAT: 'Invalid format',
  VALIDATION_INVALID_DATA: 'Invalid data format',
  VALIDATION_INVALID_JSON: 'Invalid JSON file',
  VALIDATION_FILE_TOO_LARGE: 'File is too large',
  VALIDATION_UNSUPPORTED_FILE: 'Unsupported file type',

  // Activity errors
  ACTIVITY_NAME_REQUIRED: 'Activity name cannot be empty',
  ACTIVITY_ICON_REQUIRED: 'Please select an emoji for the activity',
  ACTIVITY_DATA_REQUIRED: 'Activity data is required',

  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_NAME_REQUIRED: 'User name is required',

  // PIN errors
  PIN_REQUIRED: 'PIN is required',
  PIN_MISMATCH: 'PINs do not match',
  PIN_INCORRECT: 'Incorrect PIN',
  PIN_SET_FAILED: 'Failed to set PIN',
  PIN_REMOVE_FAILED: 'Failed to remove PIN',

  // Import/Export errors
  IMPORT_FAILED: 'Failed to import data',
  EXPORT_FAILED: 'Failed to export data',
  IMPORT_INVALID_FILE: 'Invalid StackMap export file',

  // Generic errors
  OPERATION_FAILED: 'Operation failed',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  NOT_IMPLEMENTED: 'This feature is not yet implemented',
  PERMISSION_DENIED: 'Permission denied',

  // Platform-specific errors
  LOCATION_ACCESS_DENIED: 'Location access denied',
  CLIPBOARD_FAILED: 'Failed to access clipboard',
  STORAGE_FAILED: 'Failed to access storage',
};

/**
 * Success messages displayed when operations complete successfully
 */
export const SUCCESS_MESSAGES = {
  // Sync success
  SYNC_COMPLETE: 'Sync completed successfully',
  SYNC_ENABLED: 'Sync enabled',
  SYNC_DISABLED: 'Sync disabled',
  SYNC_JOINED: 'Successfully joined sync group',
  SYNC_CREATED: 'Sync group created',
  SYNC_DELETED: 'Sync data deleted',

  // Activity success
  ACTIVITY_ADDED: 'Activity added successfully',
  ACTIVITY_UPDATED: 'Activity updated successfully',
  ACTIVITY_DELETED: 'Activity deleted successfully',
  ACTIVITY_COPIED: 'Activity copied to your library!',

  // User success
  USER_ADDED: 'User added successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',

  // PIN success
  PIN_SET: 'PIN set successfully',
  PIN_REMOVED: 'PIN removed successfully',
  PIN_VERIFIED: 'PIN verified successfully',

  // Import/Export success
  IMPORT_SUCCESS: 'Data imported successfully',
  EXPORT_SUCCESS: 'Data exported successfully',

  // Clipboard success
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  PASTED_FROM_CLIPBOARD: 'Pasted successfully!',

  // Generic success
  SAVED: 'Saved successfully',
  DELETED: 'Deleted successfully',
  UPDATED: 'Updated successfully',
  OPERATION_SUCCESS: 'Operation completed successfully',
};

/**
 * Validation messages for form fields
 */
export const VALIDATION_MESSAGES = {
  // Required fields
  FIELD_REQUIRED: 'This field is required',
  NAME_REQUIRED: 'Name is required',
  ICON_REQUIRED: 'Icon is required',

  // Format validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please enter a valid date',

  // Length validation
  TOO_SHORT: 'Too short',
  TOO_LONG: 'Too long',
  MIN_LENGTH: 'Minimum length is',
  MAX_LENGTH: 'Maximum length is',

  // PIN validation
  PIN_LENGTH: 'PIN must be 4 digits',
  PIN_NUMERIC: 'PIN must contain only numbers',
  PIN_CONFIRM: 'Please confirm your PIN',
  PIN_NO_MATCH: 'PINs do not match',

  // Recovery phrase validation
  PHRASE_INVALID: 'Invalid recovery phrase format',
  PHRASE_LENGTH: 'Recovery phrase must be 32 characters',
  PHRASE_FORMAT: 'Recovery phrase must contain only letters and numbers',

  // Invite code validation
  INVITE_INVALID: 'Invalid invite code',
  INVITE_EXPIRED: 'Invite code has expired',

  // File validation
  FILE_REQUIRED: 'Please select a file',
  FILE_TYPE_INVALID: 'Invalid file type',
  FILE_SIZE_EXCEEDED: 'File size exceeds limit',
};

/**
 * User interface text and labels
 */
export const UI_TEXT = {
  // Button labels
  BUTTON_OK: 'OK',
  BUTTON_CANCEL: 'Cancel',
  BUTTON_SAVE: 'Save',
  BUTTON_DELETE: 'Delete',
  BUTTON_EDIT: 'Edit',
  BUTTON_ADD: 'Add',
  BUTTON_CLOSE: 'Close',
  BUTTON_CONFIRM: 'Confirm',
  BUTTON_RETRY: 'Retry',
  BUTTON_SKIP: 'Skip',
  BUTTON_NEXT: 'Next',
  BUTTON_BACK: 'Back',
  BUTTON_DONE: 'Done',

  // Placeholder text
  PLACEHOLDER_NAME: 'Enter name',
  PLACEHOLDER_DESCRIPTION: 'Enter description (optional)',
  PLACEHOLDER_SEARCH: 'Search...',
  PLACEHOLDER_PIN: 'Enter 4-digit PIN',
  PLACEHOLDER_CONFIRM_PIN: 'Confirm PIN',
  PLACEHOLDER_EMOJI: 'Search, type, or paste emoji...',

  // Accessibility labels
  ARIA_CLOSE: 'Close',
  ARIA_MENU: 'Menu',
  ARIA_SETTINGS: 'Settings',
  ARIA_DELETE: 'Delete',
  ARIA_EDIT: 'Edit',
  ARIA_ADD: 'Add',
  ARIA_MOVE_UP: 'Move up',
  ARIA_MOVE_DOWN: 'Move down',
  ARIA_EXPAND: 'Expand',
  ARIA_COLLAPSE: 'Collapse',
  ARIA_SELECT: 'Select',
  ARIA_TOGGLE: 'Toggle',

  // Confirmation messages
  CONFIRM_DELETE: 'Are you sure you want to delete this?',
  CONFIRM_CANCEL: 'Are you sure you want to cancel? Unsaved changes will be lost.',
  CONFIRM_OVERWRITE: 'This will overwrite existing data. Continue?',
  CONFIRM_LOGOUT: 'Are you sure you want to log out?',

  // Status messages
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  SYNCING: 'Syncing...',
  PROCESSING: 'Processing...',
  PLEASE_WAIT: 'Please wait...',
  NO_DATA: 'No data available',
  NO_RESULTS: 'No results found',
  EMPTY_STATE: 'Nothing here yet',
};

/**
 * Time-related messages
 */
export const TIME_MESSAGES = {
  EXPIRED: 'Expired',
  SECONDS_AGO: 'seconds ago',
  MINUTE_AGO: '1 minute ago',
  MINUTES_AGO: 'minutes ago',
  HOUR_AGO: '1 hour ago',
  HOURS_AGO: 'hours ago',
  DAY_AGO: '1 day ago',
  DAYS_AGO: 'days ago',
  WEEK_AGO: '1 week ago',
  WEEKS_AGO: 'weeks ago',
  MONTH_AGO: '1 month ago',
  MONTHS_AGO: 'months ago',
};

/**
 * Helper function to get formatted error message
 * @param {string} key - Error message key
 * @param {Object} params - Optional parameters for message formatting
 * @returns {string} Formatted error message
 */
export const getErrorMessage = (key, params = {}) => {
  const message = ERROR_MESSAGES[key] || ERROR_MESSAGES.UNKNOWN_ERROR;

  // Simple parameter replacement
  return Object.keys(params).reduce((msg, param) => {
    return msg.replace(`{${param}}`, params[param]);
  }, message);
};

/**
 * Helper function to get formatted success message
 * @param {string} key - Success message key
 * @param {Object} params - Optional parameters for message formatting
 * @returns {string} Formatted success message
 */
export const getSuccessMessage = (key, params = {}) => {
  const message = SUCCESS_MESSAGES[key] || SUCCESS_MESSAGES.OPERATION_SUCCESS;

  // Simple parameter replacement
  return Object.keys(params).reduce((msg, param) => {
    return msg.replace(`{${param}}`, params[param]);
  }, message);
};