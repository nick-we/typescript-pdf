/**
 * Typography Showcase Example
 * 
 * Demonstrates advanced typography and font features including:
 * - Custom font loading and registration
 * - Multiple font weights and styles
 * - Advanced text layout and alignment
 * - Font subsetting for optimization
 * - Real-world typography scenarios
 * 
 * @packageDocumentation
 */

import { PdfDocument } from '../src/core/pdf/document.js';
import { FontManager, FontWeight, FontStyle } from '../src/core/fonts.js';
import { TextLayoutEngine, TextAlign, createFontAdapter } from '../src/core/text-layout.js';
import { TtfParser } from '../src/core/pdf/ttf-parser.js';
import { createFontSubset, createFontSubsetFromText } from '../src/core/pdf/ttf-subsetter.js';

// Mock font data for demonstration (replace with real font files)
function loadMockFont(name: string): ArrayBuffer {
    // In a real scenario, you would load actual TTF/OTF font files from URLs or user uploads
    // Example: const response = await fetch(`/fonts/${name}.ttf`);
    //          return response.arrayBuffer();

    // For demonstration, create minimal TTF structure
    const buffer = new ArrayBuffer(2048);
    const view = new DataView(buffer);

    // TTF header
    view.setUint32(0, 0x00010000); // sfnt version
    view.setUint16(4, 8); // numTables
    view.setUint16(6, 128); // searchRange
    view.setUint16(8, 3); // entrySelector
    view.setUint16(10, 0); // rangeShift

    // Table directory
    const tables = ['head', 'hhea', 'maxp', 'cmap', 'name', 'post', 'hmtx', 'loca'];
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
        view.setUint32(offset + 12, 64); // length

        offset += 16;
        dataOffset += 64;
    }

    return buffer;
}

/**
 * Example 1: Basic Font Loading and Registration
 */
