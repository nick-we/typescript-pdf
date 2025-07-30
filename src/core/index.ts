/**
 * Core PDF generation functionality
 * 
 * This module contains the core classes and functions for PDF document creation,
 * including Document, Page, and low-level PDF primitives.
 * 
 * @packageDocumentation
 */

// Document and page management
export { Document } from './document.js';
export { Page } from './page.js';

// PDF primitives
export * from './pdf/index.js';

// Font system and fallback
export {
    FontFallbackSystem,
    FontUtils,
    FontWeight,
    FontStyle,
    FontCategory,
    defaultFontFallback,
    type FontDescriptor,
} from './font-fallback.js';

// Text measurement and metrics
export {
    TextMetricsEngine,
    TextMeasurementUtils,
    defaultTextMetrics,
    type CharacterMetrics,
    type WordMetrics,
    type LineMetrics,
    type ParagraphMetrics,
    type EnhancedFontMetrics,
    type TextMeasurementOptions,
    type LineBreakingOptions,
} from './text-metrics.js';