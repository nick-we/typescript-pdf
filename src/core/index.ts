/**
 * Consolidated Core System - Main Exports
 * 
 * Unified exports for the streamlined core system:
 * - Document and Page management (document.ts)
 * - Font system with fallbacks (fonts.ts)
 * - Text processing utilities (text-utils.ts)
 * - PDF font engine (pdf/font-engine.ts)
 * 
 * Replaces 15+ fragmented core files with 4 focused modules
 * 
 * @packageDocumentation
 */

// Document and Page Management
export {
    Document,
    Page,
    DocumentFactory,
    PageFactory,
    PAGE_FORMATS,
    type DocumentOptions,
    type PageOptions,
    TextDirection,
} from './document.js';

// Font System
export {
    FontSystem,
    FontWeight,
    FontStyle,
    FontCategory,
    FontUtils,
    FontCollections,
    type FontSource,
    type FontLoadOptions,
    type FontDescriptor,
    type TextStyleConfig,
    type FontMetrics,
    type UniversalFont,
    type FontLoadStats,
} from './fonts.js';

// Text Processing
export {
    TextProcessor,
    TextAlign,
    TextOverflow,
    TextUtils,
    type TextStyle,
    type TextMeasurementOptions,
    type TextLine,
    type TextLayoutResult,
    type TextMeasurement,
} from './text-utils.js';

// PDF Font Engine
export {
    PdfStandardFont,
    PdfFont,
    FontRegistry,
    type PdfDocument,
} from './pdf/font-engine.js';

// Re-export types for convenience
export type { Core, Geometry, Layout } from '../types.js';