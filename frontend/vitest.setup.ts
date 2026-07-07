import '@testing-library/jest-dom';

try {
  const webStream = await import('node:stream/web');
  const util = await import('node:util');

  if (typeof globalThis.ReadableStream === 'undefined') {
    globalThis.ReadableStream = webStream.ReadableStream;
  }

  if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = util.TextEncoder;
  }

  if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = util.TextDecoder;
  }
} catch {
  // jsdom / Node already provides these in most test environments.
}
