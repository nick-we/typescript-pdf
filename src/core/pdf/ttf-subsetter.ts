/**
 * TTF Font Subsetting System
 * 
 * Creates minimal font files containing only the glyphs used in the document.
 * This significantly reduces PDF file size, especially for large fonts or when
 * using only a small subset of characters.
 * 
 * @packageDocumentation
 */

import { TtfParser, type TtfGlyphInfo } from './ttf-parser.js';

/**
 * Glyph information for subsetting
 */
interface SubsetGlyph {
    /** Original glyph index */
    originalIndex: number;
    /** New glyph index in subset */
    newIndex: number;
    /** Glyph data */
    data: Uint8Array;
    /** Compound glyph components */
    components: number[];
    /** Character codes that map to this glyph */
    charCodes: number[];
}

/**
 * Font table entry
 */
interface FontTable {
    /** Table tag */
    tag: string;
    /** Table data */
    data: Uint8Array;
    /** Checksum */
    checksum: number;
}

/**
 * TTF Font Subsetter
 */
export class TtfSubsetter {
    private readonly parser: TtfParser;
    private readonly usedChars = new Set<number>();
    private readonly usedGlyphs = new Map<number, SubsetGlyph>();
    private nextGlyphIndex = 0;

    constructor(fontData: ArrayBuffer) {
        this.parser = new TtfParser(fontData);
    }

    /**
     * Add characters to the subset
     */
    addChars(chars: number[]): void {
        for (const charCode of chars) {
            if (!this.usedChars.has(charCode)) {
                this.usedChars.add(charCode);
                this.addGlyphForChar(charCode);
            }
        }
    }

    /**
     * Add a string of characters to the subset
     */
    addString(text: string): void {
        const chars = Array.from(text).map(char => char.codePointAt(0)!).filter(Boolean);
        this.addChars(chars);
    }

    /**
     * Generate the subset font
     */
    generateSubset(): ArrayBuffer {
        // Always include the .notdef glyph (index 0)
        this.addGlyph(0, []);

        // Create subset tables
        const tables = this.createSubsetTables();

        // Build the font file
        return this.buildFontFile(tables);
    }

    /**
     * Get statistics about the subset
     */
    getStats(): {
        originalGlyphs: number;
        subsetGlyphs: number;
        originalChars: number;
        subsetChars: number;
        compressionRatio: number;
    } {
        const originalGlyphs = this.parser.numGlyphs;
        const subsetGlyphs = this.usedGlyphs.size;
        const originalChars = this.parser.getSupportedChars().length;
        const subsetChars = this.usedChars.size;

        return {
            originalGlyphs,
            subsetGlyphs,
            originalChars,
            subsetChars,
            compressionRatio: subsetGlyphs / originalGlyphs,
        };
    }

    /**
     * Add glyph for character code
     */
    private addGlyphForChar(charCode: number): void {
        const glyphIndex = this.parser.getGlyphIndex(charCode);
        if (glyphIndex !== undefined) {
            this.addGlyph(glyphIndex, [charCode]);
        }
    }

    /**
     * Add glyph and its dependencies
     */
    private addGlyph(glyphIndex: number, charCodes: number[]): void {
        if (this.usedGlyphs.has(glyphIndex)) {
            // Glyph already added, just update character codes
            const existing = this.usedGlyphs.get(glyphIndex)!;
            for (const charCode of charCodes) {
                if (!existing.charCodes.includes(charCode)) {
                    existing.charCodes.push(charCode);
                }
            }
            return;
        }

        // Read glyph data
        const glyphInfo = this.readGlyph(glyphIndex);

        // Create subset glyph
        const subsetGlyph: SubsetGlyph = {
            originalIndex: glyphIndex,
            newIndex: this.nextGlyphIndex++,
            data: glyphInfo.data,
            components: glyphInfo.compounds,
            charCodes: [...charCodes],
        };

        this.usedGlyphs.set(glyphIndex, subsetGlyph);

        // Add composite glyph components
        for (const componentIndex of glyphInfo.compounds) {
            this.addGlyph(componentIndex, []);
        }
    }

    /**
     * Read glyph data from original font
     */
    private readGlyph(glyphIndex: number): TtfGlyphInfo {
        // This would normally read from the original font's glyf table
        // For now, return empty data - in a real implementation this would
        // parse the actual glyph data from the TTF file
        return {
            index: glyphIndex,
            data: new Uint8Array(0),
            compounds: [],
        };
    }

