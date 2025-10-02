// @ts-check

/**
 * Generate a cryptographically secure random ID
 * Uses crypto API when available, falls back to timestamp-based ID
 */
export function generateSecureId(prefix = '') {
  try {
    // Use Web Crypto API (available in browsers and React Native)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // Modern browsers and Node 16.7+
      return prefix ? `${prefix}-${crypto.randomUUID()}` : crypto.randomUUID();
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Older browsers - generate UUID v4 manually
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      // Convert to hex string
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;

      return prefix ? `${prefix}-${uuid}` : uuid;
    }
  } catch (error) {
    // Silent fallback for environments where crypto isn't available
  }

  // Fallback: timestamp + random-enough string
  const timestamp = Date.now();
  const random = performance?.now() || timestamp;
  const id = `${timestamp}-${random.toString(36)}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate a short secure random string (for non-UUID use cases)
 * @param {number} length - desired length of the string
 */
export function generateSecureRandomString(length = 9) {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // eslint-disable-next-line no-secrets/no-secrets -- Base36 alphabet for ID generation, not a secret
      const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, b => chars[b % chars.length]).join('');
    }
  } catch (error) {
    // Silent fallback
  }

  // Fallback for environments without crypto
  return Date.now().toString(36);
}