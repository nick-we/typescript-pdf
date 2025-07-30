/**
 * TTF Font Parser
 * 
 * Parses TrueType Font files to extract metadata, glyph information,
 * and character mappings for PDF generation.
 * 
 * Based on the TrueType specification and dart-pdf implementation.
 * 
 * @packageDocumentation
 */

/**
 * TTF Name ID enumeration for font metadata
 */
export enum TtfNameId {
    Copyright = 0,
    FontFamily = 1,
    FontSubfamily = 2,
    UniqueId = 3,
    FullName = 4,
    Version = 5,
    PostScriptName = 6,
    Trademark = 7,
    Manufacturer = 8,
    Designer = 9,
    Description = 10,
    ManufacturerUrl = 11,
    DesignerUrl = 12,
    License = 13,
    LicenseUrl = 14,
    Reserved = 15,
    PreferredFamily = 16,
    PreferredSubfamily = 17,
    CompatibleFullName = 18,
    SampleText = 19,
    PostScriptFindFontName = 20,
    WwsFamily = 21,
    WwsSubfamily = 22,
}

/**
 * Font metrics for individual glyphs
 */
export interface TtfGlyphMetrics {
    /** Glyph bounding box left */
    left: number;
    /** Glyph bounding box top */
    top: number;
    /** Glyph bounding box right */
    right: number;
    /** Glyph bounding box bottom */
    bottom: number;
    /** Font ascent */
    ascent: number;
    /** Font descent */
    descent: number;
    /** Advance width for horizontal layout */
    advanceWidth: number;
    /** Left side bearing */
    leftBearing: number;
}

/**
 * TTF Glyph information
 */
export interface TtfGlyphInfo {
    /** Glyph index */
    index: number;
    /** Raw glyph data */
    data: Uint8Array;
    /** Compound glyph component indices */
    compounds: number[];
}

/**
 * TTF Table directory entry
 */
interface TtfTableEntry {
    /** Table tag */
    tag: string;
    /** Checksum */
    checksum: number;
    /** Offset in file */
    offset: number;
    /** Length of table */
    length: number;
}

/**
 * TTF Parser class for reading TrueType font files
 */
export class TtfParser {
    // TTF Table constants
    private static readonly HEAD_TABLE = 'head';
    private static readonly NAME_TABLE = 'name';
    private static readonly HMTX_TABLE = 'hmtx';
    private static readonly HHEA_TABLE = 'hhea';
    private static readonly CMAP_TABLE = 'cmap';
    private static readonly MAXP_TABLE = 'maxp';
    private static readonly LOCA_TABLE = 'loca';
    private static readonly GLYF_TABLE = 'glyf';
    private static readonly POST_TABLE = 'post';
    private static readonly OS2_TABLE = 'OS/2';

    private readonly data: DataView;
    private readonly tables = new Map<string, TtfTableEntry>();
    private readonly charToGlyphMap = new Map<number, number>();
    private readonly glyphMetrics = new Map<number, TtfGlyphMetrics>();
    private glyphOffsets: number[] = [];
    private glyphSizes: number[] = [];

    private _fontName?: string;
    private _unitsPerEm?: number;
    private _ascent?: number;
    private _descent?: number;
    private _lineGap?: number;
    private _numGlyphs?: number;
    private _indexToLocFormat?: number;
    private _numOfLongHorMetrics?: number;

    constructor(fontData: ArrayBuffer) {
        this.data = new DataView(fontData);
        this.parseTables();
        this.validateRequiredTables();
        this.parseCharacterMap();
        this.parseGlyphMetrics();
    }

    /**
     * Get font name (PostScript name preferred)
     */
    get fontName(): string {
        if (!this._fontName) {
            this._fontName = this.getNameById(TtfNameId.PostScriptName) ||
                this.getNameById(TtfNameId.FullName) ||
                this.getNameById(TtfNameId.FontFamily) ||
                'UnknownFont';
        }
        return this._fontName;
    }