    /**
     * Create subset font tables
     */
    private createSubsetTables(): FontTable[] {
        const tables: FontTable[] = [];

        // Create head table
        tables.push(this.createHeadTable());

        // Create hhea table
        tables.push(this.createHheaTable());

        // Create maxp table
        tables.push(this.createMaxpTable());

        // Create cmap table
        tables.push(this.createCmapTable());

        // Create name table
        tables.push(this.createNameTable());

        // Create post table
        tables.push(this.createPostTable());

        // Create hmtx table
        tables.push(this.createHmtxTable());

        // Create loca table
        tables.push(this.createLocaTable());

        // Create glyf table
        tables.push(this.createGlyfTable());

        return tables;
    }

    /**
     * Create head table
     */
    private createHeadTable(): FontTable {
        const data = new Uint8Array(54);
        const view = new DataView(data.buffer);

        // Copy from original head table with modifications
        view.setUint32(0, 0x00010000); // version
        view.setUint32(4, 0x00010000); // fontRevision
        view.setUint32(8, 0); // checkSumAdjustment (will be calculated later)
        view.setUint32(12, 0x5F0F3CF5); // magicNumber
        view.setUint16(16, 0); // flags
        view.setUint16(18, this.parser.unitsPerEm); // unitsPerEm

        // Copy dates and bounding box from original
        const bbox = this.parser.boundingBox;
        view.setInt16(36, bbox.xMin);
        view.setInt16(38, bbox.yMin);
        view.setInt16(40, bbox.xMax);
        view.setInt16(42, bbox.yMax);

        view.setUint16(44, 0); // macStyle
        view.setUint16(46, 8); // lowestRecPPEM
        view.setInt16(48, 2); // fontDirectionHint
        view.setInt16(50, 1); // indexToLocFormat (1 = long offsets)
        view.setInt16(52, 0); // glyphDataFormat

        return {
            tag: 'head',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create hhea table
     */
    private createHheaTable(): FontTable {
        const data = new Uint8Array(36);
        const view = new DataView(data.buffer);

        view.setUint32(0, 0x00010000); // version
        view.setInt16(4, this.parser.ascent); // ascent
        view.setInt16(6, this.parser.descent); // descent
        view.setInt16(8, this.parser.lineGap); // lineGap
        view.setUint16(10, 1000); // advanceWidthMax (approximation)
        view.setInt16(12, 0); // minLeftSideBearing
        view.setInt16(14, 0); // minRightSideBearing
        view.setInt16(16, 1000); // xMaxExtent
        view.setInt16(18, 1); // caretSlopeRise
        view.setInt16(20, 0); // caretSlopeRun
        view.setInt16(22, 0); // caretOffset
        // 4 reserved bytes
        view.setInt16(32, 0); // metricDataFormat
        view.setUint16(34, this.usedGlyphs.size); // numOfLongHorMetrics

        return {
            tag: 'hhea',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create maxp table
     */
    private createMaxpTable(): FontTable {
        const data = new Uint8Array(32);
        const view = new DataView(data.buffer);

        view.setUint32(0, 0x00010000); // version
        view.setUint16(4, this.usedGlyphs.size); // numGlyphs
        view.setUint16(6, 100); // maxPoints (approximation)
        view.setUint16(8, 10); // maxContours (approximation)
        view.setUint16(10, 100); // maxComponentPoints
        view.setUint16(12, 10); // maxComponentContours
        view.setUint16(14, 2); // maxZones
        view.setUint16(16, 0); // maxTwilightPoints
        view.setUint16(18, 1); // maxStorage
        view.setUint16(20, 1); // maxFunctionDefs
        view.setUint16(22, 0); // maxInstructionDefs
        view.setUint16(24, 64); // maxStackElements
        view.setUint16(26, 0); // maxSizeOfInstructions
        view.setUint16(28, 0); // maxComponentElements
        view.setUint16(30, 2); // maxComponentDepth

        return {
            tag: 'maxp',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create cmap table
     */
    private createCmapTable(): FontTable {
        const numChars = this.usedChars.size;
        const subtableSize = 16 + numChars * 12; // Format 12 subtable
        const totalSize = 4 + 8 + subtableSize; // Header + encoding record + subtable

        const data = new Uint8Array(totalSize);
        const view = new DataView(data.buffer);

        // Cmap header
        view.setUint16(0, 0); // version
        view.setUint16(2, 1); // numSubtables

        // Encoding record
        view.setUint16(4, 3); // platformID (Microsoft)
        view.setUint16(6, 10); // platformSpecificID (Unicode full)
        view.setUint32(8, 12); // offset to subtable

        // Format 12 subtable
        let offset = 12;
        view.setUint16(offset, 12); // format
        offset += 2;
        view.setUint16(offset, 0); // reserved
        offset += 2;
        view.setUint32(offset, subtableSize); // length
        offset += 4;
        view.setUint32(offset, 0); // language
        offset += 4;

        // Create groups for sequential character ranges
        const sortedChars = Array.from(this.usedChars).sort((a, b) => a - b);
        const groups: Array<{ start: number; end: number; startGlyph: number }> = [];

        let currentGroup: { start: number; end: number; startGlyph: number } | null = null;

        for (const charCode of sortedChars) {
            const glyphIndex = this.parser.getGlyphIndex(charCode);
            const subsetGlyph = this.usedGlyphs.get(glyphIndex);

            if (!subsetGlyph) continue;

            if (!currentGroup || charCode !== currentGroup.end + 1) {
                // Start new group
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentGroup = {
                    start: charCode,
                    end: charCode,
                    startGlyph: subsetGlyph.newIndex,
                };
            } else {
                // Extend current group
                currentGroup.end = charCode;
            }
        }

        if (currentGroup) {
            groups.push(currentGroup);
        }

        view.setUint32(offset, groups.length); // numGroups
        offset += 4;

        // Write groups
        for (const group of groups) {
            view.setUint32(offset, group.start); // startCharCode
            view.setUint32(offset + 4, group.end); // endCharCode
            view.setUint32(offset + 8, group.startGlyph); // startGlyphCode
            offset += 12;
        }

        return {
            tag: 'cmap',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create name table (simplified)
     */
    private createNameTable(): FontTable {
        const fontName = this.parser.fontName + '-Subset';
        const nameData = new TextEncoder().encode(fontName);

        const data = new Uint8Array(6 + 12 + nameData.length);
        const view = new DataView(data.buffer);

        // Name table header
        view.setUint16(0, 0); // format
        view.setUint16(2, 1); // count
        view.setUint16(4, 18); // stringOffset

        // Name record for postscript name
        view.setUint16(6, 3); // platformID
        view.setUint16(8, 1); // platformSpecificID
        view.setUint16(10, 0); // languageID
        view.setUint16(12, 6); // nameID (postscript name)
        view.setUint16(14, nameData.length); // length
        view.setUint16(16, 0); // offset

        // String data
        data.set(nameData, 18);

        return {
            tag: 'name',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create post table (simplified)
     */
    private createPostTable(): FontTable {
        const data = new Uint8Array(32);
        const view = new DataView(data.buffer);

        view.setUint32(0, 0x00030000); // version 3.0 (no glyph names)
        view.setUint32(4, 0); // italicAngle
        view.setInt16(8, 0); // underlinePosition
        view.setInt16(10, 0); // underlineThickness
        view.setUint32(12, 0); // isFixedPitch
        view.setUint32(16, 0); // minMemType42
        view.setUint32(20, 0); // maxMemType42
        view.setUint32(24, 0); // minMemType1
        view.setUint32(28, 0); // maxMemType1

        return {
            tag: 'post',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create hmtx table
     */
    private createHmtxTable(): FontTable {
        const glyphs = Array.from(this.usedGlyphs.values()).sort((a, b) => a.newIndex - b.newIndex);
        const data = new Uint8Array(glyphs.length * 4); // longHorMetric for each glyph
        const view = new DataView(data.buffer);

        let offset = 0;
        for (const glyph of glyphs) {
            // Get metrics from original font
            const metrics = this.parser.getGlyphMetrics(glyph.originalIndex);
            const advanceWidth = metrics ? Math.round(metrics.advanceWidth * 1000) : 0;
            const leftBearing = metrics ? Math.round(metrics.leftBearing * 1000) : 0;

            view.setUint16(offset, advanceWidth);
            view.setInt16(offset + 2, leftBearing);
            offset += 4;
        }

        return {
            tag: 'hmtx',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create loca table
     */
    private createLocaTable(): FontTable {
        const glyphs = Array.from(this.usedGlyphs.values()).sort((a, b) => a.newIndex - b.newIndex);
        const data = new Uint8Array((glyphs.length + 1) * 4); // Long format
        const view = new DataView(data.buffer);

        let offset = 0;
        let glyphDataOffset = 0;

        for (let i = 0; i < glyphs.length; i++) {
            const glyph = glyphs[i];
            if (!glyph) continue;
            view.setUint32(i * 4, glyphDataOffset);
            glyphDataOffset += this.alignTo4(glyph.data.length);
        }

        // Final offset
        view.setUint32(glyphs.length * 4, glyphDataOffset);

        return {
            tag: 'loca',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Create glyf table
     */
    private createGlyfTable(): FontTable {
        const glyphs = Array.from(this.usedGlyphs.values()).sort((a, b) => a.newIndex - b.newIndex);

        // Calculate total size
        let totalSize = 0;
        for (const glyph of glyphs) {
            totalSize += this.alignTo4(glyph.data.length);
        }

        const data = new Uint8Array(totalSize);
        let offset = 0;

        for (const glyph of glyphs) {
            data.set(glyph.data, offset);
            offset += this.alignTo4(glyph.data.length);
        }

        return {
            tag: 'glyf',
            data,
            checksum: this.calculateChecksum(data),
        };
    }

    /**
     * Build the complete font file
     */
    private buildFontFile(tables: FontTable[]): ArrayBuffer {
        // Sort tables by tag for binary search
        tables.sort((a, b) => a.tag.localeCompare(b.tag));

        // Calculate offsets
        const numTables = tables.length;
        const headerSize = 12 + numTables * 16;
        let offset = headerSize;

        for (const table of tables) {
            offset = this.alignTo4(offset);
            table.checksum = this.calculateChecksum(table.data);
            offset += table.data.length;
        }

        // Allocate buffer
        const totalSize = this.alignTo4(offset);
        const buffer = new ArrayBuffer(totalSize);
        const data = new Uint8Array(buffer);
        const view = new DataView(buffer);

        // Write font header
        view.setUint32(0, 0x00010000); // sfnt version
        view.setUint16(4, numTables); // numTables

        // Calculate search range, entry selector, range shift
        const entrySelector = Math.floor(Math.log2(numTables));
        const searchRange = Math.pow(2, entrySelector) * 16;
        const rangeShift = numTables * 16 - searchRange;

        view.setUint16(6, searchRange);
        view.setUint16(8, entrySelector);
        view.setUint16(10, rangeShift);

        // Write table directory
        offset = headerSize;
        for (let i = 0; i < numTables; i++) {
            const table = tables[i];
            if (!table) continue;
            const dirOffset = 12 + i * 16;

            // Table tag
            for (let j = 0; j < 4; j++) {
                view.setUint8(dirOffset + j, table.tag.charCodeAt(j) || 0);
            }

            offset = this.alignTo4(offset);
            view.setUint32(dirOffset + 4, table.checksum);
            view.setUint32(dirOffset + 8, offset);
            view.setUint32(dirOffset + 12, table.data.length);

            // Write table data
            data.set(table.data, offset);
            offset += table.data.length;
        }

        return buffer;
    }

    /**
     * Calculate table checksum
     */
    private calculateChecksum(data: Uint8Array): number {
        let sum = 0;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

        // Pad to 4-byte boundary for checksum calculation
        const paddedLength = Math.ceil(data.length / 4) * 4;

        for (let i = 0; i < paddedLength; i += 4) {
            let value = 0;
            if (i < data.length) value |= view.getUint8(i) << 24;
            if (i + 1 < data.length) value |= view.getUint8(i + 1) << 16;
            if (i + 2 < data.length) value |= view.getUint8(i + 2) << 8;
            if (i + 3 < data.length) value |= view.getUint8(i + 3);

            sum = (sum + value) >>> 0; // Unsigned 32-bit addition
        }

        return sum;
    }

    /**
     * Align offset to 4-byte boundary
     */
    private alignTo4(offset: number): number {
        return (offset + 3) & ~3;
    }
}

/**
 * Create subset from used characters
 */
export function createFontSubset(fontData: ArrayBuffer, usedChars: Set<number>): ArrayBuffer {
    const subsetter = new TtfSubsetter(fontData);
    subsetter.addChars(Array.from(usedChars));
    return subsetter.generateSubset();
}

/**
 * Create subset from text content
 */
export function createFontSubsetFromText(fontData: ArrayBuffer, texts: string[]): ArrayBuffer {
    const subsetter = new TtfSubsetter(fontData);
    for (const text of texts) {
        subsetter.addString(text);
    }
    return subsetter.generateSubset();
}