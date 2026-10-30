# base32-encoding-kit

Encodes and decodes binary data to and from a case-insensitive Base32 text format with no padding.

## Usage

```js
import { encode, decode, decodeToBytes } from 'base32-encoding-kit';

const bytes = new TextEncoder().encode('hello');
const encoded = encode(bytes);            // "NBSWY3DP"
const decoded = decode(encoded);          // "hello"
const raw = decodeToBytes('NBSWY3DP');    // Uint8Array of the original bytes
```

## Why this exists

The library provides a small, dependency-free Base32 codec for situations where you need to transport binary data through a medium that only handles alphanumeric text safely (URL path segments, log lines, DNS labels). Base64's `+` and `/` would require escaping there; Base32 avoids that entirely at the cost of roughly 60% output expansion versus Base64's 33%.

## Edge cases

- **No padding.** The decoder recovers the original length from the character count, so `=` padding is never produced or expected. Output from other Base32 implementations that includes padding will be rejected.
- **Case-insensitive.** Lowercase input is accepted and treated identically to uppercase. Output is always uppercase.
- **Strict alphabet.** Only `A–Z` and `2–7` are valid. Characters like `0`, `1`, `8`, `9`, and `=` are rejected with an error rather than silently dropped, so malformed input is visible.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

