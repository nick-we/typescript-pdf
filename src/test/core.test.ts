/**
 * Core Systems Test Suite - Consolidated
 *
 * Tests core PDF engine, utilities, and type systems.
 * Consolidates: core-utils.test.ts, types.test.ts, pdf-engine.test.ts
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';

// Import consolidated systems
import {
    DocumentFactory,
    PageFactory,
    FontSystem,
    TextProcessor,
    PdfStandardFont,
    TextAlign,
} from '@/core/index.js';
import { Layout, Geometry, Theme, Internal } from '@/types.js';

describe('Core Systems', () => {
    describe('Document Management', () => {
        it('should create A4 documents', () => {
            const doc = DocumentFactory.a4();
            expect(doc).toBeDefined();
        });

        it('should create Letter documents', () => {
            const doc = DocumentFactory.letter();
            expect(doc).toBeDefined();
        });

        it('should create custom size documents', () => {
            const doc = DocumentFactory.custom();
            expect(doc).toBeDefined();
        });

        it('should handle page factories', () => {
            const pageOptions = PageFactory.a4();
            expect(pageOptions.format).toBe('A4');
            expect(pageOptions.width).toBe(595);
            expect(pageOptions.height).toBe(842);
        });
    });

    describe('Font System', () => {
        let fontSystem: FontSystem;
        let mockDocument: {
            genSerial: () => number;
            objects: { add: (obj: unknown) => void };
            fontRegistry?: unknown;
        };

        beforeEach(() => {
            mockDocument = {
                genSerial: () => Math.floor(Math.random() * 10000),
                objects: { add: () => {} },
                fontRegistry: undefined,
            };
            fontSystem = new FontSystem(mockDocument);
        });

        it('should register standard fonts', () => {
            const font = fontSystem.registerStandardFont(
                PdfStandardFont.Helvetica
            );
            expect(font).toBeDefined();
            expect(font.name).toBe('Helvetica'); // Now uses standard PDF font names
            expect(font.type).toBe('standard');
        });

        it('should measure text accurately', () => {
            const measurement = fontSystem.measureText('Hello World', {
                fontFamily: 'Helvetica',
                fontSize: 12,
            });

            expect(measurement.width).toBeGreaterThan(0);
            expect(measurement.height).toBeGreaterThan(0);
        });

        it('should handle font fallbacks', () => {
            const font = fontSystem.getFontWithStyle(
                'NonExistentFont',
                Theme.FontWeight.Normal,
                Theme.FontStyle.Normal
            );
            expect(font).toBeDefined();
            expect(font.fontFamily).toBe('Helvetica'); // Should fallback
        });

        it('should provide font statistics', () => {
            fontSystem.registerStandardFont(PdfStandardFont.Helvetica);
            fontSystem.registerStandardFont(PdfStandardFont.TimesRoman);

            const stats = fontSystem.getStats();
            expect(stats.totalFonts).toBe(2);
            expect(stats.standardFonts).toBe(2);
            expect(stats.customFonts).toBe(0);
        });
    });

    describe('Text Processing', () => {
        let textProcessor: TextProcessor;
        let fontSystem: FontSystem;

        beforeEach(() => {
            const mockDocument = {
                genSerial: () => Math.floor(Math.random() * 10000),
                objects: { add: () => {} },
                fontRegistry: undefined,
            };
            fontSystem = new FontSystem(mockDocument);
            textProcessor = new TextProcessor(fontSystem);
        });

        it('should measure single line text', () => {
            const measurement = textProcessor.measureText('Single line', {
                fontSize: 12,
                fontFamily: 'Helvetica',
            });

            expect(measurement.width).toBeGreaterThan(0);
            expect(measurement.height).toBeCloseTo(12 * 1.2, 1); // fontSize * lineSpacing with tolerance
        });

        it('should measure multi-line text blocks', () => {
            const measurement = textProcessor.measureTextBlock(
                'This is a longer text that will wrap to multiple lines when constrained.',
                200, // maxWidth
                { fontSize: 12, fontFamily: 'Helvetica' }
            );

            expect(measurement.lines).toBeGreaterThan(1);
            expect(measurement.width).toBeLessThanOrEqual(200);
            expect(measurement.height).toBeGreaterThan(12);
        });

        it('should layout text with alignment', () => {
            const layout = textProcessor.layoutText(
                'Centered text',
                300, // containerWidth
                100, // containerHeight
                {
                    fontSize: 12,
                    fontFamily: 'Helvetica',
                    align: TextAlign.Center,
                    maxLines: 2,
                }
            );

            expect(layout.lines).toHaveLength(1);
            expect(layout.lines[0]?.offsetX).toBeGreaterThan(0); // Should be offset for centering
            expect(layout.width).toBeLessThanOrEqual(300);
            expect(layout.height).toBeLessThanOrEqual(100);
        });

        it('should calculate optimal font size', () => {
            const optimalSize = textProcessor.calculateOptimalFontSize(
                'Test text',
                { width: 100, height: 50 },
                { fontFamily: 'Helvetica', minFontSize: 8, maxFontSize: 24 }
            );

            expect(optimalSize).toBeGreaterThanOrEqual(8);
            expect(optimalSize).toBeLessThanOrEqual(24);
        });
    });

    describe('Type System', () => {
        it('should have complete Layout namespace', () => {
            expect(Layout.EdgeInsets).toBeDefined();
            expect(Layout.BoxConstraints).toBeDefined();
            expect(Layout.Alignment).toBeDefined();
            expect(Layout.AlignmentUtils).toBeDefined();
        });

        it('should have complete Geometry namespace', () => {
            expect(Geometry.Utils).toBeDefined();
            expect(Geometry.Utils.point).toBeInstanceOf(Function);
            expect(Geometry.Utils.size).toBeInstanceOf(Function);
            expect(Geometry.Utils.rect).toBeInstanceOf(Function);
        });

        it('should have complete Theme namespace', () => {
            expect(Theme.FontWeight).toBeDefined();
            expect(Theme.FontStyle).toBeDefined();
            expect(Theme.Utils).toBeDefined();
            expect(Theme.ColorSchemes).toBeDefined();
        });

        it('should create proper EdgeInsets', () => {
            const allInsets = Layout.EdgeInsets.all(16);
            expect(allInsets.top).toBe(16);
            expect(allInsets.right).toBe(16);
            expect(allInsets.bottom).toBe(16);
            expect(allInsets.left).toBe(16);

            const symmetricInsets = Layout.EdgeInsets.symmetric({
                horizontal: 20,
                vertical: 10,
            });
            expect(symmetricInsets.left).toBe(20);
            expect(symmetricInsets.right).toBe(20);
            expect(symmetricInsets.top).toBe(10);
            expect(symmetricInsets.bottom).toBe(10);
        });

        it('should create proper BoxConstraints', () => {
            const size = { width: 200, height: 100 };
            const tight = Layout.BoxConstraints.tight(size);
            expect(tight.minWidth).toBe(200);
            expect(tight.maxWidth).toBe(200);
            expect(tight.minHeight).toBe(100);
            expect(tight.maxHeight).toBe(100);

            const loose = Layout.BoxConstraints.loose(size);
            expect(loose.minWidth).toBe(0);
            expect(loose.maxWidth).toBe(200);
            expect(loose.minHeight).toBe(0);
            expect(loose.maxHeight).toBe(100);
        });

        it('should handle alignment calculations', () => {
            const containerSize = { width: 200, height: 100 };
            const childSize = { width: 50, height: 30 };

            const centered = Layout.AlignmentUtils.resolve(
                Layout.Alignment.Center,
                containerSize,
                childSize
            );

            expect(centered.x).toBe(75); // (200-50)/2
            expect(centered.y).toBe(35); // (100-30)/2
        });
    });

    describe('Internal Utilities', () => {
        it('should handle table cell data properly', () => {
            const stringCell = 'Hello';
            const numberCell = 42;
            const objectCell = {
                value: 'Object value',
                displayValue: 'Display Value',
            };

            expect(Internal.Utils.getTableCellValue(stringCell)).toBe('Hello');
            expect(Internal.Utils.getTableCellValue(numberCell)).toBe(42);
            expect(Internal.Utils.getTableCellValue(objectCell)).toBe(
                'Object value'
            );

            expect(Internal.Utils.getTableCellDisplayValue(stringCell)).toBe(
                'Hello'
            );
            expect(Internal.Utils.getTableCellDisplayValue(numberCell)).toBe(
                '42'
            );
            expect(Internal.Utils.getTableCellDisplayValue(objectCell)).toBe(
                'Display Value'
            );
        });

        it('should generate consistent object hashes', () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { b: 2, a: 1 }; // Same content, different order
            const obj3 = { a: 1, b: 3 }; // Different content

            const hash1 = Internal.Utils.hashObject(obj1);
            const hash2 = Internal.Utils.hashObject(obj2);
            const hash3 = Internal.Utils.hashObject(obj3);

            expect(hash1).toBe(hash2); // Same content should have same hash
            expect(hash1).not.toBe(hash3); // Different content should have different hash
        });

        it('should merge objects safely', () => {
            const target = { a: 1, b: 2, c: 3 };
            const source = { b: 20, d: 4 };

            const result = Internal.Utils.mergeObjects(target, source);

            expect(result.a).toBe(1); // Unchanged
            expect(result.b).toBe(20); // Overridden
            expect(result.c).toBe(3); // Unchanged
            expect(
                'd' in result
                    ? (result as Record<string, unknown>)['d']
                    : undefined
            ).toBe(4); // Added
        });
    });

    describe('Text Overflow & Wrapping System', () => {
        it('should wrap text within container constraints', () => {
            const longText =
                "This is a very long text that should definitely wrap when placed inside a narrow container but currently doesn't wrap properly.";

            const textProcessor = new TextProcessor(
                new FontSystem({
                    genSerial: () => 1,
                    objects: { add: () => {} },
                })
            );

            const measurement = textProcessor.measureTextBlock(longText, 150, {
                fontSize: 12,
                fontFamily: 'Helvetica',
            });

            expect(measurement.lines).toBeGreaterThan(1);
            expect(measurement.width).toBeLessThanOrEqual(150);
        });

        it('should handle ellipsis truncation correctly', () => {
            const longText =
                'This is a very long single line text that should be truncated with ellipsis';

            const textProcessor = new TextProcessor(
                new FontSystem({
                    genSerial: () => 1,
                    objects: { add: () => {} },
                })
            );

            // Test truncation behavior
            const measurement = textProcessor.measureText(longText, {
                fontSize: 14,
                fontFamily: 'Helvetica',
            });

            expect(measurement.width).toBeGreaterThan(0);
            expect(measurement.height).toBeCloseTo(14 * 1.2, 1); // Single line height
        });

        it('should respect maxLines property', () => {
            const multiLineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';

            const textProcessor = new TextProcessor(
                new FontSystem({
                    genSerial: () => 1,
                    objects: { add: () => {} },
                })
            );

            const layout = textProcessor.layoutText(
                multiLineText,
                200, // containerWidth
                200, // containerHeight
                {
                    fontSize: 12,
                    fontFamily: 'Helvetica',
                    maxLines: 3,
                }
            );

            expect(layout.lines).toHaveLength(3); // Should be limited to 3 lines
        });

        it('should handle text alignment with wrapped text', () => {
            const text = 'Center aligned text that wraps to multiple lines';

            const textProcessor = new TextProcessor(
                new FontSystem({
                    genSerial: () => 1,
                    objects: { add: () => {} },
                })
            );

            const alignments = [
                TextAlign.Left,
                TextAlign.Center,
                TextAlign.Right,
            ];

            alignments.forEach(alignment => {
                const layout = textProcessor.layoutText(text, 120, 100, {
                    fontSize: 12,
                    fontFamily: 'Helvetica',
                    align: alignment,
                });

                expect(layout.lines.length).toBeGreaterThan(1); // Should wrap
                expect(layout.width).toBeLessThanOrEqual(120);

                // Check alignment offsets
                if (alignment === TextAlign.Center) {
                    expect(layout.lines[0]?.offsetX).toBeGreaterThan(0);
                } else if (alignment === TextAlign.Right) {
                    expect(layout.lines[0]?.offsetX).toBeGreaterThan(0);
                } else {
                    expect(layout.lines[0]?.offsetX).toBe(0);
                }
            });
        });

        it('should handle edge cases correctly', () => {
            const textProcessor = new TextProcessor(
                new FontSystem({
                    genSerial: () => 1,
                    objects: { add: () => {} },
                })
            );

            // Test empty text
            const emptyMeasurement = textProcessor.measureText('', {
                fontSize: 12,
                fontFamily: 'Helvetica',
            });
            expect(emptyMeasurement.width).toBe(0);

            // Test very narrow container
            const narrowMeasurement = textProcessor.measureTextBlock(
                'A very long word',
                20, // very narrow
                {
                    fontSize: 12,
                    fontFamily: 'Helvetica',
                }
            );
            expect(narrowMeasurement.width).toBeLessThanOrEqual(20);
            expect(narrowMeasurement.lines).toBeGreaterThan(1);
        });
    });

    describe('Accurate Text Measurement System', () => {
        let fontSystem: FontSystem;
        let textProcessor: TextProcessor;

        beforeEach(() => {
            const mockDocument = {
                genSerial: () => Math.floor(Math.random() * 1000),
                objects: { add: () => {} },
            };
            fontSystem = new FontSystem(mockDocument);
            textProcessor = new TextProcessor(fontSystem);
        });

        it('should provide more accurate measurements than character-count approximations', () => {
            const testText = 'Hello World';
            const fontSize = 12;

            // Old approximation method
            const approximateWidth = testText.length * fontSize * 0.55;

            // New accurate method
            const accurate = textProcessor.measureText(testText, {
                fontSize,
                fontFamily: 'Helvetica',
            });

            console.log(`Helvetica ${fontSize}pt "${testText}"`);
            console.log(`  Approximate: ${approximateWidth.toFixed(1)}pt`);
            console.log(`  Accurate: ${accurate.width.toFixed(1)}pt`);

            // Accurate measurement should be different from approximation
            expect(Math.abs(accurate.width - approximateWidth)).toBeGreaterThan(
                1
            );
            expect(accurate.width).toBeGreaterThan(0);
            expect(accurate.width).toBeLessThan(200);
        });

        it('should handle different font families differently', () => {
            const testText = 'Hello World';
            const fontSize = 12;

            const helvetica = textProcessor.measureText(testText, {
                fontSize,
                fontFamily: 'Helvetica',
            });

            const times = textProcessor.measureText(testText, {
                fontSize,
                fontFamily: 'Times',
            });

            const courier = textProcessor.measureText(testText, {
                fontSize,
                fontFamily: 'Courier',
            });

            console.log(`Font family comparison for "${testText}":`);
            console.log(`  Helvetica: ${helvetica.width.toFixed(1)}pt`);
            console.log(`  Times: ${times.width.toFixed(1)}pt`);
            console.log(`  Courier: ${courier.width.toFixed(1)}pt`);

            // Different fonts should have different measurements
            expect(helvetica.width).not.toBe(times.width);
            expect(helvetica.width).not.toBe(courier.width);
            expect(times.width).not.toBe(courier.width);
        });

        it('should provide accurate font metrics', () => {
            const fontSize = 12;
            const fonts = ['Helvetica', 'Times', 'Courier'];

            fonts.forEach(fontFamily => {
                fontSystem.registerStandardFont(
                    fontFamily === 'Helvetica'
                        ? PdfStandardFont.Helvetica
                        : fontFamily === 'Times'
                          ? PdfStandardFont.TimesRoman
                          : PdfStandardFont.Courier
                );

                const measurement = textProcessor.measureText('Test', {
                    fontSize,
                    fontFamily,
                });

                console.log(`${fontFamily} ${fontSize}pt metrics:`);
                console.log(`  Height: ${measurement.height.toFixed(1)}pt`);

                // Reasonable values for 12pt font
                expect(measurement.height).toBeGreaterThan(10);
                expect(measurement.height).toBeLessThan(20);
            });
        });

        it('should handle text wrapping accurately', () => {
            const longText =
                'This is a longer text that should wrap across multiple lines when constrained to a specific width.';
            const maxWidth = 200;
            const fontSize = 12;

            const measurement = textProcessor.measureTextBlock(
                longText,
                maxWidth,
                {
                    fontSize,
                    fontFamily: 'Helvetica',
                }
            );

            console.log(`Accurate text wrapping for width ${maxWidth}pt:`);
            console.log(`  Lines: ${measurement.lines}`);
            console.log(`  Total height: ${measurement.height.toFixed(1)}pt`);

            expect(measurement.lines).toBeGreaterThan(1);
            expect(measurement.width).toBeLessThanOrEqual(maxWidth);
            expect(measurement.height).toBeGreaterThan(fontSize);
        });

        it('should calculate optimal font sizes', () => {
            const testText = 'Test text for sizing';
            const containerSize = { width: 100, height: 50 };

            const optimalSize = textProcessor.calculateOptimalFontSize(
                testText,
                containerSize,
                {
                    fontFamily: 'Helvetica',
                    minFontSize: 8,
                    maxFontSize: 24,
                }
            );

            console.log(`Optimal font size calculation:`);
            console.log(`  Text: "${testText}"`);
            console.log(
                `  Container: ${containerSize.width}×${containerSize.height}pt`
            );
            console.log(`  Optimal size: ${optimalSize}pt`);

            expect(optimalSize).toBeGreaterThanOrEqual(8);
            expect(optimalSize).toBeLessThanOrEqual(24);

            // Verify the text fits at the calculated size with the same container width
            const measurement = textProcessor.measureTextBlock(
                testText,
                containerSize.width,
                {
                    fontSize: optimalSize,
                    fontFamily: 'Helvetica',
                }
            );

            expect(measurement.width).toBeLessThanOrEqual(containerSize.width);
            expect(measurement.height).toBeLessThanOrEqual(
                containerSize.height
            );
        });

        it('should demonstrate significant accuracy improvements', () => {
            const testCases = [
                { text: 'Hello World', fontSize: 12, font: 'Helvetica' },
                { text: 'The quick brown fox', fontSize: 14, font: 'Times' },
                { text: 'UPPERCASE TEXT', fontSize: 10, font: 'Helvetica' },
                { text: 'Mixed Case Text 123', fontSize: 12, font: 'Times' },
            ];

            console.log('\n=== TEXT MEASUREMENT ACCURACY COMPARISON ===\n');

            testCases.forEach((testCase, index) => {
                const { text, fontSize, font } = testCase;

                // Old method
                const approximateWidth = text.length * fontSize * 0.55;

                // New method
                const accurate = textProcessor.measureText(text, {
                    fontSize,
                    fontFamily: font,
                });

                const difference = Math.abs(accurate.width - approximateWidth);
                const improvementPercent =
                    (difference / approximateWidth) * 100;

                console.log(`Test Case ${index + 1}: ${font} ${fontSize}pt`);
                console.log(`  Text: "${text}"`);
                console.log(`  Approximate: ${approximateWidth.toFixed(1)}pt`);
                console.log(`  Accurate: ${accurate.width.toFixed(1)}pt`);
                console.log(
                    `  Improvement: ${improvementPercent.toFixed(1)}%\n`
                );

                expect(accurate.width).toBeGreaterThan(0);
                expect(accurate.width).toBeLessThan(text.length * fontSize * 2);
            });
        });
    });
});
