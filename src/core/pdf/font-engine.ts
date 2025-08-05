/**
 * PDF Font Engine
 * 
 * Simplified PDF font system providing:
 * - Standard PDF fonts with accurate metrics
 * - Font measurement and rendering capabilities
 * - Clean interface without complex PDF object dependencies
 * 
 * Consolidates essential font functionality from multiple files.
 * 
 * @packageDocumentation
 */

/**
 * PDF Document interface (simplified)
 */
export interface PdfDocument {
    genSerial(): number;
    objects: {
        add(obj: unknown): void;
    };
}

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
    widths: number[];
    ascender: number;
    descender: number;
    capHeight: number;
    xHeight: number;
    unitsPerEm: number;
}

/**
 * Create character width array with actual character widths
 */
function createCharacterWidths(baseWidths: Record<number, number>, defaultWidth: number): number[] {
    const widths: number[] = new Array<number>(256).fill(defaultWidth);
    for (const [charCode, width] of Object.entries(baseWidths)) {
        widths[parseInt(charCode, 10)] = width;
    }
    return widths;
}

/**
 * Helvetica character widths (in font units per 1000 em)
 */
const HELVETICA_WIDTHS = createCharacterWidths({
    32: 278, // space
    33: 278, // !
    48: 556, // 0-9
    49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556,
    65: 667, // A-Z
    66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278, 74: 500,
    75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722, 83: 667,
    84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611,
    97: 556, // a-z
    98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556, 104: 556, 105: 222,
    106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556, 112: 556, 113: 556,
    114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 500,
}, 500);

/**
 * Times Roman character widths
 */
const TIMES_WIDTHS = createCharacterWidths({
    32: 250, // space
    48: 500, // 0-9
    49: 500, 50: 500, 51: 500, 52: 500, 53: 500, 54: 500, 55: 500, 56: 500, 57: 500,
    65: 722, // A-Z
    66: 667, 67: 667, 68: 722, 69: 611, 70: 556, 71: 722, 72: 722, 73: 333, 74: 389,
    75: 722, 76: 611, 77: 889, 78: 722, 79: 722, 80: 556, 81: 722, 82: 667, 83: 556,
    84: 611, 85: 722, 86: 722, 87: 944, 88: 722, 89: 722, 90: 611,
    97: 444, // a-z
    98: 500, 99: 444, 100: 500, 101: 444, 102: 333, 103: 500, 104: 500, 105: 278,
    106: 278, 107: 500, 108: 278, 109: 778, 110: 500, 111: 500, 112: 500, 113: 500,
    114: 333, 115: 389, 116: 278, 117: 500, 118: 500, 119: 722, 120: 500, 121: 500, 122: 444,
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
            97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611, 104: 611, 105: 278, 106: 278,
        }, 550),
        ascender: 718,
        descender: -207,
        capHeight: 718,
        xHeight: 532,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.HelveticaOblique]: {
        widths: HELVETICA_WIDTHS,
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
            97: 556, 98: 611, 99: 556, 100: 611, 101: 556, 102: 333, 103: 611, 104: 611, 105: 278, 106: 278,
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
            97: 500, 98: 556, 99: 444, 100: 556, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 333,
        }, 520),
        ascender: 683,
        descender: -217,
        capHeight: 676,
        xHeight: 461,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.TimesItalic]: {
        widths: TIMES_WIDTHS,
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
            97: 500, 98: 556, 99: 444, 100: 556, 101: 444, 102: 333, 103: 500, 104: 556, 105: 278, 106: 333,
        }, 520),
        ascender: 683,
        descender: -217,
        capHeight: 669,
        xHeight: 462,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Courier]: {
        widths: new Array(256).fill(600) as number[], // Monospace
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBold]: {
        widths: new Array(256).fill(600) as number[],
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierOblique]: {
        widths: new Array(256).fill(600) as number[],
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 426,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.CourierBoldOblique]: {
        widths: new Array(256).fill(600) as number[],
        ascender: 629,
        descender: -157,
        capHeight: 562,
        xHeight: 439,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.Symbol]: {
        widths: createCharacterWidths({}, 500),
        ascender: 1010,
        descender: -293,
        capHeight: 673,
        xHeight: 466,
        unitsPerEm: 1000,
    },
    [PdfStandardFont.ZapfDingbats]: {
        widths: createCharacterWidths({}, 780),
        ascender: 820,
        descender: -143,
        capHeight: 820,
        xHeight: 0,
        unitsPerEm: 1000,
    },
};

/**
 * PDF Font object (simplified)
 */
export class PdfFont {
    public readonly fontName: PdfStandardFont;
    public readonly name: string;
    private readonly metrics: FontMetrics;
    private readonly id: number;

    constructor(document: PdfDocument, fontName: PdfStandardFont, name?: string) {
        this.fontName = fontName;
        // Use standard PDF font names instead of generated names
        this.name = name ?? this.getStandardPdfName(fontName);
        this.metrics = FONT_METRICS[fontName] ?? FONT_METRICS[PdfStandardFont.Helvetica];
        this.id = document.genSerial();

        // Register with document if provided
        if (document.objects) {
            document.objects.add(this);
        }
    }