    /**
     * Get units per em from head table
     */
    get unitsPerEm(): number {
        if (this._unitsPerEm === undefined) {
            const headTable = this.tables.get(TtfParser.HEAD_TABLE)!;
            this._unitsPerEm = this.data.getUint16(headTable.offset + 18);
        }
        return this._unitsPerEm;
    }

    /**
     * Get font ascent from hhea table
     */
    get ascent(): number {
        if (this._ascent === undefined) {
            const hheaTable = this.tables.get(TtfParser.HHEA_TABLE)!;
            this._ascent = this.data.getInt16(hheaTable.offset + 4);
        }
        return this._ascent;
    }

    /**
     * Get font descent from hhea table
     */
    get descent(): number {
        if (this._descent === undefined) {
            const hheaTable = this.tables.get(TtfParser.HHEA_TABLE)!;
            this._descent = this.data.getInt16(hheaTable.offset + 6);
        }
        return this._descent;
    }

    /**
     * Get line gap from hhea table
     */
    get lineGap(): number {
        if (this._lineGap === undefined) {
            const hheaTable = this.tables.get(TtfParser.HHEA_TABLE)!;
            this._lineGap = this.data.getInt16(hheaTable.offset + 8);
        }
        return this._lineGap;
    }

    /**
     * Get number of glyphs from maxp table
     */
    get numGlyphs(): number {
        if (this._numGlyphs === undefined) {
            const maxpTable = this.tables.get(TtfParser.MAXP_TABLE)!;
            this._numGlyphs = this.data.getUint16(maxpTable.offset + 4);
        }
        return this._numGlyphs;
    }

    /**
     * Get bounding box coordinates
     */
    get boundingBox(): { xMin: number; yMin: number; xMax: number; yMax: number } {
        const headTable = this.tables.get(TtfParser.HEAD_TABLE)!;
        return {
            xMin: this.data.getInt16(headTable.offset + 36),
            yMin: this.data.getInt16(headTable.offset + 38),
            xMax: this.data.getInt16(headTable.offset + 40),
            yMax: this.data.getInt16(headTable.offset + 42),
        };
    }

    /**
     * Check if font supports Unicode
     */
    get isUnicode(): boolean {
        return this.data.getUint32(0) === 0x00010000;
    }

    /**
     * Get glyph index for character code
     */
    getGlyphIndex(charCode: number): number {
        return this.charToGlyphMap.get(charCode) || 0;
    }

    /**
     * Get metrics for a glyph
     */
    getGlyphMetrics(glyphIndex: number): TtfGlyphMetrics | undefined {
        return this.glyphMetrics.get(glyphIndex);
    }

    /**
     * Get metrics for a character
     */
    getCharMetrics(charCode: number): TtfGlyphMetrics | undefined {
        const glyphIndex = this.getGlyphIndex(charCode);
        return this.getGlyphMetrics(glyphIndex);
    }

    /**
     * Check if character is supported by font
     */
    isCharSupported(charCode: number): boolean {
        return this.charToGlyphMap.has(charCode);
    }

    /**
     * Get font name by name ID
     */
    getNameById(nameId: TtfNameId): string | undefined {
        const nameTable = this.tables.get(TtfParser.NAME_TABLE);
        if (!nameTable) return undefined;

        const baseOffset = nameTable.offset;
        const count = this.data.getUint16(baseOffset + 2);
        const stringOffset = this.data.getUint16(baseOffset + 4);
        let offset = baseOffset + 6;

        let result: string | undefined = undefined;

        for (let i = 0; i < count; i++) {
            const platformId = this.data.getUint16(offset);
            const nameIdValue = this.data.getUint16(offset + 6);
            const length = this.data.getUint16(offset + 8);
            const stringOffsetValue = this.data.getUint16(offset + 10);
            offset += 12;

            if (nameIdValue === nameId) {
                try {
                    const stringData = new Uint8Array(
                        this.data.buffer,
                        this.data.byteOffset + baseOffset + stringOffset + stringOffsetValue,
                        length
                    );

                    if (platformId === 1) {
                        // Macintosh, UTF-8
                        result = new TextDecoder('utf-8').decode(stringData);
                    } else if (platformId === 3) {
                        // Microsoft, UTF-16BE
                        return this.decodeUtf16BE(stringData);
                    }
                } catch (error) {
                    console.warn(`Error decoding font name: ${error}`);
                }
            }
        }

        return result;
    }

