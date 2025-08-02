/**
 * Type definitions for typescript-pdf
 *
 * This module contains all TypeScript type definitions, interfaces,
 * and enums used throughout the library.
 *
 * @packageDocumentation
 */

// Core types
export * from './core.js';

// Layout and geometry types
export * from './geometry.js';
export * from './layout.js';
export * from './flex.js';

// Internal types for type safety
export * from './internal.js';

// Theming system - export only non-conflicting items
export type {
    ColorScheme,
    SpacingSystem,
    TypographyScale,
    TextDecorationStyle,
    TextDecorationFlag,
} from './theming.js';

export {
    TextStyleUtils,
    ThemeUtils,
    ColorSchemes,
    defaultSpacing,
} from './theming.js';