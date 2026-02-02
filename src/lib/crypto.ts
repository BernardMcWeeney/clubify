// Encryption utilities for sensitive data (tokens, etc.)
// Uses Web Crypto API compatible with Cloudflare Workers

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

// Derive a crypto key from the encryption secret
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('clubify-token-encryption'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:ciphertext
 */
export async function encrypt(plaintext: string, secret: string): Promise<string> {
  if (!plaintext) return plaintext;
  if (!secret) {
    console.warn('No encryption secret provided, storing plaintext');
    return plaintext;
  }

  const key = await deriveKey(secret);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV and ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:ciphertext
 */
export async function decrypt(encrypted: string, secret: string): Promise<string> {
  if (!encrypted) return encrypted;
  if (!secret) {
    console.warn('No encryption secret provided, returning as-is');
    return encrypted;
  }

  // Check if this looks like encrypted data (base64 with sufficient length)
  // If not, it might be legacy plaintext - return as-is
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

    // Minimum length check: IV (12 bytes) + at least 1 byte ciphertext + 16 byte auth tag
    if (combined.length < IV_LENGTH + 17) {
      // Probably not encrypted, return as-is (legacy data)
      return encrypted;
    }

    const key = await deriveKey(secret);
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (error) {
    // If decryption fails, it might be legacy plaintext data
    // Log warning but return the original value
    console.warn('Decryption failed, returning original value (may be legacy plaintext)');
    return encrypted;
  }
}

/**
 * Check if a value appears to be encrypted
 * (base64 encoded with sufficient length for IV + ciphertext)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  try {
    const decoded = atob(value);
    // Encrypted values should be at least IV (12) + ciphertext (1+) + auth tag (16)
    return decoded.length >= 29;
  } catch {
    return false;
  }
}

/**
 * Encrypt multiple token fields in an object
 */
export async function encryptTokens<T extends Record<string, any>>(
  data: T,
  secret: string,
  tokenFields: (keyof T)[]
): Promise<T> {
  const result = { ...data };
  for (const field of tokenFields) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = await encrypt(result[field] as string, secret);
    }
  }
  return result;
}

/**
 * Decrypt multiple token fields in an object
 */
export async function decryptTokens<T extends Record<string, any>>(
  data: T,
  secret: string,
  tokenFields: (keyof T)[]
): Promise<T> {
  const result = { ...data };
  for (const field of tokenFields) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = await decrypt(result[field] as string, secret);
    }
  }
  return result;
}
