/**
 * Flutter Graphics Wrapper
 * 
 * Provides a Flutter coordinate system interface over PDF graphics operations.
 * Automatically converts Flutter coordinates (top-left origin, Y increases downward)
 * to PDF coordinates (bottom-left origin, Y increases upward) for output.
 * 
 * This follows the dart-pdf approach where widgets work in Flutter coordinates
 * and conversion happens at the graphics output layer.
 * 
 * @packageDocumentation
 */

import { PdfGraphics, Matrix4, PdfLineCap, PdfLineJoin, PdfTextRenderingMode } from './graphics.js';
import { PdfFont } from './font.js';
import { PdfColor } from './color.js';
import { CoordinateSpace } from '../../layout/coordinate-transform.js';
import type { Point, Size } from '../../types/geometry.js';
import type { PdfOutputContext } from './types.js';
import type { GraphicsContext } from './graphics-interface.js';

/**
 * Flutter coordinate system graphics context that wraps PdfGraphics
 * All coordinates passed to this class should be in Flutter coordinate system
 */
export class FlutterGraphics implements GraphicsContext {
    private readonly pdfGraphics: PdfGraphics;
    private readonly pageHeight: number;

    constructor(pdfGraphics: PdfGraphics, pageHeight: number) {
        this.pdfGraphics = pdfGraphics;
        this.pageHeight = pageHeight;
    }

    /**
     * Whether graphics content has been altered
     */
    get altered(): boolean {
        return this.pdfGraphics.altered;
    }

    /**
     * Save the current graphics state
     */
    saveContext(): void {
        this.pdfGraphics.saveContext();
    }

    /**
     * Restore the graphics state
     */
    restoreContext(): void {
        this.pdfGraphics.restoreContext();
    }

    /**
     * Move to a point (Flutter coordinates)
     */
    moveTo(x: number, y: number): void {
        const pdfPoint = CoordinateSpace.flutterToPdf({ x, y }, this.pageHeight);
        this.pdfGraphics.moveTo(pdfPoint.x, pdfPoint.y);
    }

    /**
     * Draw a line to a point (Flutter coordinates)
     */
    lineTo(x: number, y: number): void {
        const pdfPoint = CoordinateSpace.flutterToPdf({ x, y }, this.pageHeight);
        this.pdfGraphics.lineTo(pdfPoint.x, pdfPoint.y);
    }

    /**
     * Draw a rectangle (Flutter coordinates)
     */
    drawRect(x: number, y: number, width: number, height: number): void {
        const pdfRect = CoordinateSpace.flutterRectToPdf({ x, y, width, height }, this.pageHeight);
        this.pdfGraphics.drawRect(pdfRect.x, pdfRect.y, pdfRect.width, pdfRect.height);
    }