    /**
     * Measure text width in font units
     */
    measureText(text: string): number {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            const charCode = text.codePointAt(i) || 0;
            const metrics = this.getCharMetrics(charCode);
            if (metrics) {
                width += metrics.advanceWidth;
            }
            // Handle surrogate pairs
            if (charCode > 0xFFFF) i++;
        }
        return width;
    }

    /**
     * Get all supported character codes
     */
    getSupportedChars(): number[] {
        return Array.from(this.charToGlyphMap.keys());
    }

    /**
     * Parse TTF table directory
     */
    private parseTables(): void {
        const numTables = this.data.getUint16(4);

        for (let i = 0; i < numTables; i++) {
            const offset = 12 + i * 16;
            const tag = this.readString(offset, 4);
            const checksum = this.data.getUint32(offset + 4);
            const tableOffset = this.data.getUint32(offset + 8);
            const length = this.data.getUint32(offset + 12);

            this.tables.set(tag, {
                tag,
                checksum,
                offset: tableOffset,
                length,
            });
        }
    }

    /**
     * Validate that required tables are present
     */
    private validateRequiredTables(): void {
        const requiredTables = [
            TtfParser.HEAD_TABLE,
            TtfParser.NAME_TABLE,
            TtfParser.HMTX_TABLE,
            TtfParser.HHEA_TABLE,
            TtfParser.CMAP_TABLE,
            TtfParser.MAXP_TABLE,
        ];

        for (const table of requiredTables) {
            if (!this.tables.has(table)) {
                throw new Error(`Required TTF table '${table}' not found`);
            }
        }
    }

    /**
     * Parse character to glyph mapping from cmap table
     */
    private parseCharacterMap(): void {
        const cmapTable = this.tables.get(TtfParser.CMAP_TABLE)!;
        const baseOffset = cmapTable.offset;
        const numSubTables = this.data.getUint16(baseOffset + 2);

        for (let i = 0; i < numSubTables; i++) {
            const offset = this.data.getUint32(baseOffset + 4 + i * 8);
            const format = this.data.getUint16(baseOffset + offset);

            try {
                switch (format) {
                    case 0:
                        this.parseCmapFormat0(baseOffset + offset);
                        break;
                    case 4:
                        this.parseCmapFormat4(baseOffset + offset);
                        break;
                    case 6:
                        this.parseCmapFormat6(baseOffset + offset);
                        break;
                    case 12:
                        this.parseCmapFormat12(baseOffset + offset);
                        break;
                }
            } catch (error) {
                console.warn(`Error parsing cmap format ${format}: ${error}`);
            }
        }
    }

    /**
     * Parse cmap format 0 (byte encoding table)
     */
    private parseCmapFormat0(offset: number): void {
        for (let i = 0; i < 256; i++) {
            const glyphIndex = this.data.getUint8(offset + 6 + i);
            if (glyphIndex > 0) {
                this.charToGlyphMap.set(i, glyphIndex);
            }
        }
    }

    /**
     * Parse cmap format 4 (segment mapping to delta values)
     */
    private parseCmapFormat4(offset: number): void {
        const segCount = this.data.getUint16(offset + 6) / 2;
        const endCodes: number[] = [];
        const startCodes: number[] = [];
        const idDeltas: number[] = [];
        const idRangeOffsets: number[] = [];

        // Read end codes
        for (let i = 0; i < segCount; i++) {
            endCodes.push(this.data.getUint16(offset + 14 + i * 2));
        }

        // Read start codes
        for (let i = 0; i < segCount; i++) {
            startCodes.push(this.data.getUint16(offset + 16 + segCount * 2 + i * 2));
        }

        // Read id deltas
        for (let i = 0; i < segCount; i++) {
            idDeltas.push(this.data.getInt16(offset + 16 + segCount * 4 + i * 2));
        }

        // Read id range offsets
        const idRangeOffsetBase = offset + 16 + segCount * 6;
        for (let i = 0; i < segCount; i++) {
            idRangeOffsets.push(this.data.getUint16(idRangeOffsetBase + i * 2));
        }

        // Map characters to glyphs
        for (let s = 0; s < segCount - 1; s++) {
            const startCode = startCodes[s];
            const endCode = endCodes[s];
            const idDelta = idDeltas[s];
            const idRangeOffset = idRangeOffsets[s];

            if (startCode === undefined || endCode === undefined || idDelta === undefined || idRangeOffset === undefined) {
                continue;
            }

            for (let c = startCode; c <= endCode; c++) {
                let glyphIndex: number;
                if (idRangeOffset === 0) {
                    glyphIndex = (idDelta + c) & 0xFFFF;
                } else {
                    const glyphIndexOffset = idRangeOffsetBase + s * 2 + idRangeOffset + 2 * (c - startCode);
                    glyphIndex = this.data.getUint16(glyphIndexOffset);
                    if (glyphIndex !== 0) {
                        glyphIndex = (glyphIndex + idDelta) & 0xFFFF;
                    }
                }
                if (glyphIndex > 0) {
                    this.charToGlyphMap.set(c, glyphIndex);
                }
            }
        }
    }

    /**
     * Parse cmap format 6 (trimmed table mapping)
     */
    private parseCmapFormat6(offset: number): void {
        const firstCode = this.data.getUint16(offset + 10);
        const entryCount = this.data.getUint16(offset + 12);

        for (let i = 0; i < entryCount; i++) {
            const charCode = firstCode + i;
            const glyphIndex = this.data.getUint16(offset + 14 + i * 2);
            if (glyphIndex > 0) {
                this.charToGlyphMap.set(charCode, glyphIndex);
            }
        }
    }

    /**
     * Parse cmap format 12 (segmented coverage)
     */
    private parseCmapFormat12(offset: number): void {
        const numGroups = this.data.getUint32(offset + 12);

        for (let i = 0; i < numGroups; i++) {
            const groupOffset = offset + 16 + i * 12;
            const startCharCode = this.data.getUint32(groupOffset);
            const endCharCode = this.data.getUint32(groupOffset + 4);
            const startGlyphId = this.data.getUint32(groupOffset + 8);

            for (let c = startCharCode; c <= endCharCode; c++) {
                const glyphIndex = startGlyphId + c - startCharCode;
                this.charToGlyphMap.set(c, glyphIndex);
            }
        }
    }

    /**
     * Parse glyph metrics from hmtx table
     */
    private parseGlyphMetrics(): void {
        const hmtxTable = this.tables.get(TtfParser.HMTX_TABLE)!;
        const hheaTable = this.tables.get(TtfParser.HHEA_TABLE)!;

        this._numOfLongHorMetrics = this.data.getUint16(hheaTable.offset + 34);
        const numOfLongHorMetrics = this._numOfLongHorMetrics!;

        // Parse glyf table if available for bounding boxes
        const hasGlyfTable = this.tables.has(TtfParser.GLYF_TABLE) && this.tables.has(TtfParser.LOCA_TABLE);
        if (hasGlyfTable) {
            this.parseGlyphOffsets();
        }

        const hmtxOffset = hmtxTable.offset;
        const unitsPerEm = this.unitsPerEm;
        const ascent = this.ascent;
        const descent = this.descent;

        // Get default advance width from last long hor metric
        const defaultAdvanceWidth = numOfLongHorMetrics > 0
            ? this.data.getUint16(hmtxOffset + (numOfLongHorMetrics - 1) * 4)
            : 0;

        for (let glyphIndex = 0; glyphIndex < this.numGlyphs; glyphIndex++) {
            const advanceWidth = glyphIndex < numOfLongHorMetrics
                ? this.data.getUint16(hmtxOffset + glyphIndex * 4)
                : defaultAdvanceWidth;

            const leftBearing = glyphIndex < numOfLongHorMetrics
                ? this.data.getInt16(hmtxOffset + glyphIndex * 4 + 2)
                : this.data.getInt16(hmtxOffset + numOfLongHorMetrics * 4 + (glyphIndex - numOfLongHorMetrics) * 2);

            let bbox = { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };

            if (hasGlyfTable && glyphIndex < this.glyphOffsets.length && (this.glyphSizes[glyphIndex] ?? 0) > 0) {
                const glyfTable = this.tables.get(TtfParser.GLYF_TABLE)!;
                const glyphOffset = this.glyphOffsets[glyphIndex];
                if (glyphOffset !== undefined) {
                    bbox = {
                        xMin: this.data.getInt16(glyfTable.offset + glyphOffset + 2),
                        yMin: this.data.getInt16(glyfTable.offset + glyphOffset + 4),
                        xMax: this.data.getInt16(glyfTable.offset + glyphOffset + 6),
                        yMax: this.data.getInt16(glyfTable.offset + glyphOffset + 8),
                    };
                }
            }

            this.glyphMetrics.set(glyphIndex, {
                left: bbox.xMin / unitsPerEm,
                top: bbox.yMin / unitsPerEm,
                right: bbox.xMax / unitsPerEm,
                bottom: bbox.yMax / unitsPerEm,
                ascent: ascent / unitsPerEm,
                descent: descent / unitsPerEm,
                advanceWidth: advanceWidth / unitsPerEm,
                leftBearing: leftBearing / unitsPerEm,
            });
        }
    }

    /**
     * Parse glyph offsets from loca table
     */
    private parseGlyphOffsets(): void {
        const locaTable = this.tables.get(TtfParser.LOCA_TABLE)!;
        const headTable = this.tables.get(TtfParser.HEAD_TABLE)!;

        this._indexToLocFormat = this.data.getInt16(headTable.offset + 50);
        const indexToLocFormat = this._indexToLocFormat!;

        const baseOffset = locaTable.offset;

        if (indexToLocFormat === 0) {
            // Short offsets (divided by 2)
            let prevOffset = this.data.getUint16(baseOffset) * 2;
            for (let i = 1; i < this.numGlyphs + 1; i++) {
                const offset = this.data.getUint16(baseOffset + i * 2) * 2;
                this.glyphOffsets.push(prevOffset);
                this.glyphSizes.push(offset - prevOffset);
                prevOffset = offset;
            }
        } else {
            // Long offsets
            let prevOffset = this.data.getUint32(baseOffset);
            for (let i = 1; i < this.numGlyphs + 1; i++) {
                const offset = this.data.getUint32(baseOffset + i * 4);
                this.glyphOffsets.push(prevOffset);
                this.glyphSizes.push(offset - prevOffset);
                prevOffset = offset;
            }
        }
    }

    /**
     * Read string from data
     */
    private readString(offset: number, length: number): string {
        const bytes = new Uint8Array(this.data.buffer, this.data.byteOffset + offset, length);
        return new TextDecoder('ascii').decode(bytes);
    }

    /**
     * Decode UTF-16 Big Endian string
     */
    private decodeUtf16BE(bytes: Uint8Array): string {
        const charCodes: number[] = [];
        for (let i = 0; i < bytes.length - 1; i += 2) {
            const byte1 = bytes[i];
            const byte2 = bytes[i + 1];
            if (byte1 !== undefined && byte2 !== undefined) {
                charCodes.push((byte1 << 8) | byte2);
            }
        }
        return String.fromCharCode(...charCodes);
    }
}