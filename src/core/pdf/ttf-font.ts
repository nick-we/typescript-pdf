/**
 * TTF Font PDF Object
 * 
 * Handles embedding TrueType fonts into PDF documents with proper
 * character mapping, metrics, and subsetting support.
 * 
 * @packageDocumentation
 */

import { PdfStream } from './stream.js';
import { PdfObject, PdfDict, PdfName, PdfString, PdfArray, PdfNum, type PdfOutputContext, type PdfDataType } from './types.js';
import type { PdfDocument } from './document.js';
import { TtfParser, type TtfGlyphMetrics } from './ttf-parser.js';

/**
 * Simple PDF Stream wrapper that implements PdfDataType
 */
class PdfStreamObject implements PdfDataType {
    private readonly data: Uint8Array[] = [];

    putBytes(bytes: Uint8Array): void {
        this.data.push(bytes);
    }

    putString(text: string): void {
        const encoder = new TextEncoder();
        this.data.push(encoder.encode(text));
    }

    getBytes(): Uint8Array {
        const totalLength = this.data.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of this.data) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    output(context: PdfOutputContext, stream: PdfStream): void {
        const bytes = this.getBytes();
        stream.putString('<<\n/Length ');
        stream.putString(bytes.length.toString());
        stream.putString('\n>>\nstream\n');
        stream.putBytes(bytes);
        stream.putString('\nendstream');
    }
}

/**
 * Concrete PDF object implementation
 */
class ConcretePdfObject<T extends PdfDataType> extends PdfObject<T> {
    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream);
    }
}

/**
 * Font file object for embedding TTF data
 */
class FontFileObject extends PdfObject<PdfStreamObject> {
    constructor(document: PdfDocument, fontData: Uint8Array) {
        const streamObj = new PdfStreamObject();
        streamObj.putBytes(fontData);

        super(document.genSerial(), 0, streamObj);
        document.objects.add(this);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        // Add Length1 parameter for TTF font
        const fontData = this.params.getBytes();
        stream.putString('<<\n/Length ');
        stream.putString(fontData.length.toString());
        stream.putString('\n/Length1 ');
        stream.putString(fontData.length.toString());
        stream.putString('\n>>\nstream\n');
        stream.putBytes(fontData);
        stream.putString('\nendstream');
    }
}

/**
 * Unicode CMap for character mapping
 */
class UnicodeCMap extends PdfObject<PdfStreamObject> {
    public readonly cmap: number[] = [];
    private readonly protect: boolean;

    constructor(document: PdfDocument, protect = false) {
        super(document.genSerial(), 0, new PdfStreamObject());
        this.protect = protect;
        document.objects.add(this);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        const cmapHeader = `%!PS-Adobe-3.0 Resource-CMap
%%DocumentNeededResources: ProcSet (CIDInit)
%%IncludeResource: ProcSet (CIDInit)
%%BeginResource: CMap (Identity-H)
%%Title: (Identity-H Adobe Identity 0)
%%Version: 1.000
%%EndComments
/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo
<<
/Registry (Adobe)
/Ordering (Identity)
/Supplement 0
>> def
/CMapName /Identity-H def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
`;

        this.params.putString(cmapHeader);

        // Write character mappings in chunks
        const chunkSize = 100;
        for (let i = 0; i < this.cmap.length; i += chunkSize) {
            const chunk = this.cmap.slice(i, Math.min(i + chunkSize, this.cmap.length));
            this.params.putString(`${chunk.length} beginbfchar\n`);

            for (let j = 0; j < chunk.length; j++) {
                const cid = i + j;
                const unicode = chunk[j];
                if (unicode !== undefined) {
                    const cidHex = cid.toString(16).padStart(4, '0').toUpperCase();
                    const unicodeHex = unicode.toString(16).padStart(4, '0').toUpperCase();
                    this.params.putString(`<${cidHex}> <${unicodeHex}>\n`);
                }
            }

            this.params.putString('endbfchar\n');
        }

        const cmapFooter = `endcmap
CMapName currentdict /CMap defineresource pop
end
end
%%EndResource
%%EOF`;

        this.params.putString(cmapFooter);
        this.params.output(context, stream);
    }
}

/**
 * Font descriptor for TTF fonts
 */
