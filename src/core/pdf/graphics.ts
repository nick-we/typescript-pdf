/**
 * PDF Graphics Context - Simplified Graphics Operations
 * 
 * Provides essential PDF drawing operations for the consolidated
 * typescript-pdf system.
 * 
 * @packageDocumentation
 */

import { PdfColor } from './color.js';
import type { PdfFont } from './font-engine.js';

/**
 * PDF content stream for graphics operations
 */
export class PdfContentStream {
    private content: string[] = [];

    /**
     * Write content to stream
     */
    write(content: string): void {
        this.content.push(content);
    }

    /**
     * Get stream content
     */
    getContent(): string {
        return this.content.join('');
    }

    /**
     * Clear stream
     */
    clear(): void {
        this.content = [];
    }
}

/**
 * Graphics context state
 */
interface GraphicsState {
    fillColor: PdfColor;
    strokeColor: PdfColor;
    lineWidth: number;
    font: PdfFont | undefined;
    fontSize: number;
}

/**
 * 4x4 transformation matrix for graphics operations
 */
export class Matrix4 {
    public elements: number[];

    constructor(elements?: number[]) {
        this.elements = elements ?? [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    static identity(): Matrix4 {
        return new Matrix4();
    }

    static translation(x: number, y: number, z: number = 0): Matrix4 {
        return new Matrix4([
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        ]);
    }

    multiply(other: Matrix4): Matrix4 {
        const a = this.elements;
        const b = other.elements;
        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] =
                    (a[i * 4 + 0] ?? 0) * (b[0 * 4 + j] ?? 0) +
                    (a[i * 4 + 1] ?? 0) * (b[1 * 4 + j] ?? 0) +
                    (a[i * 4 + 2] ?? 0) * (b[2 * 4 + j] ?? 0) +
                    (a[i * 4 + 3] ?? 0) * (b[3 * 4 + j] ?? 0);
            }
        }

        return new Matrix4(result);
    }

    /**
     * Get values array (compatibility property)
     */
    get values(): number[] {
        return [...this.elements];
    }
}

/**
 * PDF Graphics Context - Main drawing interface
 */
export class PdfGraphics {
    public readonly contentStream: PdfContentStream;
    public readonly context: GraphicsState;
    public readonly contextStack: GraphicsState[] = [];
    public indent = 0;

    // Additional properties to match expected interface
    public currentPoint = { x: 0, y: 0 };
    public path: Array<{ type: string; points: number[] }> = [];
    public matrix = [1, 0, 0, 1, 0, 0]; // Identity matrix
    public clipPath: unknown = null;
    public textMatrix = [1, 0, 0, 1, 0, 0];
    public charSpacing = 0;
    public wordSpacing = 0;
    public horizontalScaling = 100;
    public leading = 0;
    public textRenderingMode = 0;
    public textRise = 0;
    public currentFont?: PdfFont;
    public currentFontSize = 12;
    public dashArray: number[] = [];
    public dashPhase = 0;
    public miterLimit = 10;
    public lineCapStyle = 0;
    public lineJoinStyle = 0;
    public flatness = 1;
    public graphicsStateName?: string;
    public softMask?: unknown;
    public blendMode = 'Normal';
    public strokeAlpha = 1;
    public fillAlpha = 1;

    constructor() {
        this.contentStream = new PdfContentStream();
        this.context = {
            fillColor: PdfColor.black,
            strokeColor: PdfColor.black,
            lineWidth: 1,
            font: undefined,
            fontSize: 12,
        };
    }

    /**
     * Save graphics state
     */
    save(): void {
        this.contextStack.push({ ...this.context });
        this.contentStream.write('q\n');
    }

    /**
     * Restore graphics state
     */
    restore(): void {
        if (this.contextStack.length > 0) {
            const state = this.contextStack.pop();
            if (state) {
                this.context.fillColor = state.fillColor;
                this.context.strokeColor = state.strokeColor;
                this.context.lineWidth = state.lineWidth;
                this.context.font = state.font;
                this.context.fontSize = state.fontSize;
            }
        }
        this.contentStream.write('Q\n');
    }

    /**
     * Save context (alias for save)
     */
    saveContext(): void {
        this.save();
    }

    /**
     * Restore context (alias for restore)
     */
    restoreContext(): void {
        this.restore();
    }

    /**
     * Set transform matrix
     */
    setTransform(matrix: Matrix4): void {
        const m = matrix.elements;
        this.transform(
            m[0] ?? 1, m[1] ?? 0, m[4] ?? 0,
            m[5] ?? 1, m[12] ?? 0, m[13] ?? 0
        );
    }

