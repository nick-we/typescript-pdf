/**
 * Font Features Demo
 * 
 * Simple demonstration of typography and font features in typescript-pdf
 * 
 * @packageDocumentation
 */

import { PdfDocument } from '../src/core/pdf/document.js';
import { FontManager, FontWeight, FontStyle, FontStyleUtils } from '../src/core/fonts.js';
import { TextLayoutEngine, TextAlign, createFontAdapter } from '../src/core/text-layout.js';
import { TtfParser } from '../src/core/pdf/ttf-parser.js';
import { TtfSubsetter } from '../src/core/pdf/ttf-subsetter.js';

// Create minimal TTF font data for testing
function createTestFont(): ArrayBuffer {
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);

    // TTF header
    view.setUint32(0, 0x00010000); // sfnt version
    view.setUint16(4, 6); // numTables
    view.setUint16(6, 96); // searchRange
    view.setUint16(8, 3); // entrySelector
    view.setUint16(10, 0); // rangeShift

    // Basic table directory
    const tables = ['head', 'hhea', 'maxp', 'cmap', 'name', 'hmtx'];
    let offset = 12;
    let dataOffset = 12 + tables.length * 16;

    for (let i = 0; i < tables.length; i++) {
        const tag = tables[i]!;
        // Write table tag
        for (let j = 0; j < 4; j++) {
            view.setUint8(offset + j, tag.charCodeAt(j) || 0);
        }
        view.setUint32(offset + 4, 0); // checksum
        view.setUint32(offset + 8, dataOffset); // offset
        view.setUint32(offset + 12, 32); // length

        offset += 16;
        dataOffset += 32;
    }

    return buffer;
}

/**
 * Demo 1: Basic Font Operations
 */
export function demonstrateFontParsing() {
    console.log('=== Font Parsing Demo ===');

    const fontData = createTestFont();
    const parser = new TtfParser(fontData);

    console.log(`Font name: ${parser.fontName}`);
    console.log(`Units per em: ${parser.unitsPerEm}`);
    console.log(`Ascent: ${parser.ascent}`);
    console.log(`Descent: ${parser.descent}`);
    console.log(`Number of glyphs: ${parser.numGlyphs}`);

    // Test character support
    const testChar = 65; // 'A'
    console.log(`Character 'A' supported: ${parser.isCharSupported(testChar)}`);
    console.log(`Glyph index for 'A': ${parser.getGlyphIndex(testChar)}`);

    // Measure text
    const testText = 'Hello World';
    const width = parser.measureText(testText);
    console.log(`Text "${testText}" width: ${width} font units`);
}

/**
 * Demo 2: Font Manager Usage
 */
export async function demonstrateFontManager() {
    console.log('\n=== Font Manager Demo ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    try {
        // Register a test font
        const fontData = createTestFont();
        await fontManager.registerFont({
            family: 'TestFont',
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
            source: fontData,
        });

        console.log('Registered fonts:', fontManager.getRegisteredFamilies());

        // Measure text
        const text = 'Typography Demo';
        const dimensions = fontManager.measureText(text, {
            fontFamily: 'TestFont',
            fontSize: 12,
        });

        console.log(`Text dimensions: ${dimensions.width.toFixed(2)} x ${dimensions.height.toFixed(2)} points`);

        // Get font metrics
        const metrics = fontManager.getFontMetrics('TestFont');
        if (metrics) {
            console.log(`Font metrics:`);
            console.log(`  Units per em: ${metrics.unitsPerEm}`);
            console.log(`  Ascender: ${metrics.ascender}`);
            console.log(`  Descender: ${metrics.descender}`);
            console.log(`  Glyph count: ${metrics.glyphCount}`);
        }

        // Layout text
        const layout = fontManager.layoutText(text, {
            fontFamily: 'TestFont',
            fontSize: 14,
            lineHeight: 1.4,
        }, 200);

        if (layout) {
            console.log(`Layout result: ${layout.lines.length} lines, ${layout.width.toFixed(1)} x ${layout.height.toFixed(1)} points`);
        }

    } catch (error) {
        console.error('Font manager demo failed:', error);
    }
}

/**
 * Demo 3: Text Layout Engine
 */
export function demonstrateTextLayout() {
    console.log('\n=== Text Layout Demo ===');

    const fontData = createTestFont();
    const parser = new TtfParser(fontData);
    const fontAdapter = createFontAdapter(parser);

    // Test different alignments
    const alignments = [
        { align: TextAlign.Left, name: 'Left' },
        { align: TextAlign.Center, name: 'Center' },
        { align: TextAlign.Right, name: 'Right' },
        { align: TextAlign.Justify, name: 'Justify' },
    ];

    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

    for (const { align, name } of alignments) {
        const engine = new TextLayoutEngine(fontAdapter, {
            align,
            fontSize: 12,
            lineHeight: 1.3,
        });

        const result = engine.layoutText(text, 300);
        console.log(`${name} alignment: ${result.lines.length} lines, ${result.width.toFixed(1)} x ${result.height.toFixed(1)} points`);
    }
}

