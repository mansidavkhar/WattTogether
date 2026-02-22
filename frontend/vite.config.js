import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Plugin to stub out Solana dependencies that Privy optionally uses
const solanaStubPlugin = () => ({
  name: 'solana-stub',
  resolveId(id) {
    // Intercept optional peer dependency imports for Solana
    if (id.includes('__vite-optional-peer-dep') && (id.includes('@solana') || id.includes('@solana-program'))) {
      return id;
    }
    // Also handle direct imports
    if (id.startsWith('@solana') || id.startsWith('@solana-program/')) {
      return id;
    }
  },
  load(id) {
    // Return module with common Solana exports
    if ((id.includes('__vite-optional-peer-dep') && (id.includes('@solana') || id.includes('@solana-program'))) ||
       id.startsWith('@solana') || id.startsWith('@solana-program/')) {
      return `
        // Stubbed Solana module - not used in this build
        export const getTransferSolInstruction = () => { throw new Error('Solana not available'); };
        export const createTransferInstruction = () => { throw new Error('Solana not available'); };
        export const getCreateAccountInstruction = () => { throw new Error('Solana not available'); };
        export const getCreateAssociatedTokenAccountInstruction = () => { throw new Error('Solana not available'); };
        export const findAssociatedTokenPda = () => { throw new Error('Solana not available'); };
        export const fetchMint = () => { throw new Error('Solana not available'); };
        export const fetchToken = () => { throw new Error('Solana not available'); };
        export const createSolanaRpc = () => { throw new Error('Solana not available'); };
        export const pipe = () => { throw new Error('Solana not available'); };
        export const createTransactionMessage = () => { throw new Error('Solana not available'); };
        export const setTransactionMessageFeePayer = () => { throw new Error('Solana not available'); };
        export const setTransactionMessageLifetimeUsingBlockhash = () => { throw new Error('Solana not available'); };
        export const appendTransactionMessageInstructions = () => { throw new Error('Solana not available'); };
        export const SYSTEM_PROGRAM_ADDRESS = 'stub';
        export const TOKEN_PROGRAM_ADDRESS = 'stub';
        export const TOKEN_2022_PROGRAM_ADDRESS = 'stub';
        export const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = 'stub';
        export const SYSVAR_RENT_ADDRESS = 'stub';
        export default {};
      `;
    }
  }
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    solanaStubPlugin(),
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
        '@solana/web3.js',
        '@solana/spl-token',
        '@solana-program/system',
        '@solana-program/token',
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
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
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
      '@solana/web3.js',
      '@solana/spl-token',
      '@solana-program/system',
      '@solana-program/token',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