    /**
     * Curve to point (cubic Bezier curve)
     */
    curveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.contentStream.write(`${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} c\n`);
        this.currentPoint = { x, y };
    }

    /**
     * Font registry (placeholder for compatibility)
     */
    get fontRegistry(): unknown {
        return null; // Will be implemented when needed
    }

    /**
     * Set fill color
     */
    setFillColor(color: PdfColor): void {
        this.context.fillColor = color;
        this.contentStream.write(`${color.red} ${color.green} ${color.blue} rg\n`);
    }

    /**
     * Set stroke color
     */
    setStrokeColor(color: PdfColor): void {
        this.context.strokeColor = color;
        this.contentStream.write(`${color.red} ${color.green} ${color.blue} RG\n`);
    }

    /**
     * Set line width
     */
    setLineWidth(width: number): void {
        this.context.lineWidth = width;
        this.contentStream.write(`${width} w\n`);
    }

    /**
     * Set line dash pattern
     */
    setLineDash(dashArray: number[], dashPhase: number = 0): void {
        this.dashArray = dashArray;
        this.dashPhase = dashPhase;

        if (dashArray.length === 0) {
            // Solid line
            this.contentStream.write('[] 0 d\n');
        } else {
            // Dashed line
            const dashPattern = '[' + dashArray.join(' ') + ']';
            this.contentStream.write(`${dashPattern} ${dashPhase} d\n`);
        }
    }

    /**
     * Set clipping rectangle for content overflow control
     */
    setClippingRect(x: number, y: number, width: number, height: number): void {
        this.save();
        this.drawRect(x, y, width, height);
        this.contentStream.write('W n\n'); // Set clipping path and end path without stroking
    }

    /**
     * Clear clipping (restore graphics state)
     */
    clearClipping(): void {
        this.restore();
    }

    /**
     * Move to point
     */
    moveTo(x: number, y: number): void {
        this.currentPoint = { x, y };
        this.contentStream.write(`${x} ${y} m\n`);
    }

    /**
     * Line to point
     */
    lineTo(x: number, y: number): void {
        this.currentPoint = { x, y };
        this.contentStream.write(`${x} ${y} l\n`);
    }

    /**
     * Draw rectangle
     */
    drawRect(x: number, y: number, width: number, height: number): void {
        this.contentStream.write(`${x} ${y} ${width} ${height} re\n`);
    }

    /**
     * Draw rounded rectangle with individual corner radii
     */
    drawRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        topLeft: number = 0,
        topRight: number = 0,
        bottomRight: number = 0,
        bottomLeft: number = 0
    ): void {
        // Clamp radii to not exceed rectangle dimensions
        const maxRadius = Math.min(width / 2, height / 2);
        topLeft = Math.min(topLeft, maxRadius);
        topRight = Math.min(topRight, maxRadius);
        bottomRight = Math.min(bottomRight, maxRadius);
        bottomLeft = Math.min(bottomLeft, maxRadius);

        // Start path at top-left corner (accounting for radius)
        this.moveTo(x + topLeft, y);

        // Top edge and top-right corner
        this.lineTo(x + width - topRight, y);
        if (topRight > 0) {
            this.curveTo(
                x + width - topRight * 0.552, y,
                x + width, y + topRight * 0.552,
                x + width, y + topRight
            );
        }

        // Right edge and bottom-right corner
        this.lineTo(x + width, y + height - bottomRight);
        if (bottomRight > 0) {
            this.curveTo(
                x + width, y + height - bottomRight * 0.552,
                x + width - bottomRight * 0.552, y + height,
                x + width - bottomRight, y + height
            );
        }

        // Bottom edge and bottom-left corner
        this.lineTo(x + bottomLeft, y + height);
        if (bottomLeft > 0) {
            this.curveTo(
                x + bottomLeft * 0.552, y + height,
                x, y + height - bottomLeft * 0.552,
                x, y + height - bottomLeft
            );
        }

        // Left edge and top-left corner
        this.lineTo(x, y + topLeft);
        if (topLeft > 0) {
            this.curveTo(
                x, y + topLeft * 0.552,
                x + topLeft * 0.552, y,
                x + topLeft, y
            );
        }

        // Close the path
        this.closePath();
    }

    /**
     * Fill path
     */
    fillPath(): void {
        this.contentStream.write('f\n');
    }

    /**
     * Stroke path
     */
    strokePath(): void {
        this.contentStream.write('S\n');
    }

    /**
     * Fill and stroke path
     */
    fillAndStrokePath(): void {
        this.contentStream.write('B\n');
    }

    /**
     * Close path
     */
    closePath(): void {
        this.contentStream.write('h\n');
    }

    /**
     * Draw string with font
     */
    drawString(font: PdfFont, fontSize: number, text: string, x: number, y: number): void {
        this.context.font = font;
        this.context.fontSize = fontSize;
        this.currentFont = font;
        this.currentFontSize = fontSize;

        this.contentStream.write('BT\n'); // Begin text
        this.contentStream.write(`/${font.name} ${fontSize} Tf\n`); // Set font
        this.contentStream.write(`${x} ${y} Td\n`); // Move to position
        this.contentStream.write(`(${this.escapeString(text)}) Tj\n`); // Show text
        this.contentStream.write('ET\n'); // End text
    }

    /**
     * Set font
     */
    setFont(font: PdfFont, fontSize: number): void {
        this.context.font = font;
        this.context.fontSize = fontSize;
        this.currentFont = font;
        this.currentFontSize = fontSize;
    }

    /**
     * Transform matrix
     */
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.contentStream.write(`${a} ${b} ${c} ${d} ${e} ${f} cm\n`);
    }

    /**
     * Translate
     */
    translate(x: number, y: number): void {
        this.transform(1, 0, 0, 1, x, y);
    }

    /**
     * Scale
     */
    scale(sx: number, sy: number): void {
        this.transform(sx, 0, 0, sy, 0, 0);
    }

    /**
     * Rotate
     */
    rotate(angle: number): void {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.transform(cos, sin, -sin, cos, 0, 0);
    }

    /**
     * Escape string for PDF
     */
    private escapeString(text: string): string {
        return text.replace(/[()\\]/g, '\\$&');
    }

    /**
     * Get content as string
     */
    getContent(): string {
        return this.contentStream.getContent();
    }

    /**
     * Clear content
     */
    clear(): void {
        this.contentStream.clear();
    }
}