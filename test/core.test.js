import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, decodeToBytes } from '../src/index.js';

const enc = new TextEncoder();
const fromHex = (hex) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

test('empty input round-trips to empty output', () => {
  assert.equal(encode(new Uint8Array()), '');
  assert.deepEqual(decodeToBytes(''), new Uint8Array());
});

test('single byte encodes to two characters', () => {
  assert.equal(encode(fromHex('66')), 'MY');
});

test('two bytes encode to four characters', () => {
  assert.equal(encode(fromHex('666F')), 'MZXQ');
});

test('three bytes encode to five characters', () => {
  assert.equal(encode(fromHex('666F6F')), 'MZXW6');
});

test('six bytes encode to ten characters', () => {
  assert.equal(encode(fromHex('666F6F626172')), 'MZXW6YTBOI');
});

test('decode accepts lowercase input', () => {
  assert.deepEqual(decodeToBytes('mzxw6ytboi'), fromHex('666F6F626172'));
});

test('decode rejects characters outside the alphabet', () => {
  assert.throws(() => decodeToBytes('MZXW6YT1'), /Invalid Base32 character/);
});

test('decode rejects non-ASCII characters', () => {
  assert.throws(() => decodeToBytes('MZXW©'), /non-ASCII/);
});

test('round-trip preserves arbitrary bytes', () => {
  const data = fromHex('0102FFFFFF00');
  assert.deepEqual(decodeToBytes(encode(data)), data);
});

test('round-trip preserves all 256 byte values', () => {
  const all = new Uint8Array(256);
  for (let i = 0; i < 256; i++) all[i] = i;
  assert.deepEqual(decodeToBytes(encode(all)), all);
});

test('decode returns a UTF-8 string for text input', () => {
  assert.equal(decode('MZXW6YTBOI'), 'foobar');
});

test('encode rejects non-Uint8Array input', () => {
  assert.throws(() => encode([1, 2, 3]), /Uint8Array/);
});