async function basicFontUsage() {
    console.log('\n=== Basic Font Usage ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    // Load and register a custom font
    const robotoFont = loadMockFont('Roboto-Regular');

    await fontManager.registerFont({
        family: 'Roboto',
        weight: FontWeight.Normal,
        style: FontStyle.Normal,
        source: robotoFont,
    });

    console.log('Registered fonts:', fontManager.getRegisteredFamilies());

    // Measure text with custom font
    const text = 'Hello, Custom Typography!';
    const dimensions = fontManager.measureText(text, {
        fontFamily: 'Roboto',
        fontSize: 16,
    });

    console.log(`Text "${text}" dimensions:`, dimensions);

    // Layout text with styling
    const layout = fontManager.layoutText(text, {
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: FontWeight.Normal,
        lineHeight: 1.5,
    }, 300);

    console.log('Layout result:', {
        lines: layout?.lines.length || 0,
        width: layout?.width || 0,
        height: layout?.height || 0,
    });
}

/**
 * Example 2: Multi-Weight Font Family
 */
async function fontFamilyUsage() {
    console.log('\n=== Font Family Usage ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    // Register a complete font family
    await fontManager.registerFontFamily('OpenSans', [
        { weight: FontWeight.Light, source: loadMockFont('OpenSans-Light') },
        { weight: FontWeight.Normal, source: loadMockFont('OpenSans-Regular') },
        { weight: FontWeight.SemiBold, source: loadMockFont('OpenSans-SemiBold') },
        { weight: FontWeight.Bold, source: loadMockFont('OpenSans-Bold') },
        { style: FontStyle.Italic, source: loadMockFont('OpenSans-Italic') },
    ]);

    console.log('Available weights for OpenSans:', fontManager.getAvailableWeights('OpenSans'));
    console.log('Available styles for OpenSans:', fontManager.getAvailableStyles('OpenSans'));

    // Test different weights
    const testText = 'Typography Test';
    const weights = [FontWeight.Light, FontWeight.Normal, FontWeight.SemiBold, FontWeight.Bold];

    for (const weight of weights) {
        const font = fontManager.getFont('OpenSans', weight);
        if (font) {
            const width = font.measureText(testText);
            console.log(`Weight ${weight}: ${width} units wide`);
        }
    }
}

/**
 * Example 3: Advanced Text Layout
 */
async function advancedTextLayout() {
    console.log('\n=== Advanced Text Layout ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    await fontManager.registerFont({
        family: 'BookFont',
        source: loadMockFont('Book-Regular'),
    });

    const paragraph = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse 
    cillum dolore eu fugiat nulla pariatur.
    `.trim();

    // Test different alignments
    const alignments = [
        { align: TextAlign.Left, name: 'Left' },
        { align: TextAlign.Center, name: 'Center' },
        { align: TextAlign.Right, name: 'Right' },
        { align: TextAlign.Justify, name: 'Justify' },
    ];

    const fontData = loadMockFont('Book-Regular');
    const parser = new TtfParser(fontData);
    const fontAdapter = createFontAdapter(parser);

    for (const { align, name } of alignments) {
        const engine = new TextLayoutEngine(fontAdapter, {
            align,
            fontSize: 12,
            lineHeight: 1.4,
            letterSpacing: 0.1,
        });

        const result = engine.layoutText(paragraph, 400);

        console.log(`${name} alignment:`);
        console.log(`  Lines: ${result.lines.length}`);
        console.log(`  Width: ${result.width.toFixed(1)}`);
        console.log(`  Height: ${result.height.toFixed(1)}`);
        console.log(`  Justified lines: ${result.lines.filter(l => l.justified).length}`);
    }
}

/**
 * Example 4: Font Fallback System
 */
async function fontFallbackDemo() {
    console.log('\n=== Font Fallback Demo ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    // Register primary and fallback fonts
    await fontManager.registerFont({
        family: 'CustomFont',
        source: loadMockFont('Custom-Regular'),
    });

    await fontManager.registerFont({
        family: 'SystemFont',
        source: loadMockFont('System-Regular'),
    });

    // Set up fallback chain
    fontManager.setFontFallback('CustomFont', {
        families: ['SystemFont', 'Arial', 'sans-serif'],
    });

    // Test fallback resolution
    const fallbackTest = fontManager.getFontWithFallback(['NonExistentFont', 'CustomFont']);
    console.log('Fallback resolution successful:', fallbackTest !== null);

    // Measure text with fallback
    const mixedText = 'Mixed script: Hello 世界 مرحبا';
    const dimensions = fontManager.measureText(mixedText, {
        fontFamily: 'CustomFont',
        fontSize: 14,
    });

    console.log(`Mixed script text dimensions:`, dimensions);
}

/**
 * Example 5: Font Subsetting for Optimization
 */
async function fontSubsettingDemo() {
    console.log('\n=== Font Subsetting Demo ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    await fontManager.registerFont({
        family: 'HeadingFont',
        source: loadMockFont('Heading-Bold'),
    });

    // Document content that uses only specific characters
    const documentTexts = [
        'Chapter 1: Introduction',
        'Chapter 2: Getting Started',
        'Chapter 3: Advanced Topics',
        'Chapter 4: Best Practices',
        'Conclusion and Summary',
    ];

    // Create font subset containing only used characters
    const subset = fontManager.createFontSubset('HeadingFont', documentTexts);

    if (subset) {
        console.log(`Original font size: ${loadMockFont('Heading-Bold').byteLength} bytes`);
        console.log(`Subset font size: ${subset.byteLength} bytes`);
        console.log(`Compression ratio: ${(subset.byteLength / loadMockFont('Heading-Bold').byteLength * 100).toFixed(1)}%`);
    }

    // Alternative: Create subset from character set
    const fontData = loadMockFont('Heading-Bold');
    const usedChars = new Set<number>();

    // Collect all used characters
    for (const text of documentTexts) {
        for (let i = 0; i < text.length; i++) {
            usedChars.add(text.charCodeAt(i));
        }
    }

    const manualSubset = createFontSubset(fontData, usedChars);
    console.log(`Manual subset size: ${manualSubset.byteLength} bytes`);

    // Utility function approach
    const utilitySubset = createFontSubsetFromText(fontData, documentTexts);
    console.log(`Utility subset size: ${utilitySubset.byteLength} bytes`);
}

/**
 * Example 6: Typography Statistics and Performance
 */
async function typographyStats() {
    console.log('\n=== Typography Statistics ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    // Register multiple fonts
    const fonts = ['Arial', 'Times', 'Helvetica', 'Georgia'];
    for (const fontName of fonts) {
        await fontManager.registerFont({
            family: fontName,
            source: loadMockFont(`${fontName}-Regular`),
        });
    }

    // Get font manager statistics
    const stats = fontManager.getStats();
    console.log('Font Manager Stats:', {
        registeredFonts: stats.registeredFonts,
        loadedParsers: stats.loadedParsers,
        memoryUsage: `${(stats.fontLoader.cacheSize / 1024).toFixed(1)} KB`,
        cacheHitRate: `${(stats.fontLoader.hitRate * 100).toFixed(1)}%`,
    });

    // Performance test: measure multiple texts
    const testTexts = [
        'Quick performance test',
        'The quick brown fox jumps over the lazy dog',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    ];

    console.log('\nPerformance measurements:');
    for (const text of testTexts) {
        const start = performance.now();

        for (const fontName of fonts) {
            fontManager.measureText(text, {
                fontFamily: fontName,
                fontSize: 12,
            });
        }

        const end = performance.now();
        console.log(`  "${text.substring(0, 20)}..." - ${(end - start).toFixed(2)}ms for ${fonts.length} fonts`);
    }
}

/**
 * Example 7: Real-World Document Typography
 */
async function documentTypographyExample() {
    console.log('\n=== Document Typography Example ===');

    const doc = new PdfDocument();
    const fontManager = new FontManager(doc);

    // Register fonts for different document elements
    await fontManager.registerFontFamily('DocumentSans', [
        { weight: FontWeight.Normal, source: loadMockFont('DocSans-Regular') },
        { weight: FontWeight.Bold, source: loadMockFont('DocSans-Bold') },
        { style: FontStyle.Italic, source: loadMockFont('DocSans-Italic') },
    ]);

    await fontManager.registerFont({
        family: 'DocumentSerif',
        source: loadMockFont('DocSerif-Regular'),
    });

    await fontManager.registerFont({
        family: 'CodeFont',
        source: loadMockFont('Code-Mono'),
    });

    // Document structure simulation
    const documentStructure = [
        {
            type: 'title',
            text: 'Advanced Typography in PDF Generation',
            style: { fontFamily: 'DocumentSans', fontSize: 24, fontWeight: FontWeight.Bold },
        },
        {
            type: 'subtitle',
            text: 'A Comprehensive Guide to Font Management',
            style: { fontFamily: 'DocumentSans', fontSize: 16, fontStyle: FontStyle.Italic },
        },
        {
            type: 'heading',
            text: '1. Introduction',
            style: { fontFamily: 'DocumentSans', fontSize: 18, fontWeight: FontWeight.Bold },
        },
        {
            type: 'paragraph',
            text: 'Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.',
            style: { fontFamily: 'DocumentSerif', fontSize: 12, lineHeight: 1.6 },
        },
        {
            type: 'code',
            text: 'const fontManager = new FontManager(document);',
            style: { fontFamily: 'CodeFont', fontSize: 10 },
        },
    ];

    // Layout each document element
    console.log('Document layout:');
    let totalHeight = 0;

    for (const element of documentStructure) {
        const layout = fontManager.layoutText(element.text, element.style, 500);

        if (layout) {
            console.log(`  ${element.type}: ${layout.lines.length} lines, ${layout.height.toFixed(1)} points high`);
            totalHeight += layout.height + 12; // Add spacing
        }
    }

    console.log(`Total document height: ${totalHeight.toFixed(1)} points`);

    // Font usage analysis
    const usedFamilies = new Set(documentStructure.map(el => el.style.fontFamily));
    console.log(`Used font families: ${Array.from(usedFamilies).join(', ')}`);
}

/**
 * Main demo function
 */
async function runTypographyShowcase() {
    console.log('🎨 Typography & Fonts Showcase');
    console.log('=====================================');

    try {
        await basicFontUsage();
        await fontFamilyUsage();
        await advancedTextLayout();
        await fontFallbackDemo();
        await fontSubsettingDemo();
        await typographyStats();
        await documentTypographyExample();

        console.log('\n✅ Typography showcase completed successfully!');
        console.log('\nKey Features Demonstrated:');
        console.log('• Custom font loading and registration');
        console.log('• Multi-weight font families');
        console.log('• Advanced text layout and alignment');
        console.log('• Font fallback systems');
        console.log('• Font subsetting for optimization');
        console.log('• Performance monitoring');
        console.log('• Real-world document typography');

    } catch (error) {
        console.error('❌ Typography showcase failed:', error);
        throw error;
    }
}

// Run the showcase if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runTypographyShowcase().catch(console.error);
}

export {
    basicFontUsage,
    fontFamilyUsage,
    advancedTextLayout,
    fontFallbackDemo,
    fontSubsettingDemo,
    typographyStats,
    documentTypographyExample,
    runTypographyShowcase,
};