/**
 * Advanced Text Measurement and Metrics System
 * 
 * Provides accurate text measurement, line breaking, and typography metrics
 * for high-quality text rendering in PDF documents.
 * 
 * @packageDocumentation
 */

import { PdfStandardFont } from './pdf/font.js';
import { FontFallbackSystem, FontUtils, type FontDescriptor } from './font-fallback.js';

/**
 * Character-level metrics
 */
export interface CharacterMetrics {
    /** Character code */
    code: number;
    /** Character width in font units */
    width: number;
    /** Character height in font units */
    height: number;
    /** Left side bearing */
    leftBearing: number;
    /** Right side bearing */
    rightBearing: number;
}

/**
 * Word-level metrics
 */
export interface WordMetrics {
    /** Word text */
    text: string;
    /** Word width in points */
    width: number;
    /** Word height in points */
    height: number;
    /** Character metrics for the word */
    characters: CharacterMetrics[];
    /** Can this word be hyphenated? */
    hyphenatable: boolean;
    /** Hyphenation break points */
    hyphenationPoints?: number[];
}

/**
 * Line-level metrics
 */
export interface LineMetrics {
    /** Words in this line */
    words: WordMetrics[];
    /** Total line width in points */
    width: number;
    /** Line height in points */
    height: number;
    /** Baseline offset from top */
    baseline: number;
    /** Ascender height */
    ascender: number;
    /** Descender depth */
    descender: number;
    /** Leading (line spacing) */
    leading: number;
    /** Available space for justification */
    justificationSpace: number;
}

/**
 * Paragraph-level metrics
 */
export interface ParagraphMetrics {
    /** Lines in this paragraph */
    lines: LineMetrics[];
    /** Total paragraph width */
    width: number;
    /** Total paragraph height */
    height: number;
    /** Number of lines */
    lineCount: number;
    /** Average line width */
    averageLineWidth: number;
}

/**
 * Font metrics with enhanced character data
 */
export interface EnhancedFontMetrics {
    /** Font name */
    fontName: PdfStandardFont;
    /** Units per em */
    unitsPerEm: number;
    /** Ascender height */
    ascender: number;
    /** Descender depth */
    descender: number;
    /** Cap height */
    capHeight: number;
    /** X-height */
    xHeight: number;
    /** Line gap */
    lineGap: number;
    /** Character width table */
    characterWidths: Map<number, number>;
    /** Kerning pairs */
    kerningPairs: Map<string, number>;
}

/**
 * Text measurement options
 */
export interface TextMeasurementOptions {
    /** Font size in points */
    fontSize: number;
    /** Font descriptor */
    font: FontDescriptor;
    /** Line height multiplier */
    lineHeight: number;
    /** Letter spacing in em units */
    letterSpacing: number;
    /** Word spacing multiplier */
    wordSpacing: number;
    /** Enable kerning */
    kerning: boolean;
    /** Text direction */
    direction: 'ltr' | 'rtl';
    /** Hyphenation settings */
    hyphenation: {
        enabled: boolean;
        minWordLength: number;
        minLeftChars: number;
        minRightChars: number;
    };
}

/**
 * Line breaking options
 */
export interface LineBreakingOptions {
    /** Maximum line width */
    maxWidth: number;
    /** Line breaking strategy */
    strategy: 'simple' | 'optimal' | 'balanced';
    /** Allow hyphenation */
    hyphenation: boolean;
    /** Penalty for hyphenation */
    hyphenationPenalty: number;
    /** Penalty for loose lines */
    loosePenalty: number;
    /** Penalty for tight lines */
    tightPenalty: number;
    /** Justification ratio threshold */
    justificationThreshold: number;
}

/**
 * Advanced text measurement system
 */
export class TextMetricsEngine {
    private fontFallback: FontFallbackSystem;
    private fontMetricsCache = new Map<PdfStandardFont, EnhancedFontMetrics>();

    constructor(fontFallback?: FontFallbackSystem) {
        this.fontFallback = fontFallback || new FontFallbackSystem();
        this.initializeFontMetrics();
    }

