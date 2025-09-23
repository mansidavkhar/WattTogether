import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: false, // We handle this in index.html
        process: false, // We handle this in index.html
      },
      // Exclude problematic modules that conflict
      exclude: [
        'process',
        'fs',
        'path',
        'child_process',
        'net',
        'tls',
        'dns',
      ],
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util',
      assert: 'assert',
      events: 'events',
      http: 'stream-http',
      https: 'https-browserify',
      string_decoder: 'string_decoder',
      url: 'url',
      zlib: 'browserify-zlib',
      // Don't alias process - let our index.html handle it
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'buffer',
      'stream-browserify',
      'util',
      'assert',
      'events',
      'crypto-browserify',
      'https-browserify',
      'stream-http',
      'string_decoder',
      'url',
      'zlib',
    ],
    // Force exclude problematic dependencies
    exclude: [
      'node-stdlib-browser',
      '@web3auth/auth/node_modules/readable-stream',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
