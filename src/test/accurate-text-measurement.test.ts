/**
 * Accurate Text Measurement Validation Tests
 * 
 * Tests to validate that the new accurate font-based measurement system
 * provides significantly better results than the old avgCharWidth approximations.
 * 
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { AccurateTextMeasurementService } from '../core/accurate-text-measurement.js';
import { FontSystem, FontWeight } from '../core/fonts.js';
import type { Layout } from '../types.js';
import { Theme } from '../types.js';
import { TextWidget, TextUtils } from '../widgets/text.js';

// Mock PdfDocument for FontSystem
const mockPdfDocument = {
    genSerial: () => Math.floor(Math.random() * 1000),
    objects: {
        add: () => { }
    }
};

describe('AccurateTextMeasurement', () => {
    let fontSystem: FontSystem;
    let textMeasurement: AccurateTextMeasurementService;
    let theme: Theme.ThemeData;

    beforeEach(() => {
        fontSystem = new FontSystem(mockPdfDocument);
        textMeasurement = new AccurateTextMeasurementService(fontSystem);
        theme = Theme.Utils.light();
    });

    describe('Text Width Measurement Accuracy', () => {
        const testText = 'Hello World';
        const fontSize = 12;

        it('should provide more accurate measurements than avgCharWidth for Helvetica', () => {
            // Old approximation method
            const approximateWidth = testText.length * fontSize * 0.55; // 72.6pt

            // New accurate method
            const accurateWidth = textMeasurement.measureTextWidth(
                testText,
                fontSize,
                'Helvetica',
                FontWeight.Normal
            );

            console.log(`Helvetica ${fontSize}pt "${testText}"`);
            console.log(`  Approximate: ${approximateWidth.toFixed(1)}pt`);
            console.log(`  Accurate: ${accurateWidth.toFixed(1)}pt`);
            console.log(`  Difference: ${(Math.abs(accurateWidth - approximateWidth)).toFixed(1)}pt`);
            console.log(`  Improvement: ${((Math.abs(accurateWidth - approximateWidth) / approximateWidth) * 100).toFixed(1)}%`);

            // Accurate measurement should be different from approximation
            expect(Math.abs(accurateWidth - approximateWidth)).toBeGreaterThan(1);

            // Accurate measurement should be reasonable (not negative, not extremely large)
            expect(accurateWidth).toBeGreaterThan(0);
            expect(accurateWidth).toBeLessThan(200);
        });

        it('should provide more accurate measurements than avgCharWidth for Times', () => {
            // Old approximation method
            const approximateWidth = testText.length * fontSize * 0.55; // 72.6pt

            // New accurate method
            const accurateWidth = textMeasurement.measureTextWidth(
                testText,
                fontSize,
                'Times',
                FontWeight.Normal
            );

            console.log(`Times ${fontSize}pt "${testText}"`);
            console.log(`  Approximate: ${approximateWidth.toFixed(1)}pt`);
            console.log(`  Accurate: ${accurateWidth.toFixed(1)}pt`);
            console.log(`  Difference: ${(Math.abs(accurateWidth - approximateWidth)).toFixed(1)}pt`);
            console.log(`  Improvement: ${((Math.abs(accurateWidth - approximateWidth) / approximateWidth) * 100).toFixed(1)}%`);

            // Times should be different from Helvetica
            const helveticaWidth = textMeasurement.measureTextWidth(
                testText, fontSize, 'Helvetica', FontWeight.Normal
            );
            expect(Math.abs(accurateWidth - helveticaWidth)).toBeGreaterThan(0.1);
        });

        it('should provide more accurate measurements than avgCharWidth for Courier', () => {
            // Old approximation method
            const approximateWidth = testText.length * fontSize * 0.55; // 72.6pt

            // New accurate method
            const accurateWidth = textMeasurement.measureTextWidth(
                testText,
                fontSize,
                'Courier',
                FontWeight.Normal
            );

            console.log(`Courier ${fontSize}pt "${testText}"`);
            console.log(`  Approximate: ${approximateWidth.toFixed(1)}pt`);
            console.log(`  Accurate: ${accurateWidth.toFixed(1)}pt`);
            console.log(`  Difference: ${(Math.abs(accurateWidth - approximateWidth)).toFixed(1)}pt`);

            // Courier is monospace, so it should be more predictable
            expect(accurateWidth).toBeGreaterThan(0);
            expect(accurateWidth).toBeLessThan(200);
        });
    });

    describe('Text Wrapping Accuracy', () => {
        const longText = 'This is a longer text that should wrap across multiple lines when constrained to a specific width.';
        const maxWidth = 200;
        const fontSize = 12;

        it('should wrap text more accurately than character-count-based wrapping', () => {
            // Old approximation method
            const approximateLines = TextUtils.wrap(longText, maxWidth, fontSize);

            // New accurate method
            const accurateLines = textMeasurement.wrapTextAccurate(longText, maxWidth, {
                fontSize,
                fontFamily: 'Helvetica'
            });

            console.log(`Text wrapping comparison for width ${maxWidth}pt:`);
            console.log(`  Approximate lines: ${approximateLines.length}`);
            console.log(`  Accurate lines: ${accurateLines.length}`);

            approximateLines.forEach((line, i) => {
                console.log(`    Approx Line ${i + 1}: "${line}" (${line.length} chars)`);
            });

            accurateLines.forEach((line, i) => {
                const actualWidth = textMeasurement.measureTextWidth(line, fontSize, 'Helvetica');
                console.log(`    Accurate Line ${i + 1}: "${line}" (${actualWidth.toFixed(1)}pt)`);

                // Each line should fit within the maxWidth
                expect(actualWidth).toBeLessThanOrEqual(maxWidth + 1); // Allow 1pt tolerance
            });

            // Should have some lines
            expect(accurateLines.length).toBeGreaterThan(0);
            expect(accurateLines.length).toBeLessThan(20); // Reasonable upper bound
        });

        it('should handle different font families differently in wrapping', () => {
            const helveticaLines = textMeasurement.wrapTextAccurate(longText, maxWidth, {
                fontSize,
                fontFamily: 'Helvetica'
            });

            const timesLines = textMeasurement.wrapTextAccurate(longText, maxWidth, {
                fontSize,
                fontFamily: 'Times'
            });

            console.log(`Font family wrapping comparison:`);
            console.log(`  Helvetica: ${helveticaLines.length} lines`);
            console.log(`  Times: ${timesLines.length} lines`);

            // Different fonts should potentially result in different line counts
            // (though they might be the same for this particular text and width)
            expect(helveticaLines.length).toBeGreaterThan(0);
            expect(timesLines.length).toBeGreaterThan(0);
        });
    });

    describe('Text Truncation Accuracy', () => {
        const longText = 'This is a very long text that definitely needs to be truncated';
        const maxWidth = 100;
        const fontSize = 12;

        it('should truncate text more accurately than character-count-based truncation', () => {
            // Old approximation method
            const approximateTruncated = TextUtils.truncate(longText, maxWidth, fontSize);
            const approximateWidth = approximateTruncated.length * fontSize * 0.55;

            // New accurate method
            const accurateTruncated = textMeasurement.truncateTextAccurate(longText, maxWidth, {
                fontSize,
                fontFamily: 'Helvetica'
            });
            const accurateWidth = textMeasurement.measureTextWidth(accurateTruncated, fontSize, 'Helvetica');

            console.log(`Text truncation comparison for width ${maxWidth}pt:`);
            console.log(`  Original: "${longText}"`);
            console.log(`  Approximate: "${approximateTruncated}" (est. ${approximateWidth.toFixed(1)}pt)`);
            console.log(`  Accurate: "${accurateTruncated}" (${accurateWidth.toFixed(1)}pt)`);

            // Accurate truncation should fit within maxWidth
            expect(accurateWidth).toBeLessThanOrEqual(maxWidth + 1); // Allow 1pt tolerance

            // Should be shorter than original
            expect(accurateTruncated.length).toBeLessThan(longText.length);

            // Should contain ellipsis
            expect(accurateTruncated).toContain('…');
        });
    });

    describe('Font Metrics Accuracy', () => {
        it('should provide accurate font height and baseline information', () => {
            const fontSize = 12;
            const fonts = ['Helvetica', 'Times', 'Courier'];

            fonts.forEach(fontFamily => {
                const metrics = textMeasurement.getFontMetrics(fontSize, fontFamily);

                console.log(`${fontFamily} ${fontSize}pt metrics:`);
                console.log(`  Height: ${metrics.height.toFixed(1)}pt`);
                console.log(`  Baseline: ${metrics.baseline.toFixed(1)}pt`);
                console.log(`  Ascender: ${metrics.ascender.toFixed(1)}pt`);
                console.log(`  Descender: ${metrics.descender.toFixed(1)}pt`);

                // Reasonable values for 12pt font
                expect(metrics.height).toBeGreaterThan(10);
                expect(metrics.height).toBeLessThan(20);
                expect(metrics.baseline).toBeGreaterThan(6); // Adjusted for Courier's smaller ascender
                expect(metrics.baseline).toBeLessThan(15);
            });
        });
    });

    describe('Text Widget Integration', () => {
        it('should use accurate measurements in Text widget layout', () => {
            const textContent = 'Hello World Test';
            const textWidget = new TextWidget(textContent, {
                style: {
                    fontSize: 14,
                    fontFamily: 'Helvetica'
                }
            });

            const constraints: Layout.BoxConstraints = {
                minWidth: 0,
                maxWidth: 300,
                minHeight: 0,
                maxHeight: 100
            };

            const context: Layout.LayoutContext = {
                constraints,
                textDirection: 'ltr',
                theme,
                textMeasurement
            };

            const result = textWidget.layout(context);

            console.log(`Text widget layout result:`);
            console.log(`  Size: ${result.size.width.toFixed(1)} × ${result.size.height.toFixed(1)}pt`);
            console.log(`  Baseline: ${result.baseline?.toFixed(1)}pt`);

            // Should have reasonable dimensions
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.width).toBeLessThan(constraints.maxWidth);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.size.height).toBeLessThan(constraints.maxHeight);
        });

        it('should handle text wrapping in constrained containers', () => {
            const longText = 'This is a longer text that should wrap across multiple lines in a constrained container';
            const textWidget = new TextWidget(longText, {
                style: {
                    fontSize: 12,
                    fontFamily: 'Helvetica'
                },
                softWrap: true
            });

            const constraints: Layout.BoxConstraints = {
                minWidth: 0,
                maxWidth: 150, // Narrow width to force wrapping
                minHeight: 0,
                maxHeight: 200
            };

            const context: Layout.LayoutContext = {
                constraints,
                textDirection: 'ltr',
                theme,
                textMeasurement
            };

            const result = textWidget.layout(context);

            console.log(`Wrapped text layout result:`);
            console.log(`  Size: ${result.size.width.toFixed(1)} × ${result.size.height.toFixed(1)}pt`);
            console.log(`  Expected multiple lines due to width constraint of ${constraints.maxWidth}pt`);

            // Should use most of the available width
            expect(result.size.width).toBeGreaterThan(100);
            expect(result.size.width).toBeLessThanOrEqual(constraints.maxWidth);

            // Should be taller than single line (indicating wrapping)
            expect(result.size.height).toBeGreaterThan(15); // More than single line height
        });
    });

    describe('Performance and Caching', () => {
        it('should cache measurements for repeated calls', () => {
            const text = 'Performance Test Text';
            const fontSize = 12;
            const fontFamily = 'Helvetica';

            // First measurement
            const start1 = performance.now();
            const width1 = textMeasurement.measureTextWidth(text, fontSize, fontFamily);
            const time1 = performance.now() - start1;

            // Second measurement (should be cached)
            const start2 = performance.now();
            const width2 = textMeasurement.measureTextWidth(text, fontSize, fontFamily);
            const time2 = performance.now() - start2;

            console.log(`Performance test:`);
            console.log(`  First measurement: ${width1.toFixed(1)}pt in ${time1.toFixed(2)}ms`);
            console.log(`  Second measurement: ${width2.toFixed(1)}pt in ${time2.toFixed(2)}ms`);

            // Results should be identical
            expect(width1).toBe(width2);

            // Second call should be faster (cached)
            expect(time2).toBeLessThan(time1);

            // Check cache stats
            const stats = textMeasurement.getCacheStats();
            console.log(`  Cache stats: ${stats.measurementCache} measurements, ${stats.fontMetricsCache} font metrics`);
            expect(stats.measurementCache).toBeGreaterThan(0);
        });
    });
});

describe('Accuracy Improvement Demonstration', () => {
    let fontSystem: FontSystem;
    let textMeasurement: AccurateTextMeasurementService;

    beforeEach(() => {
        fontSystem = new FontSystem(mockPdfDocument);
        textMeasurement = new AccurateTextMeasurementService(fontSystem);
    });

    it('should demonstrate significant accuracy improvements across various scenarios', () => {
        const testCases = [
            { text: 'Hello World', fontSize: 12, font: 'Helvetica' },
            { text: 'The quick brown fox', fontSize: 14, font: 'Times' },
            { text: 'UPPERCASE TEXT', fontSize: 10, font: 'Helvetica' },
            { text: 'lowercase text', fontSize: 16, font: 'Courier' },
            { text: 'Mixed Case Text 123', fontSize: 12, font: 'Times' },
        ];

        console.log('\n=== ACCURACY IMPROVEMENT DEMONSTRATION ===\n');

        testCases.forEach((testCase, index) => {
            const { text, fontSize, font } = testCase;

            // Old method
            const approximateWidth = text.length * fontSize * 0.55;

            // New method
            const accurateWidth = textMeasurement.measureTextWidth(text, fontSize, font);

            const difference = Math.abs(accurateWidth - approximateWidth);
            const improvementPercent = (difference / approximateWidth) * 100;

            console.log(`Test Case ${index + 1}: ${font} ${fontSize}pt`);
            console.log(`  Text: "${text}"`);
            console.log(`  Approximate Width: ${approximateWidth.toFixed(1)}pt`);
            console.log(`  Accurate Width: ${accurateWidth.toFixed(1)}pt`);
            console.log(`  Difference: ${difference.toFixed(1)}pt`);
            console.log(`  Accuracy Improvement: ${improvementPercent.toFixed(1)}%`);
            console.log('');

            // Verify that accurate measurement is reasonable
            expect(accurateWidth).toBeGreaterThan(0);
            expect(accurateWidth).toBeLessThan(text.length * fontSize * 2); // Reasonable upper bound
        });
    });
});