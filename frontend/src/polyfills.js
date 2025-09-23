// src/polyfills.js - FINAL VERSION
import { Buffer } from 'buffer';

// Just set Buffer, everything else is handled by index.html
globalThis.Buffer = Buffer;

// Ensure our process is still intact
if (!globalThis.process || typeof globalThis.process.nextTick !== 'function') {
  console.error('Process was overwritten! Restoring...');
  
  const createNextTick = () => {
    return function(cb, ...args) {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => cb.apply(null, args));
      } else {
        Promise.resolve().then(() => cb.apply(null, args));
      }
    };
  };
  
  globalThis.process = {
    env: {},
    browser: true,
    version: 'v16.0.0',
    nextTick: createNextTick()
  };
}

export {};
