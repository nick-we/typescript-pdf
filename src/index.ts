/**
 * typescript-pdf - A modern TypeScript library for programmatic PDF generation
 * 
 * This is the main entry point for the typescript-pdf library.
 * It exports all public APIs and types for PDF generation.
 * 
 * @packageDocumentation
 */

// Core exports
export * from './core/index.js';

// Widget exports
export * from './widgets/index.js';

// Type exports
export type * from './types/index.js';

// Utility exports
export * from './utils/index.js';

// Version information
export const VERSION = '__VERSION__';
export const DEV = '__DEV__';