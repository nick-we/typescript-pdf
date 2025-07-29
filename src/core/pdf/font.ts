/**
 * PDF Font System
 * 
 * Basic font support for PDF generation
 * Includes built-in PDF fonts and text measurement
 * 
 * @packageDocumentation
 */

import { PdfStream } from './stream.js';
import { PdfObject, PdfDict, PdfName, PdfString, type PdfOutputContext } from './types.js';
import type { PdfDocument } from './document.js';

/**
 * Built-in PDF standard fonts
 */
export enum PdfStandardFont {
    Helvetica = 'Helvetica',
    HelveticaBold = 'Helvetica-Bold',
    HelveticaOblique = 'Helvetica-Oblique',
    HelveticaBoldOblique = 'Helvetica-BoldOblique',
    TimesRoman = 'Times-Roman',
    TimesBold = 'Times-Bold',
    TimesItalic = 'Times-Italic',
    TimesBoldItalic = 'Times-BoldItalic',
    Courier = 'Courier',
    CourierBold = 'Courier-Bold',
    CourierOblique = 'Courier-Oblique',
    CourierBoldOblique = 'Courier-BoldOblique',
    Symbol = 'Symbol',
    ZapfDingbats = 'ZapfDingbats',
}

/**
 * Font metrics for text measurement
 */
interface FontMetrics {
    /** Character widths (indexed by character code) */
    widths: number[];
    /** Font ascender */
    ascender: number;
    /** Font descender */
    descender: number;
    /** Cap height */
    capHeight: number;
    /** X-height */
    xHeight: number;
    /** Units per em */
    unitsPerEm: number;
}

/**
 * Simplified font metrics for built-in fonts
 * These are approximations - real implementations would use AFM files
 */
const FONT_METRICS: Record<PdfStandardFont, FontMetrics> = {
    [PdfStandardFont.Helvetica]: {
        widths: new Array(256).fill(0.5), // Simplified - all characters same width
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 523,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaBold]: {
        widths: new Array(256).fill(0.55),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 532,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaOblique]: {
        widths: new Array(256).fill(0.5),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 523,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaBoldOblique]: {
        widths: new Array(256).fill(0.55),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 532,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesRoman]: {
        widths: new Array(256).fill(0.48),
        ascender: 683,
        descender: -217,
        capHeight: 662,
        xHeight: 450,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesBold]: {
        widths: new Array(256).fill(0.52),
        ascender: 683,
        descender: -217,
        capHeight: 676,
        xHeight: 461,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesItalic]: {
        widths: new Array(256).fill(0.48),
        ascender: 683,
        descender: -217,
        capHeight: 653,
        xHeight: 441,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesBoldItalic]: {
        widths: new Array(256).fill(0.52),
        ascender: 683,
        descender: -217,
        capHeight: 669,
        xHeight: 462,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Courier]: {
        widths: new Array(256).fill(0.6), // Monospace font
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBold]: {
        widths: new Array(256).fill(0.6),
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierOblique]: {
        widths: new Array(256).fill(0.6),
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBoldOblique]: {
        widths: new Array(256).fill(0.6),
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Symbol]: {
        widths: new Array(256).fill(0.5),
        ascender: 1010,
        descender: -293,
        capHeight: 673,
        xHeight: 466,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.ZapfDingbats]: {
        widths: new Array(256).fill(0.78),
        ascender: 820,
        descender: -143,
        capHeight: 820,
        xHeight: 0,
        unitsPerEm: 1000,
    },
};

/**
 * PDF Font object
 */
export class PdfFont extends PdfObject<PdfDict> {
    public readonly fontName: PdfStandardFont;
    public readonly name: string;
    private readonly metrics: FontMetrics;

    constructor(document: PdfDocument, fontName: PdfStandardFont, name?: string) {
        const dict = PdfDict.values({
            '/Type': new PdfName('/Font'),
            '/Subtype': new PdfName('/Type1'),
            '/BaseFont': new PdfName(`/${fontName}`),
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);

        this.fontName = fontName;
        this.name = name || `/F${this.objser}`;
        this.metrics = FONT_METRICS[fontName]!;
    }

    /**
     * Measure text width in font units
     */
    measureText(text: string): number {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            width += this.metrics.widths[charCode] || 0.5;
        }
        return width;
    }

    /**
     * Measure text width in points for given font size
     */
    measureTextWidth(text: string, fontSize: number): number {
        return (this.measureText(text) * fontSize) / this.metrics.unitsPerEm;
    }

    /**
     * Get font height in points for given font size
     */
    getFontHeight(fontSize: number): number {
        return ((this.metrics.ascender - this.metrics.descender) * fontSize) / this.metrics.unitsPerEm;
    }

    /**
     * Get font ascender in points for given font size
     */
    getAscender(fontSize: number): number {
        return (this.metrics.ascender * fontSize) / this.metrics.unitsPerEm;
    }

    /**
     * Get font descender in points for given font size
     */
    getDescender(fontSize: number): number {
        return (this.metrics.descender * fontSize) / this.metrics.unitsPerEm;
    }

    /**
     * Put text string into PDF stream with proper escaping
     */
    putText(stream: PdfStream, text: string): void {
        // Convert to PDF string and output
        const pdfString = new PdfString(text);
        pdfString.output({ verbose: false }, stream);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * Font registry for managing fonts in a document
 */
export class FontRegistry {
    private readonly fonts = new Map<string, PdfFont>();
    private readonly document: PdfDocument;

    constructor(document: PdfDocument) {
        this.document = document;
    }

    /**
     * Get or create a font
     */
    getFont(fontName: PdfStandardFont, name?: string): PdfFont {
        const key = name || fontName;

        if (!this.fonts.has(key)) {
            const font = new PdfFont(this.document, fontName, name);
            this.fonts.set(key, font);
        }

        return this.fonts.get(key)!;
    }

    /**
     * Get default font (Helvetica)
     */
    getDefaultFont(): PdfFont {
        return this.getFont(PdfStandardFont.Helvetica);
    }

    /**
     * Get all registered fonts
     */
    getAllFonts(): PdfFont[] {
        return Array.from(this.fonts.values());
    }
}