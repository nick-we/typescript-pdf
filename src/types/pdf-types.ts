/**
 * PDF-specific type definitions
 * Replaces all unknown types with proper interfaces
 */

import type { Geometry, Layout } from '../types.js';
import type { Widget } from '../widgets/base.js';

/**
 * PDF Font interface for type-safe font operations
 * Replaces all `unknown` font references with proper typing
 */
export interface IPdfFont {
    readonly name: string;
    readonly fontName: string;
    readonly type: 'standard' | 'ttf';
    measureTextWidth(text: string, fontSize: number): number;
    getFontHeight(fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
    getPdfFontName(): string;
    ref(): string;
    getId(): number;
    getMetrics?(): FontMetrics;
}

/**
 * Font metrics interface for detailed font measurements
 */
export interface FontMetrics {
    widths: number[];
    ascender: number;
    descender: number;
    capHeight: number;
    xHeight: number;
    unitsPerEm: number;
}

/**
 * Page interface for document pages
 * Replaces `unknown` page references
 */
export interface IPage {
    readonly size: Geometry.Size;
    readonly margins: Layout.EdgeInsets;
    readonly format?: string;
    readonly orientation?: 'portrait' | 'landscape';
    renderWidget(widget: Widget): void;
    getGraphicsContext(): IGraphicsContext;
}

/**
 * PDF Object interface for document objects
 */
export interface IPdfObject {
    getId(): number;
    ref(): string;
    serialize?(): string;
}

/**
 * Font loader interface for type-safe font loading
 */
export interface IFontLoader {
    readonly loadCount: number;
    loadFont?(fontData: Uint8Array): Promise<IPdfFont>;
    registerFont?(fontFamily: string, fontData: Uint8Array): void;
}

/**
 * Graphics path interface for clipping and drawing
 */
export interface IGraphicsPath {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    closePath(): void;
}

/**
 * Soft mask interface for graphics operations
 */
export interface ISoftMask {
    type: 'alpha' | 'luminosity';
    subtype: string;
    group?: IPdfObject;
}

/**
 * Metadata type definitions
 * Replaces Record<string, unknown> with specific types
 */
export interface ChartMetadata {
    label?: string;
    value?: number;
    color?: string;
    category?: string;
    series?: string;
    tooltip?: string;
}

export interface TableCellMetadata {
    rowSpan?: number;
    colSpan?: number;
    alignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'middle' | 'bottom';
    backgroundColor?: string;
    textColor?: string;
}

export interface DocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    language?: string;
}

export interface StyleMetadata {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    fontStyle?: string;
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    padding?: number;
    margin?: number;
}

/**
 * Cell data interface for table cells
 * Replaces unknown data types
 */
export interface ICellData {
    content?: string;
    data?: string | number | boolean | Date;
    text?: string;
    value?: string | number | boolean | Date;
    metadata?: TableCellMetadata;
}

/**
 * Font statistics interface
 * Replaces unknown font stats
 */
export interface IFontStats {
    standardFonts: number;
    customFonts: number;
    totalFonts: number;
    fontLoader: IFontLoader;
}

/**
 * Document statistics interface
 * Replaces unknown document stats
 */
export interface IDocumentStats {
    pageCount: number;
    fontStats: IFontStats;
    totalSize?: number;
    compressionRatio?: number;
}

/**
 * Forward declaration to avoid circular imports
 */
export interface IGraphicsContext {
    // Will be properly defined in core-interfaces.ts
    save(): void;
    restore(): void;
    drawString(font: IPdfFont, fontSize: number, text: string, x: number, y: number): void;
    setFont(font: IPdfFont, fontSize: number): void;
}

/**
 * Type guards for runtime type checking
 * Provides type-safe way to validate objects
 */
export function isPdfFont(obj: unknown): obj is IPdfFont {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'measureTextWidth' in obj &&
        typeof (obj).measureTextWidth === 'function' &&
        'getFontHeight' in obj &&
        typeof (obj).getFontHeight === 'function'
    );
}

export function isPage(obj: unknown): obj is IPage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'size' in obj &&
        'margins' in obj &&
        'renderWidget' in obj &&
        typeof (obj).renderWidget === 'function'
    );
}

export function isWidget(obj: unknown): obj is Widget {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'layout' in obj &&
        'paint' in obj &&
        typeof (obj).layout === 'function' &&
        typeof (obj).paint === 'function'
    );
}

export function isPdfObject(obj: unknown): obj is IPdfObject {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'getId' in obj &&
        'ref' in obj &&
        typeof (obj).getId === 'function' &&
        typeof (obj).ref === 'function'
    );
}

export function isCellData(obj: unknown): obj is ICellData {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        ('content' in obj || 'data' in obj || 'text' in obj || 'value' in obj)
    );
}

/**
 * Type assertion helpers
 * Provides runtime type checking with error messages
 */
export function assertPdfFont(obj: unknown, context?: string): asserts obj is IPdfFont {
    if (!isPdfFont(obj)) {
        throw new TypeError(
            `Expected PDF font object${context ? ` in ${context}` : ''}, got ${typeof obj}`
        );
    }
}

export function assertWidget(obj: unknown, context?: string): asserts obj is Widget {
    if (!isWidget(obj)) {
        throw new TypeError(
            `Expected Widget object${context ? ` in ${context}` : ''}, got ${typeof obj}`
        );
    }
}

export function assertPage(obj: unknown, context?: string): asserts obj is IPage {
    if (!isPage(obj)) {
        throw new TypeError(
            `Expected Page object${context ? ` in ${context}` : ''}, got ${typeof obj}`
        );
    }
}

/**
 * Utility types for common patterns
 */
export type MetadataMap<T extends ChartMetadata | TableCellMetadata | DocumentMetadata | StyleMetadata> = Map<string, T>;

export type FontMap = Map<string, IPdfFont>;

export type PageCollection = readonly IPage[];

/**
 * Configuration interfaces
 */
export interface IPdfFontConfig {
    family: string;
    weight?: number;
    style?: string;
    data?: Uint8Array;
}

export interface IPageConfig {
    format?: string;
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: Layout.EdgeInsets;
}