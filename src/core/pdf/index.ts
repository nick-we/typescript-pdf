/**
 * PDF Core - Main exports for PDF functionality
 *
 * Consolidated exports for the PDF engine including document, graphics,
 * color, and font systems.
 *
 * @packageDocumentation
 */

// Core PDF classes
export { PdfDocument, PdfPage } from '@/core/pdf/document.js';
export { PdfGraphics, PdfContentStream, Matrix4 } from '@/core/pdf/graphics.js';
export { PdfColor } from '@/core/pdf/color.js';
export {
    PdfFont,
    PdfStandardFont,
    FontRegistry,
} from '@/core/pdf/font-engine.js';

// Type exports
export type {
    PageSize,
    PdfPageOptions,
    PdfDocumentOptions,
} from '@/core/pdf/document.js';
