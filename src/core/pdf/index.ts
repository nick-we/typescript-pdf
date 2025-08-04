/**
 * PDF Core - Main exports for PDF functionality
 * 
 * Consolidated exports for the PDF engine including document, graphics,
 * color, and font systems.
 * 
 * @packageDocumentation
 */

// Core PDF classes
export { PdfDocument, PdfPage } from './document.js';
export { PdfGraphics, PdfContentStream, Matrix4 } from './graphics.js';
export { PdfColor } from './color.js';
export { PdfFont, PdfStandardFont, FontRegistry } from './font-engine.js';

// Type exports
export type { PageSize, PdfPageOptions, PdfDocumentOptions } from './document.js';