/**
 * Demo 4: Font Subsetting
 */
export function demonstrateFontSubsetting() {
    console.log('\n=== Font Subsetting Demo ===');

    const fontData = createTestFont();
    const subsetter = new TtfSubsetter(fontData);

    // Add some text to create subset
    const texts = ['Hello', 'World', 'Font Subsetting'];
    for (const text of texts) {
        subsetter.addString(text);
    }

    try {
        const subset = subsetter.generateSubset();
        const stats = subsetter.getStats();

        console.log(`Original font size: ${fontData.byteLength} bytes`);
        console.log(`Subset font size: ${subset.byteLength} bytes`);
        console.log(`Original glyphs: ${stats.originalGlyphs}`);
        console.log(`Subset glyphs: ${stats.subsetGlyphs}`);
        console.log(`Compression ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('Font subsetting failed:', error);
    }
}

/**
 * Demo 5: Font Style Utilities
 */
export function demonstrateFontStyleUtils() {
    console.log('\n=== Font Style Utils Demo ===');

    // Test weight parsing
    console.log('Font weight parsing:');
    console.log(`  'bold' -> ${FontStyleUtils.parseFontWeight('bold')}`);
    console.log(`  700 -> ${FontStyleUtils.parseFontWeight(700)}`);
    console.log(`  'light' -> ${FontStyleUtils.parseFontWeight('light')}`);

    // Test style parsing
    console.log('Font style parsing:');
    console.log(`  'italic' -> ${FontStyleUtils.parseFontStyle('italic')}`);
    console.log(`  'normal' -> ${FontStyleUtils.parseFontStyle('normal')}`);

    // Create text style from CSS-like properties
    const textStyle = FontStyleUtils.createTextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        lineHeight: 1.5,
        letterSpacing: 0.5,
        color: '#333333',
    });

    console.log('Created text style:', textStyle);
}

/**
 * Demo 6: Performance Comparison
 */
export async function demonstratePerformance() {
    console.log('\n=== Performance Demo ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    try {
        // Register test font
        await fontManager.registerFont({
            family: 'PerfTest',
            source: createTestFont(),
        });

        // Performance test data
        const testTexts = [
            'Short text',
            'Medium length text for performance testing',
            'Very long text that spans multiple lines and tests the performance of text measurement and layout algorithms in various scenarios',
        ];

        console.log('Text measurement performance:');
        for (const text of testTexts) {
            const iterations = 1000;
            const start = performance.now();

            for (let i = 0; i < iterations; i++) {
                fontManager.measureText(text, {
                    fontFamily: 'PerfTest',
                    fontSize: 12,
                });
            }

            const end = performance.now();
            const avgTime = (end - start) / iterations;
            console.log(`  "${text.substring(0, 20)}..." - ${avgTime.toFixed(3)}ms avg (${iterations} iterations)`);
        }

        // Get statistics
        const stats = fontManager.getStats();
        console.log('\nFont Manager Statistics:');
        console.log(`  Registered fonts: ${stats.registeredFonts}`);
        console.log(`  Loaded parsers: ${stats.loadedParsers}`);
        console.log(`  Cache size: ${stats.fontLoader.cacheSize} bytes`);
        console.log(`  Cache hit rate: ${(stats.fontLoader.hitRate * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('Performance demo failed:', error);
    }
}

/**
 * Run all font feature demonstrations
 */
export async function runAllFontDemos() {
    console.log('🎨 Font Features Demonstration');
    console.log('==============================\n');

    try {
        demonstrateFontParsing();
        await demonstrateFontManager();
        demonstrateTextLayout();
        demonstrateFontSubsetting();
        demonstrateFontStyleUtils();
        await demonstratePerformance();

        console.log('\n✅ All font feature demos completed successfully!');
        console.log('\nDemonstrated Features:');
        console.log('• TTF font parsing and metadata extraction');
        console.log('• Font registration and management');
        console.log('• Text measurement and layout');
        console.log('• Font subsetting for optimization');
        console.log('• CSS-style font property utilities');
        console.log('• Performance monitoring and statistics');

    } catch (error) {
        console.error('❌ Font demos failed:', error);
    }
}

// Auto-run demos in Node.js environment
if (typeof window === 'undefined') {
    runAllFontDemos().catch(console.error);
}