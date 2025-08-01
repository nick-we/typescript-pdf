/**
 * PDF Font System
 * 
 * Basic font support for PDF generation
 * Includes built-in PDF fonts and text measurement
 * 
 * @packageDocumentation
 */

import { PdfStream } from './stream.js';
import { PdfObject, PdfDict, PdfName, PdfString, type PdfOutputContext, PdfNum, PdfArray } from './types.js';
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
 * Create character width array with actual character widths
 * Based on Adobe Font Metrics (AFM) data for standard PDF fonts
 */
function createCharacterWidths(baseWidths: Record<number, number>, defaultWidth: number): number[] {
    const widths = new Array(256).fill(defaultWidth);

    // Apply specific character widths
    for (const [charCode, width] of Object.entries(baseWidths)) {
        widths[parseInt(charCode)] = width;
    }

    return widths;
}

/**
 * Helvetica character widths (in font units per 1000 em)
 */
const HELVETICA_WIDTHS = createCharacterWidths({
    32: 278,   // space
    33: 278,   // !
    34: 355,   // "
    35: 556,   // #
    36: 556,   // $
    37: 889,   // %
    38: 667,   // &
    39: 191,   // '
    40: 333,   // (
    41: 333,   // )
    42: 389,   // *
    43: 584,   // +
    44: 278,   // ,
    45: 333,   // -
    46: 278,   // .
    47: 278,   // /
    48: 556,   // 0
    49: 556,   // 1
    50: 556,   // 2
    51: 556,   // 3
    52: 556,   // 4
    53: 556,   // 5
    54: 556,   // 6
    55: 556,   // 7
    56: 556,   // 8
    57: 556,   // 9
    65: 667,   // A
    66: 667,   // B
    67: 722,   // C
    68: 722,   // D
    69: 667,   // E
    70: 611,   // F
    71: 778,   // G
    72: 722,   // H
    73: 278,   // I
    74: 500,   // J
    75: 667,   // K
    76: 556,   // L
    77: 833,   // M
    78: 722,   // N
    79: 778,   // O
    80: 667,   // P
    81: 778,   // Q
    82: 722,   // R
    83: 667,   // S
    84: 611,   // T
    85: 722,   // U
    86: 667,   // V
    87: 944,   // W
    88: 667,   // X
    89: 667,   // Y
    90: 611,   // Z
    97: 556,   // a
    98: 556,   // b
    99: 500,   // c
    100: 556,  // d
    101: 556,  // e
    102: 278,  // f
    103: 556,  // g
    104: 556,  // h
    105: 222,  // i
    106: 222,  // j
    107: 500,  // k
    108: 222,  // l
    109: 833,  // m
    110: 556,  // n
    111: 556,  // o
    112: 556,  // p
    113: 556,  // q
    114: 333,  // r
    115: 500,  // s
    116: 278,  // t
    117: 556,  // u
    118: 500,  // v
    119: 722,  // w
    120: 500,  // x
    121: 500,  // y
    122: 500,  // z
}, 500);

/**
 * Times Roman character widths
 */
const TIMES_WIDTHS = createCharacterWidths({
    32: 250,   // space
    33: 333,   // !
    48: 500,   // 0
    49: 500,   // 1
    50: 500,   // 2
    51: 500,   // 3
    52: 500,   // 4
    53: 500,   // 5
    54: 500,   // 6
    55: 500,   // 7
    56: 500,   // 8
    57: 500,   // 9
    65: 722,   // A
    66: 667,   // B
    67: 667,   // C
    68: 722,   // D
    69: 611,   // E
    70: 556,   // F
    71: 722,   // G
    72: 722,   // H
    73: 333,   // I
    74: 389,   // J
    75: 722,   // K
    76: 611,   // L
    77: 889,   // M
    78: 722,   // N
    79: 722,   // O
    80: 556,   // P
    81: 722,   // Q
    82: 667,   // R
    83: 556,   // S
    84: 611,   // T
    85: 722,   // U
    86: 722,   // V
    87: 944,   // W
    88: 722,   // X
    89: 722,   // Y
    90: 611,   // Z
    97: 444,   // a
    98: 500,   // b
    99: 444,   // c
    100: 500,  // d
    101: 444,  // e
    102: 333,  // f
    103: 500,  // g
    104: 500,  // h
    105: 278,  // i
    106: 278,  // j
    107: 500,  // k
    108: 278,  // l
    109: 778,  // m
    110: 500,  // n
    111: 500,  // o
    112: 500,  // p
    113: 500,  // q
    114: 333,  // r
    115: 389,  // s
    116: 278,  // t
    117: 500,  // u
    118: 500,  // v
    119: 722,  // w
    120: 500,  // x
    121: 500,  // y
    122: 444,  // z
}, 480);

/**
 * Font metrics with accurate character widths
 */
