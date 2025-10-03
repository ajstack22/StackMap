/**
 * @fileoverview Z-index layer management constants for consistent stacking order
 *
 * These constants ensure proper layering of UI elements and prevent z-index conflicts.
 * Higher values appear on top of lower values.
 *
 * @module constants/zIndex
 */

/**
 * Z-index layer system for proper stacking order
 *
 * Layers (from bottom to top):
 * - BASE: Default content layer
 * - STICKY: Headers, toolbars that stick
 * - DROPDOWN: Dropdown menus, popovers
 * - MODAL_BACKDROP: Modal overlay backgrounds
 * - MODAL: Modal dialogs
 * - NOTIFICATION: Toasts, alerts, snackbars
 * - CRITICAL: Emergency/critical UI (confirm dialogs)
 * - MAX: Maximum z-index (use sparingly)
 */
export const Z_INDEX = {
  /** 1 - Base content layer */
  BASE: 1,

  /** 10 - Elevated content (cards on hover, active states) */
  ELEVATED: 10,

  /** 100 - Sticky elements (headers, toolbars) */
  STICKY: 100,

  /** 1000 - Dropdowns, tooltips, popovers */
  DROPDOWN: 1000,

  /** 9999 - Modal backdrop/overlay */
  MODAL_BACKDROP: 9999,

  /** 10000 - Modal content */
  MODAL: 10000,

  /** 99999 - Notifications (toasts, alerts) */
  NOTIFICATION: 99999,

  /** 999999 - Critical dialogs (confirm, emergency) */
  CRITICAL: 999999,

  /** 1000000 - Maximum z-index (use only when absolutely necessary) */
  MAX: 1000000,
};

/**
 * Component-specific z-index mappings
 * Maps common components to their appropriate layer
 */
export const COMPONENT_Z_INDEX = {
  // Navigation & Headers
  HEADER: Z_INDEX.STICKY,
  TOOLBAR: Z_INDEX.STICKY,
  FAB: Z_INDEX.MODAL,

  // Dropdowns & Menus
  DROPDOWN_MENU: Z_INDEX.DROPDOWN,
  CONTEXT_MENU: Z_INDEX.DROPDOWN,
  AUTOCOMPLETE: Z_INDEX.DROPDOWN,

  // Modals & Overlays
  MODAL_OVERLAY: Z_INDEX.MODAL_BACKDROP,
  MODAL_CONTENT: Z_INDEX.MODAL,
  DRAWER: Z_INDEX.MODAL,

  // Notifications
  TOAST: Z_INDEX.NOTIFICATION,
  SNACKBAR: Z_INDEX.NOTIFICATION,
  ALERT: Z_INDEX.NOTIFICATION,

  // Critical UI
  CONFIRM_DIALOG: Z_INDEX.CRITICAL,
  ERROR_BOUNDARY: Z_INDEX.MAX,

  // Special cases
  SYNC_PROGRESS: Z_INDEX.MODAL_BACKDROP,
  CELEBRATION: Z_INDEX.MODAL_BACKDROP,
  EDIT_MODE_TOOLBAR: Z_INDEX.STICKY,
  ACTIVITY_LIBRARY_DROPDOWN: Z_INDEX.DROPDOWN,
};

/**
 * Legacy z-index values for backward compatibility
 * @deprecated Use Z_INDEX constants instead
 */
export const LEGACY_Z_INDEX = {
  Z_1: Z_INDEX.BASE,
  Z_10: Z_INDEX.ELEVATED,
  Z_100: Z_INDEX.STICKY,
  Z_1000: Z_INDEX.DROPDOWN,
  Z_9999: Z_INDEX.MODAL_BACKDROP,
  Z_10000: Z_INDEX.MODAL,
  Z_99999: Z_INDEX.NOTIFICATION,
  Z_999999: Z_INDEX.CRITICAL,
  Z_1000000: Z_INDEX.MAX,
};

/**
 * Helper function to get z-index for a component
 * @param {keyof typeof COMPONENT_Z_INDEX} component - The component name
 * @returns {number} The z-index value
 */
export const getComponentZIndex = (component) => {
  return COMPONENT_Z_INDEX[component] || Z_INDEX.BASE;
};

/**
 * Helper function to check if one element should appear above another
 * @param {number} zIndex1 - First element's z-index
 * @param {number} zIndex2 - Second element's z-index
 * @returns {boolean} True if first element appears above second
 */
export const isAbove = (zIndex1, zIndex2) => {
  return zIndex1 > zIndex2;
};

/**
 * Helper function to get next available z-index in a layer
 * Useful for stacking multiple items within the same layer
 * @param {number} baseZIndex - The base z-index for the layer
 * @param {number} offset - The offset within the layer (default: 1)
 * @returns {number} The calculated z-index
 */
export const getLayeredZIndex = (baseZIndex, offset = 1) => {
  return baseZIndex + offset;
};