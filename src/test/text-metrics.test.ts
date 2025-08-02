/**
 * Text Metrics System Tests
 * 
 * Tests for the advanced text measurement system including character metrics,
 * word measurement, line breaking, and paragraph layout.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
    TextMetricsEngine,
    TextMeasurementUtils,
    defaultTextMetrics,
    type TextMeasurementOptions,
    type LineBreakingOptions,
    type CharacterMetrics,
    type WordMetrics,
    type LineMetrics,
    type ParagraphMetrics,
} from '../core/text-metrics.js';
import {
    FontFallbackSystem,
    FontWeight,
    FontStyle,
    type FontDescriptor,
} from '../core/font-fallback.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { TextDirection } from '@/core/text-layout.js';

describe('TextMetricsEngine', () => {
    let textMetrics: TextMetricsEngine;
    let fontFallback: FontFallbackSystem;

    beforeEach(() => {
        fontFallback = new FontFallbackSystem();
        textMetrics = new TextMetricsEngine(fontFallback);
    });

    describe('Character Measurement', () => {
        test('should measure single character', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const metrics = textMetrics.measureCharacter('A', options);

            expect(metrics.code).toBe(65); // ASCII code for 'A'
            expect(metrics.width).toBeGreaterThan(0);
            expect(metrics.height).toBeGreaterThan(0);
            expect(metrics.leftBearing).toBe(0); // Simplified implementation
            expect(metrics.rightBearing).toBe(0); // Simplified implementation
        });

        test('should apply letter spacing', () => {
            const baseOptions: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const spacedOptions: TextMeasurementOptions = {
                ...baseOptions,
                letterSpacing: 0.1, // 10% of font size
            };

            const baseMetrics = textMetrics.measureCharacter('A', baseOptions);
            const spacedMetrics = textMetrics.measureCharacter('A', spacedOptions);

            expect(spacedMetrics.width).toBeGreaterThan(baseMetrics.width);
        });

        test('should handle different font sizes', () => {
            const smallOptions: TextMeasurementOptions = {
                fontSize: 8,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const largeOptions: TextMeasurementOptions = {
                ...smallOptions,
                fontSize: 24,
            };

            const smallMetrics = textMetrics.measureCharacter('A', smallOptions);
            const largeMetrics = textMetrics.measureCharacter('A', largeOptions);

            expect(largeMetrics.width).toBeGreaterThan(smallMetrics.width);
            expect(largeMetrics.height).toBeGreaterThan(smallMetrics.height);
        });
    });

    describe('Word Measurement', () => {
        test('should measure simple word', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const metrics = textMetrics.measureWord('Hello', options);

            expect(metrics.text).toBe('Hello');
            expect(metrics.width).toBeGreaterThan(0);
            expect(metrics.height).toBeGreaterThan(0);
            expect(metrics.characters).toHaveLength(5);
            expect(metrics.hyphenatable).toBe(false); // 'Hello' is too short for default hyphenation
        });

        test('should identify hyphenatable words', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: true,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const metrics = textMetrics.measureWord('supercalifragilisticexpialidocious', options);

            expect(metrics.hyphenatable).toBe(true);
            expect(metrics.hyphenationPoints).toBeDefined();
            if (metrics.hyphenationPoints) {
                expect(metrics.hyphenationPoints.length).toBeGreaterThan(0);
            }
        });

        test('should calculate word width as sum of character widths', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const wordMetrics = textMetrics.measureWord('ABC', options);
            const expectedWidth = wordMetrics.characters.reduce((sum, char) => sum + char.width, 0);

            expect(Math.abs(wordMetrics.width - expectedWidth)).toBeLessThan(0.01);
        });
    });

    describe('Line Measurement', () => {
        test('should measure line with single word', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const wordMetrics = textMetrics.measureWord('Hello', options);
            const lineMetrics = textMetrics.measureLine([wordMetrics], options);

            expect(lineMetrics.words).toHaveLength(1);
            expect(lineMetrics.width).toBe(wordMetrics.width);
            expect(lineMetrics.height).toBeGreaterThan(0);
            expect(lineMetrics.baseline).toBeGreaterThan(0);
        });

        test('should measure line with multiple words', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const word1 = textMetrics.measureWord('Hello', options);
            const word2 = textMetrics.measureWord('World', options);
            const lineMetrics = textMetrics.measureLine([word1, word2], options);

            expect(lineMetrics.words).toHaveLength(2);
            // Width should be sum of words plus space between them
            expect(lineMetrics.width).toBeGreaterThan(word1.width + word2.width);
        });

        test('should calculate correct line height', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.5,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const wordMetrics = textMetrics.measureWord('Hello', options);
            const lineMetrics = textMetrics.measureLine([wordMetrics], options);

            expect(lineMetrics.height).toBe(12 * 1.5); // fontSize * lineHeight
        });
    });

    describe('Line Breaking', () => {
        test('should break text into lines', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const breakingOptions: LineBreakingOptions = {
                maxWidth: 100,
                strategy: 'simple',
                hyphenation: false,
                hyphenationPenalty: 50,
                loosePenalty: 10,
                tightPenalty: 50,
                justificationThreshold: 0.5,
            };

            const text = 'This is a long text that should be broken into multiple lines';
            const lines = textMetrics.breakIntoLines(text, options, breakingOptions);

            expect(lines.length).toBeGreaterThan(1);
            for (const line of lines) {
                expect(line.width).toBeLessThanOrEqual(breakingOptions.maxWidth + 10); // Small tolerance
            }
        });

        test('should handle single word longer than max width', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const breakingOptions: LineBreakingOptions = {
                maxWidth: 50,
                strategy: 'simple',
                hyphenation: false,
                hyphenationPenalty: 50,
                loosePenalty: 10,
                tightPenalty: 50,
                justificationThreshold: 0.5,
            };

            const text = 'Supercalifragilisticexpialidocious';
            const lines = textMetrics.breakIntoLines(text, options, breakingOptions);

            expect(lines.length).toBeGreaterThanOrEqual(1);
            // Even if word is too long, it should still create a line
            expect(lines[0]!.words.length).toBeGreaterThan(0);
        });

        test('should handle empty text', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const breakingOptions: LineBreakingOptions = {
                maxWidth: 200,
                strategy: 'simple',
                hyphenation: false,
                hyphenationPenalty: 50,
                loosePenalty: 10,
                tightPenalty: 50,
                justificationThreshold: 0.5,
            };

            const text = '';
            const lines = textMetrics.breakIntoLines(text, options, breakingOptions);

            // Empty text should result in empty lines array
            expect(lines.length).toBe(0);
        });
    });

    describe('Paragraph Measurement', () => {
        test('should measure complete paragraph', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const breakingOptions: LineBreakingOptions = {
                maxWidth: 150,
                strategy: 'simple',
                hyphenation: false,
                hyphenationPenalty: 50,
                loosePenalty: 10,
                tightPenalty: 50,
                justificationThreshold: 0.5,
            };

            const text = 'This is a paragraph with multiple lines of text that will be broken appropriately.';
            const paragraph = textMetrics.measureParagraph(text, options, breakingOptions);

            expect(paragraph.lines.length).toBeGreaterThan(1);
            expect(paragraph.width).toBeLessThanOrEqual(breakingOptions.maxWidth + 10);
            expect(paragraph.height).toBe(paragraph.lines.reduce((sum, line) => sum + line.height, 0));
            expect(paragraph.lineCount).toBe(paragraph.lines.length);
            expect(paragraph.averageLineWidth).toBeGreaterThan(0);
        });

        test('should calculate average line width correctly', () => {
            const options: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const breakingOptions: LineBreakingOptions = {
                maxWidth: 100,
                strategy: 'simple',
                hyphenation: false,
                hyphenationPenalty: 50,
                loosePenalty: 10,
                tightPenalty: 50,
                justificationThreshold: 0.5,
            };

            const text = 'Short lines here';
            const paragraph = textMetrics.measureParagraph(text, options, breakingOptions);

            const expectedAverage = paragraph.lines.reduce((sum, line) => sum + line.width, 0) / paragraph.lines.length;
            expect(Math.abs(paragraph.averageLineWidth - expectedAverage)).toBeLessThan(0.01);
        });
    });

    describe('Font Variations', () => {
        test('should handle different font families', () => {
            const helveticaOptions: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const courierOptions: TextMeasurementOptions = {
                ...helveticaOptions,
                font: { family: 'Courier', weight: FontWeight.Normal, style: FontStyle.Normal },
            };

            const helveticaMetrics = textMetrics.measureWord('Hello', helveticaOptions);
            const courierMetrics = textMetrics.measureWord('Hello', courierOptions);

            // Courier should be wider (monospace)
            expect(courierMetrics.width).toBeGreaterThan(helveticaMetrics.width);
        });

        test('should handle bold fonts', () => {
            const normalOptions: TextMeasurementOptions = {
                fontSize: 12,
                font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
                lineHeight: 1.2,
                letterSpacing: 0,
                wordSpacing: 1.0,
                kerning: false,
                direction: TextDirection.LeftToRight,
                hyphenation: {
                    enabled: false,
                    minWordLength: 6,
                    minLeftChars: 2,
                    minRightChars: 3,
                },
            };

            const boldOptions: TextMeasurementOptions = {
                ...normalOptions,
                font: { family: 'Helvetica', weight: FontWeight.Bold, style: FontStyle.Normal },
            };

            const normalMetrics = textMetrics.measureWord('Hello', normalOptions);
            const boldMetrics = textMetrics.measureWord('Hello', boldOptions);

            // Bold should be slightly wider
            expect(boldMetrics.width).toBeGreaterThanOrEqual(normalMetrics.width);
        });
    });
});

describe('TextMeasurementUtils', () => {
    describe('measureTextWidth', () => {
        test('should measure text width quickly', () => {
            const width = TextMeasurementUtils.measureTextWidth('Hello World', 12);
            expect(width).toBeGreaterThan(0);
        });

        test('should handle different font sizes', () => {
            const smallWidth = TextMeasurementUtils.measureTextWidth('Hello', 8);
            const largeWidth = TextMeasurementUtils.measureTextWidth('Hello', 24);

            expect(largeWidth).toBeGreaterThan(smallWidth);
        });

        test('should handle different font families', () => {
            const helveticaWidth = TextMeasurementUtils.measureTextWidth('Hello', 12, 'Helvetica');
            const courierWidth = TextMeasurementUtils.measureTextWidth('Hello', 12, 'Courier');

            expect(courierWidth).toBeGreaterThan(helveticaWidth);
        });
    });

    describe('calculateLineHeight', () => {
        test('should calculate line height', () => {
            const lineHeight = TextMeasurementUtils.calculateLineHeight(12);
            expect(lineHeight).toBe(12 * 1.2); // Default multiplier
        });

        test('should use custom multiplier', () => {
            const lineHeight = TextMeasurementUtils.calculateLineHeight(12, 1.5);
            expect(lineHeight).toBe(12 * 1.5);
        });
    });

    describe('getTextBounds', () => {
        test('should calculate text bounds', () => {
            const bounds = TextMeasurementUtils.getTextBounds(
                'This is a long text that will wrap',
                12,
                100
            );

            expect(bounds.width).toBeGreaterThan(0);
            expect(bounds.height).toBeGreaterThan(0);
            expect(bounds.lineCount).toBeGreaterThan(0);
            expect(bounds.width).toBeLessThanOrEqual(100);
        });

        test('should handle single line text', () => {
            const bounds = TextMeasurementUtils.getTextBounds(
                'Short',
                12,
                200
            );

            expect(bounds.lineCount).toBe(1);
            expect(bounds.height).toBe(12 * 1.2); // Single line height
        });

        test('should handle multi-line text', () => {
            const bounds = TextMeasurementUtils.getTextBounds(
                'This is a very long text that should definitely wrap into multiple lines when constrained to a narrow width',
                12,
                80
            );

            expect(bounds.lineCount).toBeGreaterThan(1);
            expect(bounds.height).toBeGreaterThan(12 * 1.2); // Multiple line height
        });
    });
});

describe('Default Text Metrics', () => {
    test('should be a TextMetricsEngine instance', () => {
        expect(defaultTextMetrics).toBeInstanceOf(TextMetricsEngine);
    });

    test('should measure characters correctly', () => {
        const options: TextMeasurementOptions = {
            fontSize: 12,
            font: { family: 'Helvetica', weight: FontWeight.Normal, style: FontStyle.Normal },
            lineHeight: 1.2,
            letterSpacing: 0,
            wordSpacing: 1.0,
            kerning: false,
            direction: TextDirection.LeftToRight,
            hyphenation: {
                enabled: false,
                minWordLength: 6,
                minLeftChars: 2,
                minRightChars: 3,
            },
        };

        const metrics = defaultTextMetrics.measureCharacter('A', options);
        expect(metrics.width).toBeGreaterThan(0);
        expect(metrics.height).toBeGreaterThan(0);
    });
});