const FONT_METRICS: Record<PdfStandardFont, FontMetrics> = {
    [PdfStandardFont.Helvetica]: {
        widths: HELVETICA_WIDTHS,
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 523,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaBold]: {
        widths: createCharacterWidths({
            32: 278, 48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556,
            65: 722, 66: 722, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 556,
            75: 722, 76: 611, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667, 84: 611,
            85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611,
            97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611, 104: 611, 105: 278, 106: 278,
            107: 556, 108: 278, 109: 889, 110: 611, 111: 611, 112: 611, 113: 611, 114: 389, 115: 556, 116: 333,
            117: 611, 118: 556, 119: 778, 120: 556, 121: 556, 122: 500,
        }, 550),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 532,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaOblique]: {
        widths: HELVETICA_WIDTHS, // Same as regular Helvetica
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 523,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaBoldOblique]: {
        widths: createCharacterWidths({
            32: 278, 48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556,
            65: 722, 66: 722, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 556,
            75: 722, 76: 611, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667, 84: 611,
            85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611,
            97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611, 104: 611, 105: 278, 106: 278,
            107: 556, 108: 278, 109: 889, 110: 611, 111: 611, 112: 611, 113: 611, 114: 389, 115: 556, 116: 333,
            117: 611, 118: 556, 119: 778, 120: 556, 121: 556, 122: 500,
        }, 550),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 532,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesRoman]: {
        widths: TIMES_WIDTHS,
        ascender: 683,
        descender: -217,
        capHeight: 662,
        xHeight: 450,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesBold]: {
        widths: createCharacterWidths({
            32: 250, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500,
            65: 722, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 778, 73: 389, 74: 500,
            75: 778, 76: 667, 77: 944, 78: 722, 79: 778, 80: 611, 81: 778, 82: 722, 83: 556, 84: 667,
            85: 722, 86: 722, 87: 1000, 88: 722, 89: 722, 90: 667,
            97: 500, 98: 556, 99: 444, 100: 556, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 333,
            107: 556, 108: 278, 109: 833, 110: 556, 111: 500, 112: 556, 113: 556, 114: 444, 115: 389, 116: 333,
            117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 444,
        }, 520),
        ascender: 683,
        descender: -217,
        capHeight: 676,
        xHeight: 461,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesItalic]: {
        widths: TIMES_WIDTHS, // Similar to regular Times
        ascender: 683,
        descender: -217,
        capHeight: 653,
        xHeight: 441,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesBoldItalic]: {
        widths: createCharacterWidths({
            32: 250, 48: 500, 49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500,
            65: 722, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 778, 73: 389, 74: 500,
            75: 778, 76: 667, 77: 944, 78: 722, 79: 778, 80: 611, 81: 778, 82: 722, 83: 556, 84: 667,
            85: 722, 86: 722, 87: 1000, 88: 722, 89: 722, 90: 667,
            97: 500, 98: 556, 99: 444, 100: 556, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 333,
            107: 556, 108: 278, 109: 833, 110: 556, 111: 500, 112: 556, 113: 556, 114: 444, 115: 389, 116: 333,
            117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 444,
        }, 520),
        ascender: 683,
        descender: -217,
        capHeight: 669,
        xHeight: 462,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Courier]: {
        widths: new Array(256).fill(600), // Monospace - all characters same width
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBold]: {
        widths: new Array(256).fill(600), // Monospace
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierOblique]: {
        widths: new Array(256).fill(600), // Monospace
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBoldOblique]: {
        widths: new Array(256).fill(600), // Monospace
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Symbol]: {
        widths: createCharacterWidths({}, 500), // Default to 500 for symbol characters
        ascender: 1010,
        descender: -293,
        capHeight: 673,
        xHeight: 466,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.ZapfDingbats]: {
        widths: createCharacterWidths({}, 780), // Default to 780 for dingbat characters
        ascender: 820,
        descender: -143,
        capHeight: 820,
        xHeight: 0,
        unitsPerEm: 1000,
    },
};

/**
 * PDF Font Descriptor object
 */
export class PdfFontDescriptor extends PdfObject<PdfDict> {
    constructor(document: PdfDocument, fontName: PdfStandardFont, metrics: FontMetrics) {
        const dict = new PdfDict({
            '/Type': new PdfName('/FontDescriptor'),
            '/FontName': new PdfName(`/${fontName}`),
            '/Flags': new PdfNum(32), // Symbolic flag
            '/FontBBox': new PdfArray([
                new PdfNum(-200), // Estimated left
                new PdfNum(metrics.descender),
                new PdfNum(1000), // Estimated right
                new PdfNum(metrics.ascender)
            ]),
            '/ItalicAngle': new PdfNum(fontName.includes('Oblique') || fontName.includes('Italic') ? -12 : 0),
            '/Ascent': new PdfNum(metrics.ascender),
            '/Descent': new PdfNum(metrics.descender),
            '/CapHeight': new PdfNum(metrics.capHeight),
            '/XHeight': new PdfNum(metrics.xHeight),
            '/StemV': new PdfNum(fontName.includes('Bold') ? 120 : 80),
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

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

        // Add encoding for better compatibility
        dict.set('/Encoding', new PdfName('/WinAnsiEncoding'));

        // Add font descriptor information for better compatibility
        const metrics = FONT_METRICS[fontName]!;
        const fontDescriptor = new PdfFontDescriptor(document, fontName, metrics);

        // Reference the font descriptor
        dict.set('/FontDescriptor', fontDescriptor.ref());

        super(document.genSerial(), 0, dict);
        document.objects.add(this);

        this.fontName = fontName;
        this.name = name || `/F${this.objser}`;
        this.metrics = metrics;
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