    /**
     * Draw a cubic Bézier curve (Flutter coordinates)
     */
    curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        const pdf1 = CoordinateSpace.flutterToPdf({ x: x1, y: y1 }, this.pageHeight);
        const pdf2 = CoordinateSpace.flutterToPdf({ x: x2, y: y2 }, this.pageHeight);
        const pdf3 = CoordinateSpace.flutterToPdf({ x: x3, y: y3 }, this.pageHeight);
        this.pdfGraphics.curveTo(pdf1.x, pdf1.y, pdf2.x, pdf2.y, pdf3.x, pdf3.y);
    }

    /**
     * Close the current path
     */
    closePath(): void {
        this.pdfGraphics.closePath();
    }

    /**
     * Fill the current path
     */
    fillPath(evenOdd: boolean = false): void {
        this.pdfGraphics.fillPath(evenOdd);
    }

    /**
     * Stroke the current path
     */
    strokePath(close: boolean = false): void {
        this.pdfGraphics.strokePath(close);
    }

    /**
     * Fill and stroke the current path
     */
    fillAndStrokePath(evenOdd: boolean = false, close: boolean = false): void {
        this.pdfGraphics.fillAndStrokePath(evenOdd, close);
    }

    /**
     * Clip the current path for subsequent drawing operations
     */
    clipPath(evenOdd: boolean = false): void {
        this.pdfGraphics.clipPath(evenOdd);
    }

    /**
     * Set line width
     */
    setLineWidth(width: number): void {
        this.pdfGraphics.setLineWidth(width);
    }

    /**
     * Set line cap style
     */
    setLineCap(cap: PdfLineCap): void {
        this.pdfGraphics.setLineCap(cap);
    }

    /**
     * Set line join style
     */
    setLineJoin(join: PdfLineJoin): void {
        this.pdfGraphics.setLineJoin(join);
    }

    /**
     * Set fill color
     */
    setFillColor(color: PdfColor): void {
        this.pdfGraphics.setFillColor(color);
    }

    /**
     * Set stroke color
     */
    setStrokeColor(color: PdfColor): void {
        this.pdfGraphics.setStrokeColor(color);
    }

    /**
     * Set both fill and stroke color
     */
    setColor(color: PdfColor): void {
        this.pdfGraphics.setColor(color);
    }

    /**
     * Set transformation matrix (Flutter coordinates)
     * This will automatically handle coordinate system conversion
     */
    setTransform(matrix: Matrix4): void {
        // Convert Flutter coordinate transformation matrix to PDF coordinates
        if (matrix.values && Array.isArray(matrix.values) && matrix.values.length === 16) {
            // Extract translation values from the matrix (indices 12 and 13 for X and Y translation)
            const flutterX = matrix.values[12] || 0;
            const flutterY = matrix.values[13] || 0;

            // Convert translation to PDF coordinates
            const pdfPoint = CoordinateSpace.flutterToPdf({ x: flutterX, y: flutterY }, this.pageHeight);

            // Create a new matrix with converted translation values
            const convertedMatrix = Matrix4.identity();
            const convertedValues = (convertedMatrix as any).values;
            if (convertedValues && Array.isArray(convertedValues)) {
                // Copy all matrix values
                for (let i = 0; i < 16; i++) {
                    convertedValues[i] = matrix.values[i];
                }
                // Replace translation values with converted coordinates
                convertedValues[12] = pdfPoint.x; // X translation
                convertedValues[13] = pdfPoint.y; // Y translation
            }

            this.pdfGraphics.setTransform(convertedMatrix);
        } else {
            // Fallback for matrices without accessible values
            this.pdfGraphics.setTransform(matrix);
        }
    }

    /**
     * Get current transformation matrix
     */
    getTransform(): Matrix4 {
        return this.pdfGraphics.getTransform();
    }

    /**
     * Begin text object
     */
    beginText(): void {
        this.pdfGraphics.beginText();
    }

    /**
     * End text object
     */
    endText(): void {
        this.pdfGraphics.endText();
    }

    /**
     * Move text position (Flutter coordinates)
     */
    moveTextPosition(x: number, y: number): void {
        const pdfPoint = CoordinateSpace.flutterToPdf({ x, y }, this.pageHeight);
        this.pdfGraphics.moveTextPosition(pdfPoint.x, pdfPoint.y);
    }

    /**
     * Set font and size for text rendering
     */
    setFont(font: PdfFont, size: number, options: {
        charSpace?: number;
        wordSpace?: number;
        scale?: number;
        mode?: PdfTextRenderingMode;
        rise?: number;
    } = {}): void {
        this.pdfGraphics.setFont(font, size, options);
    }

    /**
     * Draw text at current position
     */
    showText(text: string): void {
        this.pdfGraphics.showText(text);
    }

    /**
     * Draw text string with font, size, and position (Flutter coordinates)
     */
    drawString(
        font: PdfFont,
        size: number,
        text: string,
        x: number,
        y: number,
        options: {
            charSpace?: number;
            wordSpace?: number;
            scale?: number;
            mode?: PdfTextRenderingMode;
            rise?: number;
        } = {}
    ): void {
        const pdfPoint = CoordinateSpace.flutterToPdf({ x, y }, this.pageHeight);
        this.pdfGraphics.drawString(font, size, text, pdfPoint.x, pdfPoint.y, options);
    }

    /**
     * Draw a line from point to point (Flutter coordinates)
     */
    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        const pdf1 = CoordinateSpace.flutterToPdf({ x: x1, y: y1 }, this.pageHeight);
        const pdf2 = CoordinateSpace.flutterToPdf({ x: x2, y: y2 }, this.pageHeight);
        this.pdfGraphics.drawLine(pdf1.x, pdf1.y, pdf2.x, pdf2.y);
    }

    /**
     * Get the underlying PDF graphics context for advanced operations
     * Use with caution - coordinates will be in PDF system
     */
    getPdfGraphics(): PdfGraphics {
        return this.pdfGraphics;
    }

    /**
     * Get the page height used for coordinate conversion
     */
    getPageHeight(): number {
        return this.pageHeight;
    }
}

/**
 * Factory function to create a FlutterGraphics instance
 */
export function createFlutterGraphics(
    pdfGraphics: PdfGraphics,
    pageHeight: number
): FlutterGraphics {
    return new FlutterGraphics(pdfGraphics, pageHeight);
}