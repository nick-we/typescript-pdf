/**
 * Core Interface Definitions
 * 
 * Defines interfaces for core services to break circular import dependencies.
 * These interfaces allow types.ts to reference core services without importing them directly.
 * 
 * @packageDocumentation
 */

import type { Geometry } from '../types.js';

/**
 * Font weight enumeration (duplicated from fonts.ts to avoid circular import)
 */
export enum FontWeight {
    Thin = 100,
    ExtraLight = 200,
    Light = 300,
    Normal = 400,
    Medium = 500,
    SemiBold = 600,
    Bold = 700,
    ExtraBold = 800,
    Black = 900,
}

/**
 * Font style enumeration (duplicated from fonts.ts to avoid circular import)
 */
export enum FontStyle {
    Normal = 'normal',
    Italic = 'italic',
    Oblique = 'oblique',
}

/**
 * Text measurement options interface
 */
export interface ITextMeasurementOptions {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    lineSpacing?: number;
}

/**
 * Text measurement result interface
 */
export interface ITextMeasurementResult {
    width: number;
    height: number;
    baseline: number;
    lineCount: number;
    actualLines?: string[];
}

/**
 * Font height and baseline metrics interface
 */
export interface IFontHeightMetrics {
    height: number;
    ascender: number;
    descender: number;
    baseline: number;
}

/**
 * Text measurement service interface
 * Abstracts AccurateTextMeasurementService without circular import
 */
export interface ITextMeasurementService {
    measureTextWidth(
        text: string,
        fontSize: number,
        fontFamily?: string,
        fontWeight?: FontWeight,
        fontStyle?: FontStyle
    ): number;

    measureCharWidth(
        char: string,
        fontSize: number,
        fontFamily?: string,
        fontWeight?: FontWeight,
        fontStyle?: FontStyle
    ): number;

    getFontMetrics(
        fontSize: number,
        fontFamily?: string,
        fontWeight?: FontWeight,
        fontStyle?: FontStyle,
        lineSpacing?: number
    ): IFontHeightMetrics;

    measureTextWithWrapping(
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ): ITextMeasurementResult;

    wrapTextAccurate(
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ): string[];

    truncateTextAccurate(
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions,
        ellipsis?: string
    ): string;

    getTextBounds(
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ): Geometry.Size;

    clearCache(): void;
    getCacheStats(): { measurementCache: number; fontMetricsCache: number };
}

/**
 * Universal font interface (duplicated from fonts.ts to avoid circular import)
 */
export interface IUniversalFont {
    name: string;
    fontFamily: string;
    type: 'standard' | 'ttf';
    measureTextWidth(text: string, fontSize: number): number;
    getFontHeight(fontSize: number): number;
    getAscender(fontSize: number): number;
    getDescender(fontSize: number): number;
    getUnderlyingFont(): unknown;
}

/**
 * Font system interface
 * Abstracts FontSystem without circular import
 */
export interface IFontSystem {
    getFont(fontNameOrFamily: string, name?: string): IUniversalFont;
    getFontWithStyle(
        family: string | string[],
        weight?: FontWeight,
        style?: FontStyle
    ): IUniversalFont;
    getDefaultFont(): IUniversalFont;
    getFontNames(): string[];
    getStats(): {
        standardFonts: number;
        customFonts: number;
        totalFonts: number;
        fontLoader: unknown;
    };
}

/**
 * PDF Color interface
 */
export interface IPdfColor {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
}

/**
 * Graphics context interface
 * Abstracts PdfGraphics without circular import
 */
export interface IGraphicsContext {
    // State management
    save(): void;
    restore(): void;
    saveContext(): void;
    restoreContext(): void;

    // Colors
    setFillColor(color: IPdfColor): void;
    setStrokeColor(color: IPdfColor): void;

    // Line properties
    setLineWidth(width: number): void;
    setLineDash(dashArray: number[], dashPhase?: number): void;

    // Clipping
    setClippingRect(x: number, y: number, width: number, height: number): void;
    clearClipping(): void;

    // Path operations
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    closePath(): void;

    // Drawing operations
    drawRect(x: number, y: number, width: number, height: number): void;
    drawRoundedRect(
        x: number, y: number, width: number, height: number,
        topLeft?: number, topRight?: number, bottomRight?: number, bottomLeft?: number
    ): void;

    // Path rendering
    fillPath(): void;
    strokePath(): void;
    fillAndStrokePath(): void;

    // Text rendering
    drawString(font: unknown, fontSize: number, text: string, x: number, y: number): void;
    setFont(font: unknown, fontSize: number): void;

    // Transformations
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    translate(x: number, y: number): void;
    scale(sx: number, sy: number): void;
    rotate(angle: number): void;

    // Content management
    getContent(): string;
    clear(): void;

    // Extended properties for compatibility
    readonly currentPoint: { x: number; y: number };
    readonly matrix: number[];
    readonly fontRegistry?: IFontSystem;
}

/**
 * Page options interface
 */
export interface IPageOptions {
    format?: string;
    width?: number;
    height?: number;
    margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    build?: () => unknown; // Widget
}

/**
 * Document interface
 * Abstracts Document without circular import
 */
export interface IDocument {
    readonly fontSystem: IFontSystem;
    addPage(options?: IPageOptions): unknown; // Page
    getPages(): readonly unknown[]; // Page[]
    getPageCount(): number;
    save(): Uint8Array;
    getStats(): {
        pageCount: number;
        fontStats: unknown;
    };
}

/**
 * Widget interface (minimal definition to avoid circular import)
 */
export interface IWidget {
    layout?(context: unknown): { size: Geometry.Size; needsRepaint?: boolean; baseline?: number };
    paint?(context: unknown): void;
}

/**
 * Color value types for type-safe color operations
 */
export type ColorValue =
    | string // Hex colors: "#ff0000", "#f00", "red"
    | IPdfColor // RGB object: { red: 1, green: 0, blue: 0 }
    | [number, number, number] // RGB array: [255, 0, 0]
    | [number, number, number, number] // RGBA array: [255, 0, 0, 1]
    | number; // Grayscale: 0-255 or 0-1

/**
 * Parsed color result interface
 */
export interface IParsedColor extends IPdfColor {
    hex: string;
    rgba: string;
    isValid: boolean;
}