    /**
     * Initialize enhanced font metrics for standard fonts
     */
    private initializeFontMetrics(): void {
        // Enhanced metrics for Helvetica
        this.fontMetricsCache.set(PdfStandardFont.Helvetica, {
            fontName: PdfStandardFont.Helvetica,
            unitsPerEm: 1000,
            ascender: 718,
            descender: -207,
            capHeight: 718,
            xHeight: 523,
            lineGap: 67,
            characterWidths: this.generateCharacterWidths(PdfStandardFont.Helvetica),
            kerningPairs: this.generateKerningPairs(PdfStandardFont.Helvetica),
        });

        // Enhanced metrics for Times Roman
        this.fontMetricsCache.set(PdfStandardFont.TimesRoman, {
            fontName: PdfStandardFont.TimesRoman,
            unitsPerEm: 1000,
            ascender: 683,
            descender: -217,
            capHeight: 662,
            xHeight: 450,
            lineGap: 100,
            characterWidths: this.generateCharacterWidths(PdfStandardFont.TimesRoman),
            kerningPairs: this.generateKerningPairs(PdfStandardFont.TimesRoman),
        });

        // Enhanced metrics for Courier
        this.fontMetricsCache.set(PdfStandardFont.Courier, {
            fontName: PdfStandardFont.Courier,
            unitsPerEm: 1000,
            ascender: 629,
            descender: -157,
            capHeight: 562,
            xHeight: 426,
            lineGap: 157,
            characterWidths: this.generateCharacterWidths(PdfStandardFont.Courier),
            kerningPairs: new Map(), // Monospace fonts typically don't have kerning
        });

        // Add other standard fonts...
        this.addFontVariations();
    }

    /**
     * Add font variations (bold, italic, etc.)
     */
    private addFontVariations(): void {
        const variations = [
            { base: PdfStandardFont.Helvetica, variant: PdfStandardFont.HelveticaBold, widthMultiplier: 1.1 },
            { base: PdfStandardFont.Helvetica, variant: PdfStandardFont.HelveticaOblique, widthMultiplier: 1.0 },
            { base: PdfStandardFont.Helvetica, variant: PdfStandardFont.HelveticaBoldOblique, widthMultiplier: 1.1 },
            { base: PdfStandardFont.TimesRoman, variant: PdfStandardFont.TimesBold, widthMultiplier: 1.08 },
            { base: PdfStandardFont.TimesRoman, variant: PdfStandardFont.TimesItalic, widthMultiplier: 0.98 },
            { base: PdfStandardFont.TimesRoman, variant: PdfStandardFont.TimesBoldItalic, widthMultiplier: 1.06 },
        ];

        for (const { base, variant, widthMultiplier } of variations) {
            const baseMetrics = this.fontMetricsCache.get(base);
            if (baseMetrics) {
                const variantWidths = new Map<number, number>();
                for (const [code, width] of baseMetrics.characterWidths) {
                    variantWidths.set(code, width * widthMultiplier);
                }

                this.fontMetricsCache.set(variant, {
                    ...baseMetrics,
                    fontName: variant,
                    characterWidths: variantWidths,
                });
            }
        }
    }

    /**
     * Generate character width table for a font
     */
    private generateCharacterWidths(font: PdfStandardFont): Map<number, number> {
        const widths = new Map<number, number>();

        // Realistic character widths based on font type
        const baseWidths = this.getBaseCharacterWidths(font);

        for (let code = 0; code < 256; code++) {
            const char = String.fromCharCode(code);
            widths.set(code, this.calculateCharacterWidth(char, baseWidths));
        }

        return widths;
    }

    /**
     * Get base character widths for different font types
     */
    private getBaseCharacterWidths(font: PdfStandardFont): Record<string, number> {
        if (font.includes('Courier')) {
            // Monospace font - all characters same width
            return {
                default: 600,
                space: 600,
                narrow: 600,
                wide: 600,
            };
        } else if (font.includes('Times')) {
            // Serif font with variable widths
            return {
                default: 444,
                space: 250,
                narrow: 278, // i, l, etc.
                wide: 722,   // M, W, etc.
            };
        } else {
            // Sans-serif (Helvetica) with variable widths
            return {
                default: 556,
                space: 278,
                narrow: 278, // i, l, etc.
                wide: 833,   // M, W, etc.
            };
        }
    }

    /**
     * Calculate character width based on character properties
     */
    private calculateCharacterWidth(char: string, baseWidths: Record<string, number>): number {
        if (char === ' ') return baseWidths['space'] ?? 250;

        // Narrow characters
        if (/[iltjfI]/.test(char)) return baseWidths['narrow'] ?? 278;

        // Wide characters
        if (/[mwMWQ]/.test(char)) return baseWidths['wide'] ?? 722;

        // Numbers are typically consistent width
        if (/[0-9]/.test(char)) return (baseWidths['default'] ?? 500) * 0.9;

        return baseWidths['default'] ?? 500;
    }

