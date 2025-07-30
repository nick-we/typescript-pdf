/**
 * Font Fallback System Tests
 * 
 * Tests for the font fallback system including font resolution,
 * categorization, and fallback chain generation.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
    FontFallbackSystem,
    FontUtils,
    FontWeight,
    FontStyle,
    FontCategory,
    defaultFontFallback,
    type FontDescriptor,
} from '../core/font-fallback.js';
import { PdfStandardFont } from '../core/pdf/font.js';

describe('FontFallbackSystem', () => {
    let fontFallback: FontFallbackSystem;

    beforeEach(() => {
        fontFallback = new FontFallbackSystem();
    });

    describe('Font Resolution', () => {
        test('should resolve Helvetica family correctly', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.Helvetica);
        });

        test('should resolve Arial to Helvetica', () => {
            const descriptor: FontDescriptor = {
                family: 'Arial',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.Helvetica);
        });

        test('should resolve Times family correctly', () => {
            const descriptor: FontDescriptor = {
                family: 'Times',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.TimesRoman);
        });

        test('should resolve monospace fonts to Courier', () => {
            const descriptor: FontDescriptor = {
                family: 'Courier New',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.Courier);
        });

        test('should handle system fonts', () => {
            const descriptor: FontDescriptor = {
                family: '-apple-system',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.Helvetica);
        });
    });

    describe('Font Weight and Style Matching', () => {
        test('should resolve bold Helvetica', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: FontWeight.Bold,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.HelveticaBold);
        });

        test('should resolve italic Helvetica', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: FontWeight.Normal,
                style: FontStyle.Italic,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.HelveticaOblique);
        });

        test('should resolve bold italic Helvetica', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: FontWeight.Bold,
                style: FontStyle.Italic,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.HelveticaBoldOblique);
        });

        test('should resolve bold Times', () => {
            const descriptor: FontDescriptor = {
                family: 'Times',
                weight: FontWeight.Bold,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.TimesBold);
        });

        test('should resolve italic Times', () => {
            const descriptor: FontDescriptor = {
                family: 'Times',
                weight: FontWeight.Normal,
                style: FontStyle.Italic,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.TimesItalic);
        });

        test('should handle string weight values', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: 'bold',
                style: 'normal',
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.HelveticaBold);
        });

        test('should handle string style values', () => {
            const descriptor: FontDescriptor = {
                family: 'Helvetica',
                weight: 'normal',
                style: 'italic',
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.HelveticaOblique);
        });
    });

    describe('Font Categorization', () => {
        test('should categorize serif fonts', () => {
            const category = FontUtils.categorizeFont('Times');
            expect(category).toBe(FontCategory.Serif);
        });

        test('should categorize sans-serif fonts', () => {
            const category = FontUtils.categorizeFont('Arial');
            expect(category).toBe(FontCategory.SansSerif);
        });

        test('should categorize monospace fonts', () => {
            const category = FontUtils.categorizeFont('Courier New');
            expect(category).toBe(FontCategory.Monospace);
        });

        test('should categorize generic serif', () => {
            const category = FontUtils.categorizeFont('serif');
            expect(category).toBe(FontCategory.Serif);
        });

        test('should categorize generic sans-serif', () => {
            const category = FontUtils.categorizeFont('sans-serif');
            expect(category).toBe(FontCategory.SansSerif);
        });

        test('should categorize generic monospace', () => {
            const category = FontUtils.categorizeFont('monospace');
            expect(category).toBe(FontCategory.Monospace);
        });

        test('should default unknown fonts to sans-serif', () => {
            const category = FontUtils.categorizeFont('UnknownFont');
            expect(category).toBe(FontCategory.SansSerif);
        });
    });

    describe('Fallback Chains', () => {
        test('should generate fallback chain for Helvetica', () => {
            const chain = fontFallback.getFallbackChain('Helvetica');

            expect(chain).toContain(PdfStandardFont.Helvetica);
            expect(chain.length).toBeGreaterThan(1);
            expect(chain).toContain(PdfStandardFont.Helvetica); // Contains Helvetica fallback
        });

        test('should generate fallback chain for Times', () => {
            const chain = fontFallback.getFallbackChain('Times');

            expect(chain).toContain(PdfStandardFont.TimesRoman);
            expect(chain.length).toBeGreaterThan(1);
        });

        test('should generate fallback chain for unknown font', () => {
            const chain = fontFallback.getFallbackChain('UnknownFont');

            expect(chain.length).toBeGreaterThan(0);
            expect(chain).toContain(PdfStandardFont.Helvetica); // Should include universal fallback
        });

        test('should not duplicate fonts in chain', () => {
            const chain = fontFallback.getFallbackChain('Helvetica');
            const uniqueFonts = new Set(chain);

            expect(chain.length).toBe(uniqueFonts.size);
        });
    });

    describe('Native Support Detection', () => {
        test('should detect native support for PDF standard fonts', () => {
            expect(fontFallback.isNativelySupported('Helvetica')).toBe(true);
            expect(fontFallback.isNativelySupported('Times-Roman')).toBe(true);
            expect(fontFallback.isNativelySupported('Courier')).toBe(true);
        });

        test('should detect non-native fonts', () => {
            expect(fontFallback.isNativelySupported('Arial')).toBe(false);
            expect(fontFallback.isNativelySupported('Times New Roman')).toBe(false);
            expect(fontFallback.isNativelySupported('Unknown Font')).toBe(false);
        });
    });

    describe('Custom Fallback Rules', () => {
        test('should allow adding custom fallback rules', () => {
            fontFallback.addFallbackRule({
                pattern: /^CustomFont/i,
                fallbacks: [PdfStandardFont.Symbol, PdfStandardFont.Helvetica],
            });

            const descriptor: FontDescriptor = {
                family: 'CustomFont-Regular',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.Symbol);
        });

        test('should handle string pattern rules', () => {
            fontFallback.addFallbackRule({
                pattern: 'MyFont',
                fallbacks: [PdfStandardFont.ZapfDingbats],
            });

            const descriptor: FontDescriptor = {
                family: 'MyFont',
                weight: FontWeight.Normal,
                style: FontStyle.Normal,
            };

            const resolved = fontFallback.resolveFontDescriptor(descriptor);
            expect(resolved).toBe(PdfStandardFont.ZapfDingbats);
        });
    });
});

describe('FontUtils', () => {
    describe('resolveFont', () => {
        test('should resolve simple font family', () => {
            const resolved = FontUtils.resolveFont('Arial');
            expect(resolved).toBe(PdfStandardFont.Helvetica);
        });

        test('should resolve with weight and style', () => {
            const resolved = FontUtils.resolveFont('Arial', 'bold', 'italic');
            expect(resolved).toBe(PdfStandardFont.HelveticaBoldOblique);
        });

        test('should handle default parameters', () => {
            const resolved = FontUtils.resolveFont('Times');
            expect(resolved).toBe(PdfStandardFont.TimesRoman);
        });
    });

    describe('resolveFontStack', () => {
        test('should resolve first native font in stack', () => {
            const stack = ['Arial', 'Helvetica', 'sans-serif'];
            const resolved = FontUtils.resolveFontStack(stack);
            expect(resolved).toBe(PdfStandardFont.Helvetica);
        });

        test('should fallback when no native fonts in stack', () => {
            const stack = ['Unknown1', 'Unknown2', 'sans-serif'];
            const resolved = FontUtils.resolveFontStack(stack);
            expect(resolved).toBeDefined();
        });

        test('should handle empty stack', () => {
            const stack: string[] = [];
            const resolved = FontUtils.resolveFontStack(stack);
            expect(resolved).toBe(PdfStandardFont.Helvetica); // Default fallback
        });
    });

    describe('parseFontFamily', () => {
        test('should parse simple font family', () => {
            const parsed = FontUtils.parseFontFamily('Arial');
            expect(parsed).toEqual(['Arial']);
        });

        test('should parse font stack', () => {
            const parsed = FontUtils.parseFontFamily('Arial, Helvetica, sans-serif');
            expect(parsed).toEqual(['Arial', 'Helvetica', 'sans-serif']);
        });

        test('should handle quoted font names', () => {
            const parsed = FontUtils.parseFontFamily('"Times New Roman", Times, serif');
            expect(parsed).toEqual(['Times New Roman', 'Times', 'serif']);
        });

        test('should handle single quotes', () => {
            const parsed = FontUtils.parseFontFamily("'Courier New', Courier, monospace");
            expect(parsed).toEqual(['Courier New', 'Courier', 'monospace']);
        });

        test('should trim whitespace', () => {
            const parsed = FontUtils.parseFontFamily('  Arial  ,  Helvetica  ,  sans-serif  ');
            expect(parsed).toEqual(['Arial', 'Helvetica', 'sans-serif']);
        });

        test('should filter empty entries', () => {
            const parsed = FontUtils.parseFontFamily('Arial, , sans-serif');
            expect(parsed).toEqual(['Arial', 'sans-serif']);
        });
    });
});

describe('Default Font Fallback', () => {
    test('should be a FontFallbackSystem instance', () => {
        expect(defaultFontFallback).toBeInstanceOf(FontFallbackSystem);
    });

    test('should resolve common fonts', () => {
        const resolved = defaultFontFallback.resolveFontDescriptor({
            family: 'Arial',
            weight: FontWeight.Normal,
            style: FontStyle.Normal,
        });
        expect(resolved).toBe(PdfStandardFont.Helvetica);
    });
});

describe('Font Weight and Style Enums', () => {
    test('should have correct FontWeight values', () => {
        expect(FontWeight.Thin).toBe(100);
        expect(FontWeight.Normal).toBe(400);
        expect(FontWeight.Bold).toBe(700);
        expect(FontWeight.Black).toBe(900);
    });

    test('should have correct FontStyle values', () => {
        expect(FontStyle.Normal).toBe('normal');
        expect(FontStyle.Italic).toBe('italic');
        expect(FontStyle.Oblique).toBe('oblique');
    });

    test('should have correct FontCategory values', () => {
        expect(FontCategory.Serif).toBe('serif');
        expect(FontCategory.SansSerif).toBe('sans-serif');
        expect(FontCategory.Monospace).toBe('monospace');
        expect(FontCategory.Cursive).toBe('cursive');
        expect(FontCategory.Fantasy).toBe('fantasy');
    });
});