class TtfFontDescriptor extends PdfObject<PdfDict> {
    constructor(
        document: PdfDocument,
        ttfFont: TtfFont,
        fontFile: PdfObject<PdfStreamObject>
    ) {
        const parser = ttfFont.parser;
        const bbox = parser.boundingBox;
        const unitsPerEm = parser.unitsPerEm;

        const dict = PdfDict.values({
            '/Type': new PdfName('/FontDescriptor'),
            '/FontName': new PdfName(`/${parser.fontName}`),
            '/FontFile2': fontFile.ref(),
            '/Flags': new PdfNum(parser.isUnicode ? 4 : 32), // Symbolic vs Non-symbolic
            '/FontBBox': new PdfArray([
                new PdfNum((bbox.xMin / unitsPerEm * 1000)),
                new PdfNum((bbox.yMin / unitsPerEm * 1000)),
                new PdfNum((bbox.xMax / unitsPerEm * 1000)),
                new PdfNum((bbox.yMax / unitsPerEm * 1000)),
            ]),
            '/Ascent': new PdfNum((parser.ascent / unitsPerEm * 1000)),
            '/Descent': new PdfNum((parser.descent / unitsPerEm * 1000)),
            '/ItalicAngle': new PdfNum(0),
            '/CapHeight': new PdfNum((parser.ascent / unitsPerEm * 1000)),
            '/StemV': new PdfNum(100), // Estimate
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * TTF Font object for PDF embedding
 */
export class TtfFont extends PdfObject<PdfDict> {
    public readonly parser: TtfParser;
    public readonly name: string;

    private readonly unicodeCMap: UnicodeCMap;
    private readonly fontDescriptor: TtfFontDescriptor;
    private readonly fontFile: FontFileObject;
    private readonly widthsObject: PdfObject<PdfArray>;

    constructor(document: PdfDocument, fontData: ArrayBuffer, name?: string, protect = false) {
        const dict = PdfDict.values({
            '/Type': new PdfName('/Font'),
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);

        this.parser = new TtfParser(fontData);
        this.name = name || `/F${this.objser}`;

        // Create font file object
        this.fontFile = new FontFileObject(document, new Uint8Array(fontData));

        // Create Unicode CMap
        this.unicodeCMap = new UnicodeCMap(document, protect);

        // Create font descriptor
        this.fontDescriptor = new TtfFontDescriptor(document, this, this.fontFile);

        // Create widths array
        this.widthsObject = new ConcretePdfObject(document.genSerial(), 0, new PdfArray());
        document.objects.add(this.widthsObject);

        // Set up font dictionary based on Unicode support
        if (this.parser.isUnicode) {
            this.buildType0Font();
        } else {
            this.buildTrueTypeFont();
        }
    }

    /**
     * Build Type0 (composite) font for Unicode support
     */
    private buildType0Font(): void {
        const descendantFont = PdfDict.values({
            '/Type': new PdfName('/Font'),
            '/BaseFont': new PdfName(`/${this.parser.fontName}`),
            '/FontFile2': this.fontFile.ref(),
            '/FontDescriptor': this.fontDescriptor.ref(),
            '/W': new PdfArray([
                new PdfNum(0),
                this.widthsObject.ref(),
            ]),
            '/CIDToGIDMap': new PdfName('/Identity'),
            '/DW': new PdfNum(1000),
            '/Subtype': new PdfName('/CIDFontType2'),
            '/CIDSystemInfo': PdfDict.values({
                '/Supplement': new PdfNum(0),
                '/Registry': new PdfString('Adobe'),
                '/Ordering': new PdfString('Identity-H'),
            }),
        });

        this.params.set('/Subtype', new PdfName('/Type0'));
        this.params.set('/BaseFont', new PdfName(`/${this.parser.fontName}`));
        this.params.set('/Encoding', new PdfName('/Identity-H'));
        this.params.set('/DescendantFonts', new PdfArray([descendantFont]));
        this.params.set('/ToUnicode', this.unicodeCMap.ref());
    }

    /**
     * Build TrueType font for basic character sets
     */
    private buildTrueTypeFont(): void {
        this.params.set('/Subtype', new PdfName('/TrueType'));
        this.params.set('/BaseFont', new PdfName(`/${this.parser.fontName}`));
        this.params.set('/FontDescriptor', this.fontDescriptor.ref());
        this.params.set('/FirstChar', new PdfNum(32));
        this.params.set('/LastChar', new PdfNum(255));
        this.params.set('/Widths', this.widthsObject.ref());

        // Populate widths array for characters 32-255
        for (let i = 32; i <= 255; i++) {
            const metrics = this.parser.getCharMetrics(i);
            const width = metrics ? (metrics.advanceWidth * 1000) : 0;
            this.widthsObject.params.add(new PdfNum(width));
        }
    }

    /**
     * Measure text width in font units
     */
    measureText(text: string): number {
        return this.parser.measureText(text);
    }

    /**
     * Measure text width in points for given font size
     */
    measureTextWidth(text: string, fontSize: number): number {
        return this.measureText(text) * fontSize;
    }

    /**
     * Get font height in points for given font size
     */
    getFontHeight(fontSize: number): number {
        return ((this.parser.ascent - this.parser.descent) / this.parser.unitsPerEm) * fontSize;
    }

    /**
     * Get font ascender in points for given font size
     */
    getAscender(fontSize: number): number {
        return (this.parser.ascent / this.parser.unitsPerEm) * fontSize;
    }

    /**
     * Get font descender in points for given font size
     */
    getDescender(fontSize: number): number {
        return (this.parser.descent / this.parser.unitsPerEm) * fontSize;
    }

    /**
     * Check if character is supported
     */
    isCharSupported(charCode: number): boolean {
        return this.parser.isCharSupported(charCode);
    }

    /**
     * Get glyph metrics for character
     */
    getCharMetrics(charCode: number): TtfGlyphMetrics | undefined {
        return this.parser.getCharMetrics(charCode);
    }

    /**
     * Put text string into PDF stream with proper encoding
     */
    putText(stream: PdfStream, text: string): void {
        if (!this.parser.isUnicode) {
            // Simple encoding for non-Unicode fonts
            const pdfString = new PdfString(text);
            pdfString.output({ verbose: false }, stream);
            return;
        }

        // Unicode encoding using hex strings
        const runes = Array.from(text).map(char => char.codePointAt(0)!);

        stream.putByte(0x3c); // '<'
        for (const rune of runes) {
            let charIndex = this.unicodeCMap.cmap.indexOf(rune);
            if (charIndex === -1) {
                charIndex = this.unicodeCMap.cmap.length;
                this.unicodeCMap.cmap.push(rune);

                // Update widths array for new character
                const metrics = this.parser.getCharMetrics(rune);
                const width = metrics ? (metrics.advanceWidth * 1000) : 0;
                this.widthsObject.params.add(new PdfNum(width));
            }

            const hexValue = charIndex.toString(16).padStart(4, '0').toUpperCase();
            stream.putString(hexValue);
        }
        stream.putByte(0x3e); // '>'
    }

    /**
     * Get string metrics including kerning and letter spacing
     */
    stringMetrics(text: string, letterSpacing = 0): TtfGlyphMetrics {
        if (!text) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                ascent: this.parser.ascent / this.parser.unitsPerEm,
                descent: this.parser.descent / this.parser.unitsPerEm,
                advanceWidth: 0,
                leftBearing: 0,
            };
        }

        const runes = Array.from(text).map(char => char.codePointAt(0)!);
        let totalWidth = 0;
        let left = 0;
        let right = 0;
        let top = 0;
        let bottom = 0;
        let firstChar = true;

        for (const rune of runes) {
            const metrics = this.parser.getCharMetrics(rune);
            if (!metrics) continue;

            if (firstChar) {
                left = metrics.left;
                firstChar = false;
            }

            totalWidth += metrics.advanceWidth + letterSpacing;
            top = Math.max(top, metrics.top);
            bottom = Math.min(bottom, metrics.bottom);
            right = totalWidth - letterSpacing + metrics.right - metrics.advanceWidth;
        }

        return {
            left,
            top,
            right,
            bottom,
            ascent: this.parser.ascent / this.parser.unitsPerEm,
            descent: this.parser.descent / this.parser.unitsPerEm,
            advanceWidth: totalWidth - letterSpacing, // Remove last letter spacing
            leftBearing: left,
        };
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * Enhanced font registry with TTF support
 */
export class TtfFontRegistry {
    private readonly fonts = new Map<string, TtfFont>();
    private readonly document: PdfDocument;

    constructor(document: PdfDocument) {
        this.document = document;
    }

    /**
     * Register a TTF font from font data
     */
    registerTtfFont(fontData: ArrayBuffer, name?: string, protect = false): TtfFont {
        const font = new TtfFont(this.document, fontData, name, protect);
        const fontName = name || font.parser.fontName;

        if (!this.fonts.has(fontName)) {
            this.fonts.set(fontName, font);
        }

        return font;
    }

    /**
     * Get a registered TTF font by name
     */
    getTtfFont(name: string): TtfFont | undefined {
        return this.fonts.get(name);
    }

    /**
     * Get all registered TTF font names
     */
    getTtfFontNames(): string[] {
        return Array.from(this.fonts.keys());
    }

    /**
     * Check if a TTF font is registered
     */
    hasTtfFont(name: string): boolean {
        return this.fonts.has(name);
    }

    /**
     * Remove a TTF font from the registry
     */
    removeTtfFont(name: string): boolean {
        return this.fonts.delete(name);
    }

    /**
     * Clear all TTF fonts from the registry
     */
    clear(): void {
        this.fonts.clear();
    }

    /**
     * Get all registered TTF fonts
     */
    getAllTtfFonts(): TtfFont[] {
        return Array.from(this.fonts.values());
    }
}