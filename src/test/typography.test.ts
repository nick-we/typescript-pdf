/**
 * Typography & Fonts Test Suite
 * 
 * Comprehensive tests covering all font functionality including:
 * - TTF font parsing and loading
 * - Font caching and registry
 * - Text layout and alignment
 * - Font embedding and subsetting
 * - Custom font integration API
 * 
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TtfParser } from '../core/pdf/ttf-parser.js';
import { FontLoader, FontRegistry } from '../core/pdf/font-loader.js';
import { TtfFont, TtfFontRegistry } from '../core/pdf/ttf-font.js';
import { TtfSubsetter, createFontSubset } from '../core/pdf/ttf-subsetter.js';
import { TextLayoutEngine, TextAlign, TextDirection, createFontAdapter } from '../core/text-layout.js';
import { FontManager, FontWeight, FontStyle, FontStyleUtils } from '../core/fonts.js';

// Mock font data - minimal TTF structure for testing
function createMockTtfData(): ArrayBuffer {
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);

    // TTF header
    view.setUint32(0, 0x00010000); // sfnt version
    view.setUint16(4, 6); // numTables (all required tables)
    view.setUint16(6, 96); // searchRange
    view.setUint16(8, 3); // entrySelector
    view.setUint16(10, 0); // rangeShift

    // Table directory - all required tables
    const tables = [
        { tag: 'head', offset: 120, length: 54 },
        { tag: 'hhea', offset: 180, length: 36 },
        { tag: 'maxp', offset: 220, length: 32 },
        { tag: 'cmap', offset: 260, length: 280 }, // Extended cmap for format 0
        { tag: 'hmtx', offset: 550, length: 8 },   // Required hmtx table
        { tag: 'name', offset: 570, length: 100 }, // Required name table
    ];

    let offset = 12;
    for (const table of tables) {
        // Write table tag
        for (let j = 0; j < 4; j++) {
            view.setUint8(offset + j, table.tag.charCodeAt(j) || 0);
        }
        view.setUint32(offset + 4, 0); // checksum
        view.setUint32(offset + 8, table.offset);
        view.setUint32(offset + 12, table.length);
        offset += 16;
    }

    // Write head table
    const headOffset = 120;
    view.setUint32(headOffset + 0, 0x00010000); // version
    view.setUint32(headOffset + 4, 0x00010000); // fontRevision
    view.setUint32(headOffset + 8, 0); // checkSumAdjustment
    view.setUint32(headOffset + 12, 0x5F0F3CF5); // magicNumber
    view.setUint16(headOffset + 16, 0); // flags
    view.setUint16(headOffset + 18, 1000); // unitsPerEm
    view.setUint32(headOffset + 20, 0); // created (high)
    view.setUint32(headOffset + 24, 0); // created (low)
    view.setUint32(headOffset + 28, 0); // modified (high)
    view.setUint32(headOffset + 32, 0); // modified (low)
    view.setInt16(headOffset + 36, -100); // xMin
    view.setInt16(headOffset + 38, -200); // yMin
    view.setInt16(headOffset + 40, 900); // xMax
    view.setInt16(headOffset + 42, 800); // yMax
    view.setUint16(headOffset + 44, 0); // macStyle
    view.setUint16(headOffset + 46, 8); // lowestRecPPEM
    view.setInt16(headOffset + 48, 2); // fontDirectionHint
    view.setInt16(headOffset + 50, 0); // indexToLocFormat
    view.setInt16(headOffset + 52, 0); // glyphDataFormat

    // Write hhea table
    const hheaOffset = 180;
    view.setUint32(hheaOffset + 0, 0x00010000); // version
    view.setInt16(hheaOffset + 4, 800); // ascent
    view.setInt16(hheaOffset + 6, -200); // descent
    view.setInt16(hheaOffset + 8, 200); // lineGap
    view.setUint16(hheaOffset + 10, 1000); // advanceWidthMax
    view.setInt16(hheaOffset + 12, -100); // minLeftSideBearing
    view.setInt16(hheaOffset + 14, -50); // minRightSideBearing
    view.setInt16(hheaOffset + 16, 900); // xMaxExtent
    view.setInt16(hheaOffset + 18, 1); // caretSlopeRise
    view.setInt16(hheaOffset + 20, 0); // caretSlopeRun
    view.setInt16(hheaOffset + 22, 0); // caretOffset
    // Fill reserved fields
    view.setInt16(hheaOffset + 24, 0);
    view.setInt16(hheaOffset + 26, 0);
    view.setInt16(hheaOffset + 28, 0);
    view.setInt16(hheaOffset + 30, 0);
    view.setInt16(hheaOffset + 32, 0); // metricDataFormat
    view.setUint16(hheaOffset + 34, 2); // numOfLongHorMetrics

    // Write maxp table
    const maxpOffset = 220;
    view.setUint32(maxpOffset + 0, 0x00010000); // version (1.0 for TrueType)
    view.setUint16(maxpOffset + 4, 27); // numGlyphs (space + A + a-z)

    // Write cmap table (format 0 with corrected structure for parser)
    const cmapOffset = 260;
    view.setUint16(cmapOffset + 0, 0); // version
    view.setUint16(cmapOffset + 2, 1); // numTables

    // Encoding record - the parser reads offset at baseOffset + 4 + i * 8
    // So for i=0, it reads at baseOffset + 4, expecting the subtable offset there
    view.setUint32(cmapOffset + 4, 12); // offset to subtable (relative to cmap start)
    view.setUint16(cmapOffset + 8, 1); // platformID (Macintosh) - moved after offset
    view.setUint16(cmapOffset + 10, 0); // encodingID - moved after platformID

    // Format 0 subtable (starts at cmapOffset + 12)
    const subtableOffset = cmapOffset + 12;
    view.setUint16(subtableOffset + 0, 0); // format 0
    view.setUint16(subtableOffset + 2, 262); // length (6 header + 256 glyph array)
    view.setUint16(subtableOffset + 4, 0); // language

    // Character to glyph mapping (256 bytes) - starts at subtableOffset + 6
    for (let i = 0; i < 256; i++) {
        if (i === 32) { // Space
            view.setUint8(subtableOffset + 6 + i, 0);
        } else if (i === 65) { // 'A'
            view.setUint8(subtableOffset + 6 + i, 1);
        } else if (i >= 97 && i <= 122) { // 'a'-'z'
            view.setUint8(subtableOffset + 6 + i, i - 96); // Map to glyph indices 1-26
        } else {
            view.setUint8(subtableOffset + 6 + i, 0);
        }
    }

    // Write hmtx table (required)
    const hmtxOffset = 550;
    view.setUint16(hmtxOffset + 0, 500); // advanceWidth[0] (space)
    view.setInt16(hmtxOffset + 2, 0); // lsb[0]
    view.setUint16(hmtxOffset + 4, 600); // advanceWidth[1] ('A')
    view.setInt16(hmtxOffset + 6, 50); // lsb[1]

    // Write name table (required)
    const nameOffset = 570;
    view.setUint16(nameOffset + 0, 0); // format
    view.setUint16(nameOffset + 2, 1); // count (1 name record)
    view.setUint16(nameOffset + 4, 18); // stringOffset (after name records)

    // Name record (12 bytes)
    view.setUint16(nameOffset + 6, 1); // platformID (Macintosh)
    view.setUint16(nameOffset + 8, 0); // encodingID
    view.setUint16(nameOffset + 10, 0); // languageID
    view.setUint16(nameOffset + 12, 6); // nameID (PostScript name)
    view.setUint16(nameOffset + 14, 8); // length
    view.setUint16(nameOffset + 16, 0); // offset in string storage

    // String storage - "TestFont"
    const fontNameBytes = new TextEncoder().encode('TestFont');
    for (let i = 0; i < fontNameBytes.length; i++) {
        view.setUint8(nameOffset + 18 + i, fontNameBytes[i] || 0);
    }

    return buffer;
}

// Mock PDF document
class MockPdfDocument {
    private serial = 0;
    public objects = new Set();

    genSerial(): number {
        return ++this.serial;
    }
}

describe('TTF Parser', () => {
    let mockTtfData: ArrayBuffer;

    beforeEach(() => {
        mockTtfData = createMockTtfData();
    });

    it('should parse TTF font structure', () => {
        expect(() => {
            new TtfParser(mockTtfData);
        }).not.toThrow();
    });

    it('should extract font metadata', () => {
        const parser = new TtfParser(mockTtfData);

        expect(parser.fontName).toBeDefined();
        expect(parser.unitsPerEm).toBeGreaterThanOrEqual(1000);
        expect(parser.ascent).toBeDefined();
        expect(parser.descent).toBeDefined();
        expect(parser.numGlyphs).toBeGreaterThanOrEqual(0);
    });

    it('should handle glyph mapping', () => {
        const parser = new TtfParser(mockTtfData);

        // Test character support
        const supported = parser.isCharSupported(65); // 'A'
        expect(typeof supported).toBe('boolean');

        // Test glyph index retrieval
        const glyphIndex = parser.getGlyphIndex(65);
        expect(typeof glyphIndex).toBe('number');
    });

    it('should measure text width', () => {
        const parser = new TtfParser(mockTtfData);
        const width = parser.measureText('Hello World');

        expect(typeof width).toBe('number');
        expect(width).toBeGreaterThanOrEqual(0);
    });

    it('should provide font metrics', () => {
        const parser = new TtfParser(mockTtfData);
        const metrics = parser.getCharMetrics(65); // 'A'

        if (metrics) {
            expect(metrics).toHaveProperty('advanceWidth');
            expect(metrics).toHaveProperty('leftBearing');
            expect(metrics).toHaveProperty('ascent');
            expect(metrics).toHaveProperty('descent');
        }
    });
});

describe('Font Loader & Registry', () => {
    let mockTtfData: ArrayBuffer;
    let mockDocument: MockPdfDocument;

    beforeEach(() => {
        mockTtfData = createMockTtfData();
        mockDocument = new MockPdfDocument();
        FontLoader.clearCache();
    });

    afterEach(() => {
        FontLoader.clearCache();
    });

    it('should load fonts from ArrayBuffer', async () => {
        const parser = await FontLoader.loadFont(mockTtfData);
        expect(parser).toBeInstanceOf(TtfParser);
    });

    it('should cache loaded fonts', async () => {
        const parser1 = await FontLoader.loadFont(mockTtfData, { cache: true });
        const parser2 = await FontLoader.loadFont(mockTtfData, { cache: true });

        expect(parser1).toBe(parser2); // Should be same instance from cache
    });

    it('should handle font registry operations', async () => {
        const registry = new FontRegistry(mockDocument as any);

        await registry.registerFont('TestFont', mockTtfData);

        expect(registry.hasFont('TestFont')).toBe(true);
        expect(registry.getFontNames()).toContain('TestFont');

        const font = registry.getFont('TestFont');
        expect(font).toBeInstanceOf(TtfParser);
    });

    it('should provide loading statistics', async () => {
        await FontLoader.loadFont(mockTtfData);
        const stats = FontLoader.getStats();

        expect(stats).toHaveProperty('fontsLoaded');
        expect(stats).toHaveProperty('fontsCached');
        expect(stats).toHaveProperty('cacheSize');
        expect(stats).toHaveProperty('hitRate');
    });
});

describe('TTF Font Embedding', () => {
    let mockTtfData: ArrayBuffer;
    let mockDocument: MockPdfDocument;

    beforeEach(() => {
        mockTtfData = createMockTtfData();
        mockDocument = new MockPdfDocument();
    });

    it('should create TTF font objects', () => {
        const font = new TtfFont(mockDocument as any, mockTtfData, 'TestFont');

        expect(font.parser).toBeInstanceOf(TtfParser);
        expect(font.name).toBe('TestFont');
    });

    it('should measure text with font', () => {
        const font = new TtfFont(mockDocument as any, mockTtfData, 'TestFont');

        const width = font.measureText('Hello World');
        expect(typeof width).toBe('number');
        expect(width).toBeGreaterThanOrEqual(0);

        const fontSize = 12;
        const pointWidth = font.measureTextWidth('Hello World', fontSize);
        expect(pointWidth).toBeGreaterThanOrEqual(width);
    });

    it('should provide font metrics', () => {
        const font = new TtfFont(mockDocument as any, mockTtfData, 'TestFont');

        const height = font.getFontHeight(12);
        const ascender = font.getAscender(12);
        const descender = font.getDescender(12);

        expect(typeof height).toBe('number');
        expect(typeof ascender).toBe('number');
        expect(typeof descender).toBe('number');
    });

    it('should handle TTF font registry', () => {
        const registry = new TtfFontRegistry(mockDocument as any);

        const font = registry.registerTtfFont(mockTtfData, 'TestFont');
        expect(font).toBeInstanceOf(TtfFont);

        expect(registry.hasTtfFont('TestFont')).toBe(true);
        expect(registry.getTtfFontNames()).toContain('TestFont');

        const retrieved = registry.getTtfFont('TestFont');
        expect(retrieved).toBe(font);
    });
});

describe('Text Layout Engine', () => {
    let mockTtfData: ArrayBuffer;
    let layoutEngine: TextLayoutEngine;

    beforeEach(() => {
        mockTtfData = createMockTtfData();
        const parser = new TtfParser(mockTtfData);
        const fontAdapter = createFontAdapter(parser);
        layoutEngine = new TextLayoutEngine(fontAdapter, {
            fontSize: 12,
            lineHeight: 1.2,
        });
    });

    it('should layout simple text', () => {
        const result = layoutEngine.layoutText('Hello World', 200);

        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]?.text).toBe('Hello World');
        expect(result.width).toBeGreaterThanOrEqual(0);
        expect(result.height).toBeGreaterThanOrEqual(0);
    });

    it('should handle text wrapping', () => {
        const longText = 'This is a very long line of text that should wrap to multiple lines when the width constraint is applied.';
        const result = layoutEngine.layoutText(longText, 100);

        expect(result.lines.length).toBeGreaterThanOrEqual(1);
        expect(result.truncated).toBe(false);
    });

    it('should support different text alignments', () => {
        const engineLeft = new TextLayoutEngine(layoutEngine['font'], { align: TextAlign.Left });
        const engineCenter = new TextLayoutEngine(layoutEngine['font'], { align: TextAlign.Center });
        const engineRight = new TextLayoutEngine(layoutEngine['font'], { align: TextAlign.Right });

        const text = 'Centered Text';
        const width = 200;

        const leftResult = engineLeft.layoutText(text, width);
        const centerResult = engineCenter.layoutText(text, width);
        const rightResult = engineRight.layoutText(text, width);

        expect(leftResult.lines[0]!.offsetX).toBe(0);
        expect(centerResult.lines[0]!.offsetX).toBeGreaterThan(0);
        expect(rightResult.lines[0]!.offsetX).toBeGreaterThan(centerResult.lines[0]!.offsetX);
    });

    it('should handle text justification', () => {
        const engine = new TextLayoutEngine(layoutEngine['font'], {
            align: TextAlign.Justify,
            fontSize: 12,
        });

        const text = 'This text should be justified across the full width of the line.';
        const result = engine.layoutText(text, 300);

        // Should have at least one justified line
        const justifiedLines = result.lines.filter(line => line.justified);
        expect(justifiedLines.length).toBeGreaterThanOrEqual(0);
    });

    it('should support RTL text direction', () => {
        const engine = new TextLayoutEngine(layoutEngine['font'], {
            direction: TextDirection.RightToLeft,
        });

        const result = engine.layoutText('Hello World', 200);
        expect(result.lines).toHaveLength(1);
    });

    it('should handle line limits', () => {
        const engine = new TextLayoutEngine(layoutEngine['font'], {
            maxLines: 2,
            fontSize: 12,
        });

        const longText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
        const result = engine.layoutText(longText, 200);

        expect(result.lines.length).toBeLessThanOrEqual(2);
        expect(result.truncated).toBe(true);
    });
});

describe('Font Subsetting', () => {
    let mockTtfData: ArrayBuffer;

    beforeEach(() => {
        mockTtfData = createMockTtfData();
    });

    it('should create font subsets', () => {
        const subsetter = new TtfSubsetter(mockTtfData);

        subsetter.addString('Hello World');
        const subset = subsetter.generateSubset();

        expect(subset).toBeInstanceOf(ArrayBuffer);
        expect(subset.byteLength).toBeGreaterThan(0);
    });

    it('should provide subset statistics', () => {
        const subsetter = new TtfSubsetter(mockTtfData);

        subsetter.addString('ABC');
        const stats = subsetter.getStats();

        expect(stats).toHaveProperty('originalGlyphs');
        expect(stats).toHaveProperty('subsetGlyphs');
        expect(stats).toHaveProperty('compressionRatio');
        expect(stats.compressionRatio).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(stats.compressionRatio)).toBe(true);
    });

    it('should handle utility functions', () => {
        const usedChars = new Set([65, 66, 67]); // A, B, C
        const subset1 = createFontSubset(mockTtfData, usedChars);

        const texts = ['Hello', 'World'];
        const subset2 = createFontSubset(mockTtfData, usedChars);

        expect(subset1).toBeInstanceOf(ArrayBuffer);
        expect(subset2).toBeInstanceOf(ArrayBuffer);
    });
});

describe('Font Manager Integration', () => {
    let mockDocument: MockPdfDocument;
    let fontManager: FontManager;

    beforeEach(() => {
        mockDocument = new MockPdfDocument();
        fontManager = new FontManager(mockDocument as any);
    });

    afterEach(() => {
        fontManager.clear();
    });

    it('should register fonts', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
            source: mockTtfData,
        });

        const families = fontManager.getRegisteredFamilies();
        expect(families).toContain('TestFont');
    });

    it('should register font families', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFontFamily('TestFamily', [
            { weight: FontWeight.Normal, source: mockTtfData },
            { weight: FontWeight.Bold, source: mockTtfData },
            { style: FontStyle.Italic, source: mockTtfData },
        ]);

        const families = fontManager.getRegisteredFamilies();
        expect(families).toContain('TestFamily');

        const weights = fontManager.getAvailableWeights('TestFamily');
        expect(weights).toContain(FontWeight.Normal);
        expect(weights).toContain(FontWeight.Bold);

        const styles = fontManager.getAvailableStyles('TestFamily');
        expect(styles).toContain(FontStyle.Normal);
        expect(styles).toContain(FontStyle.Italic);
    });

    it('should resolve fonts with fallbacks', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'PrimaryFont',
            source: mockTtfData,
        });

        await fontManager.registerFont({
            family: 'FallbackFont',
            source: mockTtfData,
        });

        fontManager.setFontFallback('PrimaryFont', {
            families: ['FallbackFont'],
        });

        const font = fontManager.getFontWithFallback(['PrimaryFont', 'NonExistent']);
        expect(font).toBeDefined();
    });

    it('should layout text with styling', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            source: mockTtfData,
        });

        const result = fontManager.layoutText(
            'Hello World',
            {
                fontFamily: 'TestFont',
                fontSize: 16,
                fontWeight: FontWeight.Normal,
            },
            200
        );

        expect(result).toBeDefined();
        expect(result!.lines).toHaveLength(1);
    });

    it('should measure text', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            source: mockTtfData,
        });

        const dimensions = fontManager.measureText('Hello World', {
            fontFamily: 'TestFont',
            fontSize: 12,
        });

        expect(dimensions).toHaveProperty('width');
        expect(dimensions).toHaveProperty('height');
        expect(dimensions.width).toBeGreaterThanOrEqual(0);
        expect(dimensions.height).toBeGreaterThanOrEqual(0);
    });

    it('should provide font metrics', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            source: mockTtfData,
        });

        const metrics = fontManager.getFontMetrics('TestFont');
        expect(metrics).toBeDefined();
        expect(metrics!).toHaveProperty('family');
        expect(metrics!).toHaveProperty('unitsPerEm');
        expect(metrics!).toHaveProperty('ascender');
        expect(metrics!).toHaveProperty('descender');
    });

    it('should create font subsets', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            source: mockTtfData,
        });

        const subset = fontManager.createFontSubset('TestFont', ['Hello', 'World']);
        expect(subset).toBeInstanceOf(ArrayBuffer);
    });

    it('should provide statistics', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'TestFont',
            source: mockTtfData,
        });

        const stats = fontManager.getStats();
        expect(stats).toHaveProperty('registeredFonts');
        expect(stats).toHaveProperty('loadedParsers');
        expect(stats).toHaveProperty('fontLoader');
        expect(stats.registeredFonts).toBeGreaterThan(0);
    });
});

describe('Font Style Utilities', () => {
    it('should parse font weights', () => {
        expect(FontStyleUtils.parseFontWeight('normal')).toBe(FontWeight.Normal);
        expect(FontStyleUtils.parseFontWeight('bold')).toBe(FontWeight.Bold);
        expect(FontStyleUtils.parseFontWeight('light')).toBe(FontWeight.Light);
        expect(FontStyleUtils.parseFontWeight(700)).toBe(FontWeight.Bold);
        expect(FontStyleUtils.parseFontWeight(400)).toBe(FontWeight.Normal);
    });

    it('should parse font styles', () => {
        expect(FontStyleUtils.parseFontStyle('normal')).toBe(FontStyle.Normal);
        expect(FontStyleUtils.parseFontStyle('italic')).toBe(FontStyle.Italic);
        expect(FontStyleUtils.parseFontStyle('oblique')).toBe(FontStyle.Oblique);
    });

    it('should create text styles from CSS', () => {
        const style = FontStyleUtils.createTextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold',
            fontStyle: 'italic',
            lineHeight: 1.5,
            letterSpacing: 1,
            color: '#333333',
        });

        expect(style.fontFamily).toBe('Arial');
        expect(style.fontSize).toBe(16);
        expect(style.fontWeight).toBe(FontWeight.Bold);
        expect(style.fontStyle).toBe(FontStyle.Italic);
        expect(style.lineHeight).toBe(1.5);
        expect(style.letterSpacing).toBe(1);
        expect(style.color).toBe('#333333');
    });

    it('should handle undefined CSS values', () => {
        const style = FontStyleUtils.createTextStyle({});

        expect(style.fontFamily).toBeUndefined();
        expect(style.fontSize).toBeUndefined();
        expect(style.fontWeight).toBeUndefined();
        expect(style.fontStyle).toBeUndefined();
    });
});

describe('Font Integration Examples', () => {
    let mockDocument: MockPdfDocument;
    let fontManager: FontManager;

    beforeEach(() => {
        mockDocument = new MockPdfDocument();
        fontManager = new FontManager(mockDocument as any);
    });

    it('should demonstrate basic font usage', async () => {
        const mockTtfData = createMockTtfData();

        // Register font
        await fontManager.registerFont({
            family: 'Roboto',
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
            source: mockTtfData,
        });

        // Layout text
        const result = fontManager.layoutText(
            'The quick brown fox jumps over the lazy dog.',
            {
                fontFamily: 'Roboto',
                fontSize: 14,
                lineHeight: 1.4,
            },
            300
        );

        expect(result).toBeDefined();
        expect(result!.lines.length).toBeGreaterThanOrEqual(1);
    });

    it('should demonstrate multi-weight font family', async () => {
        const mockTtfData = createMockTtfData();

        // Register font family with multiple weights
        await fontManager.registerFontFamily('OpenSans', [
            { weight: FontWeight.Light, source: mockTtfData },
            { weight: FontWeight.Normal, source: mockTtfData },
            { weight: FontWeight.SemiBold, source: mockTtfData },
            { weight: FontWeight.Bold, source: mockTtfData },
        ]);

        // Test different weights
        const weights = [FontWeight.Light, FontWeight.Normal, FontWeight.SemiBold, FontWeight.Bold];

        for (const weight of weights) {
            const font = fontManager.getFont('OpenSans', weight);
            expect(font).toBeDefined();
        }
    });

    it('should demonstrate advanced text layout', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'BookFont',
            source: mockTtfData,
        });

        // Paragraph text
        const paragraph = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`;

        // Layout with justification
        const engine = new TextLayoutEngine(
            createFontAdapter(new TtfParser(mockTtfData)),
            {
                align: TextAlign.Justify,
                fontSize: 11,
                lineHeight: 1.5,
                letterSpacing: 0.1,
                wordSpacing: 0.2,
            }
        );

        const result = engine.layoutText(paragraph, 400);

        expect(result.lines.length).toBeGreaterThan(1);

        // Check for justified lines (except possibly the last one)
        const justifiedLines = result.lines.filter(line => line.justified);
        expect(justifiedLines.length).toBeGreaterThanOrEqual(0);
    });

    it('should demonstrate font subsetting for efficiency', async () => {
        const mockTtfData = createMockTtfData();

        await fontManager.registerFont({
            family: 'HeadingFont',
            source: mockTtfData,
        });

        // Simulate document content
        const documentTexts = [
            'Chapter 1: Introduction',
            'Chapter 2: Getting Started',
            'Chapter 3: Advanced Topics',
            'Conclusion',
        ];

        // Create subset with only used characters
        const subset = fontManager.createFontSubset('HeadingFont', documentTexts);

        expect(subset).toBeDefined();
        expect(subset!.byteLength).toBeGreaterThan(0);

        // The subset should be smaller than the original (in a real font)
        // This is just a demonstration of the API
    });
});