import type { FunctionIdleState } from '../types';
import { coerceState } from './storage';

const PREFIX = 'FI2.';
const KEY = 'FunctionIdle';

function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function xorBytes(input: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) out[i] = input[i] ^ key[i % key.length];
  return out;
}

function base64Encode(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return base64Encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return base64Decode(normalized + pad);
}

export function encodeState(state: FunctionIdleState): string {
  const json = JSON.stringify(state);
  const data = toBytes(json);
  const key = toBytes(KEY);
  const mixed = xorBytes(data, key);
  return PREFIX + base64UrlEncode(mixed);
}

export function decodeState(raw: string, now: number): FunctionIdleState | null {
  const text = raw.trim();
  if (!text) return null;

  if (text.startsWith(PREFIX)) {
    try {
      const payload = text.slice(PREFIX.length);
      const bytes = base64UrlDecode(payload);
      const key = toBytes(KEY);
      const decoded = xorBytes(bytes, key);
      const json = fromBytes(decoded);
      const parsed: unknown = JSON.parse(json);
      return coerceState(parsed, now);
    } catch {
      return null;
    }
  }

  try {
    const parsed: unknown = JSON.parse(text);
    return coerceState(parsed, now);
  } catch {
    return null;
  }
}