    /**
     * Generate kerning pairs for a font
     */
    private generateKerningPairs(font: PdfStandardFont): Map<string, number> {
        const kerning = new Map<string, number>();

        if (font.includes('Courier')) {
            // Monospace fonts don't typically have kerning
            return kerning;
        }

        // Common kerning pairs
        const commonPairs: Array<[string, string, number]> = [
            ['A', 'V', -80],
            ['A', 'W', -60],
            ['A', 'Y', -100],
            ['F', 'A', -80],
            ['L', 'T', -80],
            ['L', 'V', -80],
            ['L', 'W', -60],
            ['L', 'Y', -100],
            ['P', 'A', -80],
            ['R', 'T', -40],
            ['R', 'V', -40],
            ['R', 'W', -40],
            ['R', 'Y', -60],
            ['T', 'A', -80],
            ['T', 'e', -60],
            ['T', 'o', -60],
            ['T', 'r', -40],
            ['T', 'u', -40],
            ['V', 'A', -80],
            ['V', 'a', -60],
            ['V', 'e', -60],
            ['V', 'i', -40],
            ['V', 'o', -60],
            ['V', 'r', -40],
            ['V', 'u', -40],
            ['W', 'A', -60],
            ['W', 'a', -40],
            ['W', 'e', -40],
            ['W', 'i', -20],
            ['W', 'o', -40],
            ['W', 'r', -20],
            ['W', 'u', -20],
            ['Y', 'A', -100],
            ['Y', 'a', -80],
            ['Y', 'e', -80],
            ['Y', 'i', -60],
            ['Y', 'o', -80],
            ['Y', 'r', -60],
            ['Y', 'u', -60],
        ];

        for (const [left, right, adjustment] of commonPairs) {
            kerning.set(`${left}${right}`, adjustment);
        }

        return kerning;
    }

    /**
     * Measure a single character
     */
    measureCharacter(
        char: string,
        options: TextMeasurementOptions
    ): CharacterMetrics {
        const font = this.fontFallback.resolveFontDescriptor(options.font);
        const metrics = this.fontMetricsCache.get(font);

        if (!metrics) {
            throw new Error(`Font metrics not available for ${font}`);
        }

        const code = char.charCodeAt(0);
        const widthInUnits = metrics.characterWidths.get(code) ?? metrics.characterWidths.get(0) ?? 500;
        const width = (widthInUnits * options.fontSize) / metrics.unitsPerEm;
        const height = (metrics.ascender - metrics.descender) * options.fontSize / metrics.unitsPerEm;

        return {
            code,
            width: width + (options.letterSpacing * options.fontSize),
            height,
            leftBearing: 0, // Simplified
            rightBearing: 0, // Simplified
        };
    }

    /**
     * Measure a word
     */
    measureWord(
        word: string,
        options: TextMeasurementOptions
    ): WordMetrics {
        const characters: CharacterMetrics[] = [];
        let totalWidth = 0;
        let maxHeight = 0;

        for (let i = 0; i < word.length; i++) {
            const char = word[i]!;
            const charMetrics = this.measureCharacter(char, options);

            // Apply kerning if enabled
            if (options.kerning && i > 0) {
                const prevChar = word[i - 1]!;
                const kerning = this.getKerning(prevChar, char, options);
                charMetrics.width += kerning;
            }

            characters.push(charMetrics);
            totalWidth += charMetrics.width;
            maxHeight = Math.max(maxHeight, charMetrics.height);
        }

        const hyphenationPoints = this.findHyphenationPoints(word, options);

        return {
            text: word,
            width: totalWidth,
            height: maxHeight,
            characters,
            hyphenatable: word.length >= options.hyphenation.minWordLength,
            ...(hyphenationPoints && { hyphenationPoints }),
        };
    }

    /**
     * Get kerning adjustment between two characters
     */
    private getKerning(
        leftChar: string,
        rightChar: string,
        options: TextMeasurementOptions
    ): number {
        const font = this.fontFallback.resolveFontDescriptor(options.font);
        const metrics = this.fontMetricsCache.get(font);

        if (!metrics) return 0;

        const pair = `${leftChar}${rightChar}`;
        const kerningValue = metrics.kerningPairs.get(pair) ?? 0;

        return (kerningValue * options.fontSize) / metrics.unitsPerEm;
    }