    /**
     * Get standard PDF font name for resource dictionary
     */
    private getStandardPdfName(fontName: PdfStandardFont): string {
        // Map to standard PDF font resource names
        const standardNames: Record<PdfStandardFont, string> = {
            [PdfStandardFont.Helvetica]: 'Helvetica',
            [PdfStandardFont.HelveticaBold]: 'Helvetica-Bold',
            [PdfStandardFont.HelveticaOblique]: 'Helvetica-Oblique',
            [PdfStandardFont.HelveticaBoldOblique]: 'Helvetica-BoldOblique',
            [PdfStandardFont.TimesRoman]: 'Times-Roman',
            [PdfStandardFont.TimesBold]: 'Times-Bold',
            [PdfStandardFont.TimesItalic]: 'Times-Italic',
            [PdfStandardFont.TimesBoldItalic]: 'Times-BoldItalic',
            [PdfStandardFont.Courier]: 'Courier',
            [PdfStandardFont.CourierBold]: 'Courier-Bold',
            [PdfStandardFont.CourierOblique]: 'Courier-Oblique',
            [PdfStandardFont.CourierBoldOblique]: 'Courier-BoldOblique',
            [PdfStandardFont.Symbol]: 'Symbol',
            [PdfStandardFont.ZapfDingbats]: 'ZapfDingbats',
        };
        return standardNames[fontName] || 'Helvetica';
    }

    /**
     * Get underlying font for text drawing (required by text widgets)
     */
    getUnderlyingFont(): PdfFont {
        return this;
    }

    /**
     * Get font name for PDF text operators
     */
    getPdfFontName(): string {
        return this.name;
    }

    /**
     * Measure text width in font units
     */
    measureText(text: string): number {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            width += this.metrics.widths[charCode] ?? 500;
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
     * Get font metrics
     */
    getMetrics(): FontMetrics {
        return { ...this.metrics };
    }

    /**
     * Get font ID
     */
    getId(): number {
        return this.id;
    }

    /**
     * Get font reference
     */
    ref(): string {
        return `${this.id} 0 R`;
    }

    /**
     * Put text string (simplified)
     */
    putText(stream: { write: (data: string) => void }, text: string): void {
        if (stream && typeof stream.write === 'function') {
            stream.write(`(${text.replace(/[()\\]/g, '\\$&')})`);
        }
    }
}

/**
 * Font registry for managing fonts in a document
 */
export class FontRegistry {
    readonly fonts = new Map<string, PdfFont>();
    private readonly document: PdfDocument;

    constructor(document: PdfDocument) {
        this.document = document;
    }

    /**
     * Get or create a font by family name (compatible with text widgets)
     */
    getFont(fontFamily: string): PdfFont {
        // Map common font family names to PDF standard fonts
        const fontMapping: Record<string, PdfStandardFont> = {
            'Helvetica': PdfStandardFont.Helvetica,
            'Helvetica-Bold': PdfStandardFont.HelveticaBold,
            'Helvetica-Oblique': PdfStandardFont.HelveticaOblique,
            'Helvetica-BoldOblique': PdfStandardFont.HelveticaBoldOblique,
            'Times': PdfStandardFont.TimesRoman,
            'Times-Roman': PdfStandardFont.TimesRoman,
            'Times-Bold': PdfStandardFont.TimesBold,
            'Times-Italic': PdfStandardFont.TimesItalic,
            'Times-BoldItalic': PdfStandardFont.TimesBoldItalic,
            'Courier': PdfStandardFont.Courier,
            'Courier-Bold': PdfStandardFont.CourierBold,
            'Courier-Oblique': PdfStandardFont.CourierOblique,
            'Courier-BoldOblique': PdfStandardFont.CourierBoldOblique,
            'Symbol': PdfStandardFont.Symbol,
            'ZapfDingbats': PdfStandardFont.ZapfDingbats,
        };

        // Default to Helvetica for unknown fonts
        const pdfStandardFont = fontMapping[fontFamily] ?? PdfStandardFont.Helvetica;

        if (!this.fonts.has(fontFamily)) {
            const font = new PdfFont(this.document, pdfStandardFont);
            this.fonts.set(fontFamily, font);
        }

        const font = this.fonts.get(fontFamily);
        if (!font) {
            throw new Error(`Font ${fontFamily} not found in registry`);
        }
        return font;
    }

    /**
     * Get font by standard PDF font enum (backward compatibility)
     */
    getFontByEnum(fontName: PdfStandardFont, name?: string): PdfFont {
        const key = name ?? fontName;

        if (!this.fonts.has(key)) {
            const font = new PdfFont(this.document, fontName, name);
            this.fonts.set(key, font);
        }

        const font = this.fonts.get(key);
        if (!font) {
            throw new Error(`Font ${key} not found in registry`);
        }
        return font;
    }

    /**
     * Get default font (Helvetica)
     */
    getDefaultFont(): PdfFont {
        return this.getFont('Helvetica');
    }

    /**
     * Get all registered fonts
     */
    getAllFonts(): PdfFont[] {
        return Array.from(this.fonts.values());
    }

    /**
     * Get font resource entries for PDF document
     */
    getFontResources(): Record<string, string> {
        const resources: Record<string, string> = {};

        for (const font of this.fonts.values()) {
            resources[font.name] = `<< /Type /Font /Subtype /Type1 /BaseFont /${font.fontName} >>`;
        }

        return resources;
    }

    /**
     * Clear all fonts
     */
    clear(): void {
        this.fonts.clear();
    }
}