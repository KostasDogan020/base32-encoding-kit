/**
 * Base32 alphabet — uppercase letters A–Z followed by digits 2–7.
 *
 * We deliberately use RFC 4648's canonical set rather than Crockford's
 * (which reserves 0/O and 1/I for human transcription) because this library
 * targets machine transport, where ambiguity is not a concern and standard
 * tooling compatibility matters more.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const DECODE_TABLE = (() => {
  // A flat lookup table avoids per-call Map overhead and keeps decode O(n).
  const t = new Int8Array(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) t[ALPHABET.charCodeAt(i)] = i;
  // Accept lowercase input silently. The format is case-insensitive, so
  // rejecting lowercase would surprise callers more than accepting it.
  for (let i = 0; i < ALPHABET.length; i++) {
    const lower = ALPHABET[i].toLowerCase();
    if (lower !== ALPHABET[i]) t[lower.charCodeAt(0)] = i;
  }
  return t;
})();

/**
 * Encodes a byte array into an uppercase Base32 string (no padding).
 *
 * Padding is omitted because the output is only ever consumed by this
 * library's decoder, which can recover the original length from the
 * character count. Omitting padding keeps URLs and logs cleaner.
 *
 * @param {Uint8Array} data
 * @returns {string}
 */
export function encode(data) {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError('encode expects a Uint8Array');
  }
  if (data.length === 0) return '';

  const out = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < data.length; i++) {
    buffer = (buffer << 8) | data[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out.push(ALPHABET[(buffer >>> bits) & 0x1f]);
    }
  }
  if (bits > 0) {
    out.push(ALPHABET[(buffer << (5 - bits)) & 0x1f]);
  }
  return out.join('');
}

/**
 * Decodes a Base32 string into a Uint8Array.
 *
 * Lowercase input is accepted. Characters outside the alphabet cause an
 * error — silently dropping them would make malformed input indistinguishable
 * from valid input in audit logs.
 *
 * @param {string} input
 * @returns {Uint8Array}
 */
export function decodeToBytes(input) {
  if (typeof input !== 'string') {
    throw new TypeError('decodeToBytes expects a string');
  }
  if (input.length === 0) return new Uint8Array(0);

  const out = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 128) {
      throw new Error(`Invalid Base32 character at index ${i}: non-ASCII`);
    }
    const value = DECODE_TABLE[code];
    if (value < 0) {
      throw new Error(`Invalid Base32 character at index ${i}`);
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/**
 * Convenience alias returning a UTF-8 string.
 *
 * Useful when the caller knows the underlying bytes are text and wants to
 * avoid a manual TextDecoder call.
 *
 * @param {string} input
 * @returns {string}
 */
export function decode(input) {
  const bytes = decodeToBytes(input);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