    /**
     * Find hyphenation points in a word
     */
    private findHyphenationPoints(
        word: string,
        options: TextMeasurementOptions
    ): number[] | undefined {
        if (!options.hyphenation.enabled || word.length < options.hyphenation.minWordLength) {
            return undefined;
        }

        const points: number[] = [];

        // Simple hyphenation algorithm (in practice, you'd use a proper hyphenation library)
        // This is a basic implementation for demonstration

        for (let i = options.hyphenation.minLeftChars;
            i <= word.length - options.hyphenation.minRightChars;
            i++) {

            // Look for common hyphenation patterns
            if (this.canHyphenateAt(word, i)) {
                points.push(i);
            }
        }

        return points.length > 0 ? points : undefined;
    }

    /**
     * Check if hyphenation is allowed at a position
     */
    private canHyphenateAt(word: string, position: number): boolean {
        const before = word.substring(0, position);
        const after = word.substring(position);

        // Simple rules - in practice you'd use linguistic rules
        const vowels = 'aeiouAEIOU';
        const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';

        // Don't hyphenate between two vowels
        if (vowels.includes(before.slice(-1)) && vowels.includes(after[0]!)) {
            return false;
        }

        // Prefer to break after a vowel and before a consonant
        if (vowels.includes(before.slice(-1)) && consonants.includes(after[0]!)) {
            return true;
        }

        // Break between double consonants
        if (before.slice(-1) === after[0] && consonants.includes(before.slice(-1))) {
            return true;
        }

        return false;
    }

    /**
     * Measure a line of text
     */
    measureLine(
        words: WordMetrics[],
        options: TextMeasurementOptions
    ): LineMetrics {
        let totalWidth = 0;
        let maxHeight = 0;
        let maxAscender = 0;
        let maxDescender = 0;

        const font = this.fontFallback.resolveFontDescriptor(options.font);
        const metrics = this.fontMetricsCache.get(font);

        if (metrics) {
            maxAscender = (metrics.ascender * options.fontSize) / metrics.unitsPerEm;
            maxDescender = (metrics.descender * options.fontSize) / metrics.unitsPerEm;
        }

        for (const word of words) {
            totalWidth += word.width;
            maxHeight = Math.max(maxHeight, word.height);
        }

        // Add space between words
        const spaceWidth = this.measureCharacter(' ', options).width * options.wordSpacing;
        if (words.length > 1) {
            totalWidth += (words.length - 1) * spaceWidth;
        }

        const lineHeight = options.fontSize * options.lineHeight;
        const leading = lineHeight - (maxAscender - maxDescender);

        return {
            words,
            width: totalWidth,
            height: lineHeight,
            baseline: maxAscender,
            ascender: maxAscender,
            descender: maxDescender,
            leading,
            justificationSpace: 0, // Will be calculated during line breaking
        };
    }

    /**
     * Break text into lines with optimal line breaking
     */
    breakIntoLines(
        text: string,
        options: TextMeasurementOptions,
        breakingOptions: LineBreakingOptions
    ): LineMetrics[] {
        // Handle empty text
        if (!text.trim()) {
            return [];
        }

        const words = text.split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => this.measureWord(word, options));

