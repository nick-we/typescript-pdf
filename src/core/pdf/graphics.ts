/**
 * PDF Graphics Context
 * 
 * Based on dart-pdf PdfGraphics implementation
 * Provides drawing operations and graphics state management
 * 
 * @packageDocumentation
 */

import { PdfStream } from './stream.js';
import { PdfContentStream } from './document.js';
import { PdfNum, PdfNumList, PdfName, type PdfOutputContext } from './types.js';
import { PdfFont, PdfStandardFont } from './font.js';

/**
 * PDF Line join styles
 */
export enum PdfLineJoin {
    /** Miter join */
    Miter = 0,
    /** Round join */
    Round = 1,
    /** Bevel join */
    Bevel = 2,
}

/**
 * PDF Line cap styles
 */
export enum PdfLineCap {
    /** Butt cap */
    Butt = 0,
    /** Round cap */
    Round = 1,
    /** Square cap */
    Square = 2,
}

/**
 * PDF Text rendering modes
 */
export enum PdfTextRenderingMode {
    /** Fill text */
    Fill = 0,
    /** Stroke text */
    Stroke = 1,
    /** Fill and stroke text */
    FillAndStroke = 2,
    /** Invisible text */
    Invisible = 3,
    /** Fill text and add to path for clipping */
    FillAndClip = 4,
    /** Stroke text and add to path for clipping */
    StrokeAndClip = 5,
    /** Fill, stroke text and add to path for clipping */
    FillStrokeAndClip = 6,
    /** Add text to path for clipping */
    Clip = 7,
}

/**
 * Simple transformation matrix implementation
 */
export class Matrix4 {
    private readonly values: number[];

    constructor(values?: number[]) {
        if (values && values.length === 16) {
            this.values = [...values];
        } else {
            // Identity matrix
            this.values = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }
    }

    /**
     * Create identity matrix
     */
    static identity(): Matrix4 {
        return new Matrix4();
    }

    /**
     * Clone this matrix
     */
    clone(): Matrix4 {
        return new Matrix4([...this.values]);
    }

    /**
     * Multiply with another matrix
     */
    multiply(other: Matrix4): void {
        const a = this.values;
        const b = other.values;
        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] =
                    a[i * 4 + 0]! * b[0 * 4 + j]! +
                    a[i * 4 + 1]! * b[1 * 4 + j]! +
                    a[i * 4 + 2]! * b[2 * 4 + j]! +
                    a[i * 4 + 3]! * b[3 * 4 + j]!;
            }
        }

        for (let i = 0; i < 16; i++) {
            this.values[i] = result[i]!;
        }
    }

    /**
     * Get storage array (for PDF output)
     */
    get storage(): readonly number[] {
        return this.values;
    }
}

/**
 * Graphics context state
 */
interface GraphicsContext {
    /** Current transformation matrix */
    ctm: Matrix4;
}

/**
 * PDF Color representation
 */
export interface PdfColor {
    red: number;
    green: number;
    blue: number;
    toHex(): string;
}

/**
 * Simple RGB color implementation
 */
export class PdfColorRgb implements PdfColor {
    constructor(
        public readonly red: number,
        public readonly green: number,
        public readonly blue: number
    ) { }

