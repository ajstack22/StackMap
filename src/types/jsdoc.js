// @ts-check
/**
 * JSDoc type definitions for gradual TypeScript migration
 * These can be imported and used in JS files with @ts-check
 */

/**
 * @typedef {import('./index').User} User
 * @typedef {import('./index').Activity} Activity
 * @typedef {import('./index').Day} Day
 * @typedef {import('./index').LibraryCategory} LibraryCategory
 * @typedef {import('./index').LibraryActivity} LibraryActivity
 * @typedef {import('./index').ThemeName} ThemeName
 * @typedef {import('./index').Theme} Theme
 * @typedef {import('./index').CelebrationType} CelebrationType
 * @typedef {import('./index').SyncData} SyncData
 * @typedef {import('./index').ExportData} ExportData
 * @typedef {import('./index').AppState} AppState
 * @typedef {import('./index').AppSettings} AppSettings
 */

/**
 * @typedef {import('./stores').UserStore} UserStore
 * @typedef {import('./stores').SettingsStore} SettingsStore
 * @typedef {import('./stores').LibraryStore} LibraryStore
 * @typedef {import('./stores').SyncStore} SyncStore
 * @typedef {import('./stores').AppStore} AppStore
 */

/**
 * Common React Native prop types
 * @typedef {Object} ViewStyle
 * @typedef {Object} TextStyle
 * @typedef {Object} ImageStyle
 * @typedef {ViewStyle | TextStyle | ImageStyle} StyleProp
 */

/**
 * @typedef {Object} Insets
 * @property {number} top
 * @property {number} bottom
 * @property {number} left
 * @property {number} right
 */

/**
 * @typedef {Object} IconProps
 * @property {string} name
 * @property {number} [size]
 * @property {string} [color]
 * @property {StyleProp} [style]
 */

/**
 * @typedef {Object} ModalProps
 * @property {boolean} visible
 * @property {() => void} onClose
 * @property {Theme} theme
 * @property {Insets} insets
 */

// Export empty object to make this a module
export {};
