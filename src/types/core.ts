/**
 * Core type definitions for typescript-pdf
 * 
 * Contains fundamental types for PDF document structure
 * 
 * @packageDocumentation
 */

/**
 * Page configuration options
 * 
 * TODO: Expand based on dart-pdf PageFormat and page options
 */
export interface PageOptions {
    /** Page width in points (optional, defaults to A4) */
    width?: number;

    /** Page height in points (optional, defaults to A4) */
    height?: number;

    /** Page margins */
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };

    /** Page orientation */
    orientation?: 'portrait' | 'landscape';

    /** Build function for page content */
    build?: () => unknown;
}

/**
 * Document metadata
 * 
 * TODO: Expand based on PDF metadata requirements
 */
export interface DocumentInfo {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
}

/**
 * PDF generation options
 */
export interface PdfOptions {
    /** Document metadata */
    info?: DocumentInfo;

    /** Compression level (0-9) */
    compress?: number;

    /** PDF version */
    version?: string;
}