    toHex(): string {
        const r = Math.round(this.red * 255).toString(16).padStart(2, '0');
        const g = Math.round(this.green * 255).toString(16).padStart(2, '0');
        const b = Math.round(this.blue * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    static black = new PdfColorRgb(0, 0, 0);
    static white = new PdfColorRgb(1, 1, 1);
    static red = new PdfColorRgb(1, 0, 0);
    static green = new PdfColorRgb(0, 1, 0);
    static blue = new PdfColorRgb(0, 0, 1);
}

/**
 * PDF Graphics drawing context
 */
export class PdfGraphics {
    private static readonly COMMENT_INDENT = 35;
    private static readonly INDENT_AMOUNT = 1;
    private indent = PdfGraphics.INDENT_AMOUNT;

    private context: GraphicsContext;
    private readonly contextStack: GraphicsContext[] = [];
    private readonly contentStream: PdfContentStream;
    private readonly buffer: PdfStream;
    private readonly outputContext: PdfOutputContext;

    constructor(contentStream: PdfContentStream, outputContext: PdfOutputContext = {}) {
        this.contentStream = contentStream;
        this.buffer = contentStream.getContentStream();
        this.outputContext = outputContext;
        this.context = {
            ctm: Matrix4.identity(),
        };
    }

    /**
     * Whether graphics content has been altered
     */
    get altered(): boolean {
        return this.buffer.length > 0;
    }

    /**
     * Save the current graphics state
     */
    saveContext(): void {
        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString('q ');
        this.contextStack.push({
            ctm: this.context.ctm.clone(),
        });

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 2 - this.indent));
            this.buffer.putComment('saveContext()');
            this.indent += PdfGraphics.INDENT_AMOUNT;
        }
    }

    /**
     * Restore the graphics state
     */
    restoreContext(): void {
        if (this.contextStack.length > 0) {
            if (this.outputContext.verbose) {
                this.indent -= PdfGraphics.INDENT_AMOUNT;
                this.buffer.putString(' '.repeat(this.indent));
            }

            this.buffer.putString('Q ');
            this.context = this.contextStack.pop()!;

            if (this.outputContext.verbose) {
                this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 2 - this.indent));
                this.buffer.putComment('restoreContext()');
            }
        }
    }

    /**
     * Move to a point
     */
    moveTo(x: number, y: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([x, y]).output(this.outputContext, this.buffer);
        this.buffer.putString(' m ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`moveTo(${x}, ${y})`);
        }
    }

    /**
     * Draw a line to a point
     */
    lineTo(x: number, y: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([x, y]).output(this.outputContext, this.buffer);
        this.buffer.putString(' l ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`lineTo(${x}, ${y})`);
        }
    }

    /**
     * Draw a rectangle
     */
    drawRect(x: number, y: number, width: number, height: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([x, y, width, height]).output(this.outputContext, this.buffer);
        this.buffer.putString(' re ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`drawRect(x: ${x}, y: ${y}, w: ${width}, h: ${height})`);
        }
    }

    /**
     * Draw a cubic Bézier curve
     */
    curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([x1, y1, x2, y2, x3, y3]).output(this.outputContext, this.buffer);
        this.buffer.putString(' c ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`curveTo(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3})`);
        }
    }

    /**
     * Close the current path
     */
    closePath(): void {
        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString('h ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 2 - this.indent));
            this.buffer.putComment('closePath()');
        }
    }

    /**
     * Fill the current path
     */
    fillPath(evenOdd: boolean = false): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`f${evenOdd ? '*' : ''} `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`fillPath(evenOdd: ${evenOdd})`);
        }
    }

    /**
     * Stroke the current path
     */
    strokePath(close: boolean = false): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`${close ? 's' : 'S'} `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`strokePath(close: ${close})`);
        }
    }

    /**
     * Fill and stroke the current path
     */
    fillAndStrokePath(evenOdd: boolean = false, close: boolean = false): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`${close ? 'b' : 'B'}${evenOdd ? '*' : ''} `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`fillAndStrokePath(evenOdd: ${evenOdd}, close: ${close})`);
        }
    }

    /**
     * Clip the current path for subsequent drawing operations
     */
    clipPath(evenOdd: boolean = false): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`W${evenOdd ? '*' : ''} n `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`clipPath(evenOdd: ${evenOdd})`);
        }
    }

    /**
     * Set line width
     */
    setLineWidth(width: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNum(width).output(this.outputContext, this.buffer);
        this.buffer.putString(' w ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`setLineWidth(${width})`);
        }
    }

    /**
     * Set line cap style
     */
    setLineCap(cap: PdfLineCap): void {
        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`${cap} J `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 4 - this.indent));
            this.buffer.putComment(`setLineCap(${PdfLineCap[cap]})`);
        }
    }

    /**
     * Set line join style
     */
    setLineJoin(join: PdfLineJoin): void {
        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString(`${join} j `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 4 - this.indent));
            this.buffer.putComment(`setLineJoin(${PdfLineJoin[join]})`);
        }
    }

    /**
     * Set fill color (RGB)
     */
    setFillColor(color: PdfColor): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([color.red, color.green, color.blue]).output(this.outputContext, this.buffer);
        this.buffer.putString(' rg ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`setFillColor(${color.toHex()})`);
        }
    }

    /**
     * Set stroke color (RGB)
     */
    setStrokeColor(color: PdfColor): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([color.red, color.green, color.blue]).output(this.outputContext, this.buffer);
        this.buffer.putString(' RG ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`setStrokeColor(${color.toHex()})`);
        }
    }

    /**
     * Set both fill and stroke color
     */
    setColor(color: PdfColor): void {
        this.setFillColor(color);
        this.setStrokeColor(color);
    }

    /**
     * Set transformation matrix
     */
    setTransform(matrix: Matrix4): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        const s = matrix.storage;
        new PdfNumList([s[0]!, s[1]!, s[4]!, s[5]!, s[12]!, s[13]!]).output(this.outputContext, this.buffer);
        this.buffer.putString(' cm ');
        this.context.ctm.multiply(matrix);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment('setTransform()');
        }
    }

    /**
     * Get current transformation matrix
     */
    getTransform(): Matrix4 {
        return this.context.ctm.clone();
    }

    /**
     * Begin text object
     */
    beginText(): void {
        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString('BT ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 3 - this.indent));
            this.buffer.putComment('beginText()');
            this.indent += PdfGraphics.INDENT_AMOUNT;
        }
    }

    /**
     * End text object
     */
    endText(): void {
        if (this.outputContext.verbose) {
            this.indent -= PdfGraphics.INDENT_AMOUNT;
            this.buffer.putString(' '.repeat(this.indent));
        }

        this.buffer.putString('ET ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(PdfGraphics.COMMENT_INDENT - 3 - this.indent));
            this.buffer.putComment('endText()');
        }
    }

    /**
     * Move text position
     */
    moveTextPosition(x: number, y: number): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        new PdfNumList([x, y]).output(this.outputContext, this.buffer);
        this.buffer.putString(' Td ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`moveTextPosition(${x}, ${y})`);
        }
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
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        // Font and size - ensure font name is properly formatted
        this.buffer.putString(`${font.name} `);
        new PdfNum(size).output(this.outputContext, this.buffer);
        this.buffer.putString(' Tf ');

        // Set default text state for better compatibility
        if (options.charSpace === undefined) {
            new PdfNum(0).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tc ');
        } else {
            new PdfNum(options.charSpace).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tc ');
        }

        if (options.wordSpace === undefined) {
            new PdfNum(0).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tw ');
        } else {
            new PdfNum(options.wordSpace).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tw ');
        }

        if (options.scale === undefined) {
            new PdfNum(100).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tz ');
        } else {
            new PdfNum(options.scale * 100).output(this.outputContext, this.buffer);
            this.buffer.putString(' Tz ');
        }

        if (options.rise !== undefined) {
            new PdfNum(options.rise).output(this.outputContext, this.buffer);
            this.buffer.putString(' Ts ');
        }

        // Always set text rendering mode for consistency
        const mode = options.mode ?? PdfTextRenderingMode.Fill;
        this.buffer.putString(`${mode} Tr `);

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`setFont(${font.name}, size: ${size})`);
        }
    }

    /**
     * Draw text at current position
     */
    showText(text: string): void {
        let commentOffset = 0;

        if (this.outputContext.verbose) {
            commentOffset = this.buffer.offset;
            this.buffer.putString(' '.repeat(this.indent));
        }

        // Use simple PDF string format with minimal escaping
        // Over-escaping can cause character encoding issues on macOS
        this.buffer.putString('(');

        // Only escape essential characters that break PDF syntax
        const escaped = text
            .replace(/\\/g, '\\\\')    // Escape backslashes
            .replace(/\(/g, '\\(')     // Escape opening parentheses
            .replace(/\)/g, '\\)');    // Escape closing parentheses

        this.buffer.putString(escaped);
        this.buffer.putString(') Tj ');

        if (this.outputContext.verbose) {
            this.buffer.putString(' '.repeat(Math.max(0, PdfGraphics.COMMENT_INDENT - this.buffer.offset + commentOffset)));
            this.buffer.putComment(`showText("${text}")`);
        }
    }


    /**
     * Draw text string with font, size, and position
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
        this.beginText();
        this.setFont(font, size, options);
        this.moveTextPosition(x, y);
        this.showText(text);
        this.endText();
    }

    /**
     * Draw a line from point to point
     */
    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
    }
}