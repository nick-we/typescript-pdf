/**
 * Common Graphics Interface
 * 
 * Defines the common interface that both PdfGraphics and FlutterGraphics implement
 * This ensures type compatibility across the coordinate system refactoring.
 * 
 * @packageDocumentation
 */

import type { Matrix4, PdfLineCap, PdfLineJoin, PdfTextRenderingMode } from './graphics.js';
import type { PdfFont } from './font.js';
import type { PdfColor } from './color.js';

/**
 * Common interface for graphics operations
 * Both PdfGraphics and FlutterGraphics implement this interface
 */
export interface GraphicsContext {
    /** Whether graphics content has been altered */
    readonly altered: boolean;

    /** Save the current graphics state */
    saveContext(): void;

    /** Restore the graphics state */
    restoreContext(): void;

    /** Move to a point */
    moveTo(x: number, y: number): void;

    /** Draw a line to a point */
    lineTo(x: number, y: number): void;

    /** Draw a rectangle */
    drawRect(x: number, y: number, width: number, height: number): void;

    /** Draw a cubic Bézier curve */
    curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;

    /** Close the current path */
    closePath(): void;

    /** Fill the current path */
    fillPath(evenOdd?: boolean): void;

    /** Stroke the current path */
    strokePath(close?: boolean): void;

    /** Fill and stroke the current path */
    fillAndStrokePath(evenOdd?: boolean, close?: boolean): void;

    /** Clip the current path for subsequent drawing operations */
    clipPath(evenOdd?: boolean): void;

    /** Set line width */
    setLineWidth(width: number): void;

    /** Set line cap style */
    setLineCap(cap: PdfLineCap): void;

    /** Set line join style */
    setLineJoin(join: PdfLineJoin): void;

    /** Set fill color */
    setFillColor(color: PdfColor): void;

    /** Set stroke color */
    setStrokeColor(color: PdfColor): void;

    /** Set both fill and stroke color */
    setColor(color: PdfColor): void;

    /** Set transformation matrix */
    setTransform(matrix: Matrix4): void;

    /** Get current transformation matrix */
    getTransform(): Matrix4;

    /** Begin text object */
    beginText(): void;

    /** End text object */
    endText(): void;

    /** Move text position */
    moveTextPosition(x: number, y: number): void;

    /** Set font and size for text rendering */
    setFont(font: PdfFont, size: number, options?: {
        charSpace?: number;
        wordSpace?: number;
        scale?: number;
        mode?: PdfTextRenderingMode;
        rise?: number;
    }): void;

    /** Draw text at current position */
    showText(text: string): void;

    /** Draw text string with font, size, and position */
    drawString(
        font: PdfFont,
        size: number,
        text: string,
        x: number,
        y: number,
        options?: {
            charSpace?: number;
            wordSpace?: number;
            scale?: number;
            mode?: PdfTextRenderingMode;
            rise?: number;
        }
    ): void;

    /** Draw a line from point to point */
    drawLine(x1: number, y1: number, x2: number, y2: number): void;
}