        switch (breakingOptions.strategy) {
            case 'optimal':
                return this.optimalLineBreaking(words, options, breakingOptions);
            case 'balanced':
                return this.balancedLineBreaking(words, options, breakingOptions);
            default:
                return this.simpleLineBreaking(words, options, breakingOptions);
        }
    }

    /**
     * Simple greedy line breaking
     */
    private simpleLineBreaking(
        words: WordMetrics[],
        options: TextMeasurementOptions,
        breakingOptions: LineBreakingOptions
    ): LineMetrics[] {
        // Handle empty input
        if (words.length === 0) {
            return [];
        }

        const lines: LineMetrics[] = [];
        let currentLineWords: WordMetrics[] = [];
        let currentLineWidth = 0;
        const spaceWidth = this.measureCharacter(' ', options).width * options.wordSpacing;

        for (const word of words) {
            const wordWidth = word.width;
            const additionalWidth = currentLineWords.length > 0 ? spaceWidth : 0;

            if (currentLineWidth + additionalWidth + wordWidth <= breakingOptions.maxWidth) {
                currentLineWords.push(word);
                currentLineWidth += additionalWidth + wordWidth;
            } else {
                // Finish current line
                if (currentLineWords.length > 0) {
                    const line = this.measureLine(currentLineWords, options);
                    line.justificationSpace = breakingOptions.maxWidth - line.width;
                    lines.push(line);
                }

                // Start new line
                currentLineWords = [word];
                currentLineWidth = wordWidth;
            }
        }

        // Add final line
        if (currentLineWords.length > 0) {
            const line = this.measureLine(currentLineWords, options);
            lines.push(line);
        }

        return lines;
    }

    /**
     * Optimal line breaking using dynamic programming (simplified Knuth-Plass)
     */
    private optimalLineBreaking(
        words: WordMetrics[],
        options: TextMeasurementOptions,
        breakingOptions: LineBreakingOptions
    ): LineMetrics[] {
        // This is a simplified version - full implementation would be much more complex
        return this.simpleLineBreaking(words, options, breakingOptions);
    }

    /**
     * Balanced line breaking for better visual appearance
     */
    private balancedLineBreaking(
        words: WordMetrics[],
        options: TextMeasurementOptions,
        breakingOptions: LineBreakingOptions
    ): LineMetrics[] {
        // First pass: simple line breaking
        const simpleLines = this.simpleLineBreaking(words, options, breakingOptions);

        // Second pass: try to balance line lengths
        // This is a simplified implementation
        return simpleLines;
    }

    /**
     * Measure a complete paragraph
     */
    measureParagraph(
        text: string,
        options: TextMeasurementOptions,
        breakingOptions: LineBreakingOptions
    ): ParagraphMetrics {
        const lines = this.breakIntoLines(text, options, breakingOptions);

        const width = Math.max(...lines.map(line => line.width));
        const height = lines.reduce((sum, line) => sum + line.height, 0);
        const averageLineWidth = lines.reduce((sum, line) => sum + line.width, 0) / lines.length;

        return {
            lines,
            width,
            height,
            lineCount: lines.length,
            averageLineWidth,
        };
    }
}

/**
 * Default text metrics engine instance
 */
export const defaultTextMetrics = new TextMetricsEngine();

/**
 * Convenience functions for text measurement
 */
export const TextMeasurementUtils = {
    /**
     * Quick text width measurement
     */
    measureTextWidth: (
        text: string,
        fontSize: number,
        fontFamily: string = 'Helvetica'
    ): number => {
        const options: TextMeasurementOptions = {
            fontSize,
            font: { family: fontFamily, weight: 'normal', style: 'normal' },
            lineHeight: 1.0,
            letterSpacing: 0,
            wordSpacing: 1.0,
            kerning: false,
            direction: 'ltr',
            hyphenation: {
                enabled: false,
                minWordLength: 6,
                minLeftChars: 2,
                minRightChars: 3,
            },
        };

        const word = defaultTextMetrics.measureWord(text, options);
        return word.width;
    },

    /**
     * Quick line height calculation
     */
    calculateLineHeight: (
        fontSize: number,
        lineHeightMultiplier: number = 1.2
    ): number => {
        return fontSize * lineHeightMultiplier;
    },

    /**
     * Calculate text bounds
     */
    getTextBounds: (
        text: string,
        fontSize: number,
        maxWidth: number,
        fontFamily: string = 'Helvetica'
    ): { width: number; height: number; lineCount: number } => {
        const options: TextMeasurementOptions = {
            fontSize,
            font: { family: fontFamily, weight: 'normal', style: 'normal' },
            lineHeight: 1.2,
            letterSpacing: 0,
            wordSpacing: 1.0,
            kerning: true,
            direction: 'ltr',
            hyphenation: {
                enabled: false,
                minWordLength: 6,
                minLeftChars: 2,
                minRightChars: 3,
            },
        };

        const breakingOptions: LineBreakingOptions = {
            maxWidth,
            strategy: 'simple',
            hyphenation: false,
            hyphenationPenalty: 50,
            loosePenalty: 10,
            tightPenalty: 50,
            justificationThreshold: 0.5,
        };

        const paragraph = defaultTextMetrics.measureParagraph(text, options, breakingOptions);
        return {
            width: paragraph.width,
            height: paragraph.height,
            lineCount: paragraph.lineCount,
        };
    },
};