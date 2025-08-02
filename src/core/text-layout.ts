/**
 * Text Layout and Alignment System
 * 
 * Advanced text layout engine with support for alignment, justification,
 * line breaking, and proper typography handling.
 * 
 * @packageDocumentation
 */

import { TtfParser, type TtfGlyphMetrics } from './pdf/ttf-parser.js';
import { PdfStandardFont } from './pdf/font.js';

/**
 * Text alignment options
 */
export enum TextAlign {
    Left = 'left',
    Center = 'center',
    Right = 'right',
    Justify = 'justify',
    Start = 'start',
    End = 'end',
}

/**
 * Text direction for internationalization
 */
export enum TextDirection {
    LeftToRight = 'ltr',
    RightToLeft = 'rtl',
}

/**
 * Line breaking behavior
 */
export enum LineBreak {
    Normal = 'normal',
    Strict = 'strict',
    Loose = 'loose',
    Anywhere = 'anywhere',
}

/**
 * Text overflow handling
 */
export enum TextOverflow {
    Clip = 'clip',
    Ellipsis = 'ellipsis',
    Fade = 'fade',
    Visible = 'visible',
}

/**
 * Font interface for text layout
 */
export interface LayoutFont {
    /** Measure text width */
    measureText(text: string): number;
    /** Get font metrics */
    getCharMetrics(charCode: number): TtfGlyphMetrics | undefined;
    /** Check if character is supported */
    isCharSupported(charCode: number): boolean;
    /** Font ascent */
    ascent: number;
    /** Font descent */
    descent: number;
    /** Units per em */
    unitsPerEm: number;
}

/**
 * Text layout options
 */
export interface TextLayoutOptions {
    /** Text alignment */
    align?: TextAlign;
    /** Text direction */
    direction?: TextDirection;
    /** Line breaking behavior */
    lineBreak?: LineBreak;
    /** Text overflow behavior */
    overflow?: TextOverflow;
    /** Maximum number of lines */
    maxLines?: number;
    /** Whether to allow soft wrapping */
    softWrap?: boolean;
    /** Line height multiplier */
    lineHeight?: number;
    /** Letter spacing */
    letterSpacing?: number;
    /** Word spacing */
    wordSpacing?: number;
    /** Font size in points */
    fontSize?: number;
    /** Minimum word length for hyphenation */
    minWordLength?: number;
    /** Whether to enable hyphenation */
    hyphenation?: boolean;
}

/**
 * Individual line information
 */
export interface TextLine {
    /** Text content of the line */
    text: string;
    /** Width of the line */
    width: number;
    /** Height of the line */
    height: number;
    /** X offset for alignment */
    offsetX: number;
    /** Y offset from baseline */
    offsetY: number;
    /** Whether line is justified */
    justified: boolean;
    /** Word spacing for justified lines */
    wordSpacing: number;
    /** Letter spacing for justified lines */
    letterSpacing: number;
    /** Character positions and widths */
    chars: Array<{
        char: string;
        x: number;
        width: number;
    }>;
}

/**
 * Complete text layout result
 */
export interface TextLayoutResult {
    /** Array of laid out lines */
    lines: TextLine[];
    /** Total width of the text block */
    width: number;
    /** Total height of the text block */
    height: number;
    /** Baseline offset from top */
    baseline: number;
    /** Whether text was truncated */
    truncated: boolean;
    /** Original text that was laid out */
    originalText: string;
}

/**
 * Word break opportunities
 */
interface BreakOpportunity {
    /** Position in text */
    position: number;
    /** Whether it's a forced break */
    forced: boolean;
    /** Break quality (lower is better) */
    quality: number;
    /** Width up to this break */
    width: number;
}

/**
 * Advanced text layout engine
 */
export class TextLayoutEngine {
    private readonly font: LayoutFont;
    private readonly options: Required<TextLayoutOptions>;

    constructor(font: LayoutFont, options: TextLayoutOptions = {}) {
        this.font = font;
        this.options = {
            align: options.align ?? TextAlign.Left,
            direction: options.direction ?? TextDirection.LeftToRight,
            lineBreak: options.lineBreak ?? LineBreak.Normal,
            overflow: options.overflow ?? TextOverflow.Clip,
            maxLines: options.maxLines ?? Number.MAX_SAFE_INTEGER,
            softWrap: options.softWrap ?? true,
            lineHeight: options.lineHeight ?? 1.2,
            letterSpacing: options.letterSpacing ?? 0,
            wordSpacing: options.wordSpacing ?? 0,
            fontSize: options.fontSize ?? 12,
            minWordLength: options.minWordLength ?? 5,
            hyphenation: options.hyphenation ?? false,
        };
    }

    /**
     * Layout text within given constraints
     */
    layoutText(text: string, maxWidth: number, maxHeight = Number.POSITIVE_INFINITY): TextLayoutResult {
        if (!text) {
            return this.createEmptyResult(text);
        }

        // Normalize text
        const normalizedText = this.normalizeText(text);

        // Find break opportunities
        const breakOpportunities = this.findBreakOpportunities(normalizedText);

        // Create lines
        const lines = this.createLines(normalizedText, breakOpportunities, maxWidth);

        // Apply line limit
        const limitedLines = this.applyLineLimit(lines);

        // Apply alignment and justification
        const alignedLines = this.applyAlignment(limitedLines, maxWidth);

        // Calculate final dimensions
        const totalHeight = alignedLines.reduce((sum, line) => sum + line.height, 0);
        const totalWidth = alignedLines.length > 0 ? Math.max(...alignedLines.map(line => line.width)) : 0;
        const baseline = alignedLines.length > 0 ? alignedLines[0]!.height * 0.8 : 0;

        return {
            lines: alignedLines,
            width: totalWidth,
            height: Math.min(totalHeight, maxHeight),
            baseline,
            truncated: lines.length > limitedLines.length,
            originalText: text,
        };
    }

    /**
     * Create empty layout result
     */
    private createEmptyResult(originalText: string): TextLayoutResult {
        const lineHeight = this.options.fontSize * this.options.lineHeight;

        return {
            lines: [],
            width: 0,
            height: lineHeight,
            baseline: lineHeight * 0.8,
            truncated: false,
            originalText,
        };
    }

    /**
     * Normalize text for layout
     */
    private normalizeText(text: string): string {
        // Replace tabs with spaces
        let normalized = text.replace(/\t/g, '    ');

        // Normalize line endings
        normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Handle RTL text
        if (this.options.direction === TextDirection.RightToLeft) {
            normalized = this.applyBidirectionalAlgorithm(normalized);
        }

        return normalized;
    }

    /**
     * Find break opportunities in text
     */
    private findBreakOpportunities(text: string): BreakOpportunity[] {
        const opportunities: BreakOpportunity[] = [];
        let width = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (!char) continue;
            const charCode = char.codePointAt(0) || 0;

            // Add character width
            const metrics = this.font.getCharMetrics(charCode);
            const charWidth = (metrics?.advanceWidth || 0) * this.options.fontSize + this.options.letterSpacing;
            width += charWidth;

            // Check for break opportunities
            const quality = this.getBreakQuality(text, i);
            if (quality < Number.POSITIVE_INFINITY) {
                opportunities.push({
                    position: i + 1,
                    forced: char === '\n',
                    quality,
                    width,
                });
            }
        }

        // Add end of text
        opportunities.push({
            position: text.length,
            forced: true,
            quality: 0,
            width,
        });

        return opportunities;
    }

    /**
     * Get break quality at position (lower is better)
     */
    private getBreakQuality(text: string, position: number): number {
        const char = text[position];
        const nextChar = text[position + 1];

        if (!char) return Number.POSITIVE_INFINITY;

        // Forced breaks
        if (char === '\n') return 0;

        // Whitespace breaks
        if (/\s/.test(char)) return 1;

        // Punctuation breaks
        if (/[.!?;:]/.test(char)) return 2;

        // Hyphen breaks
        if (char === '-' || char === '–' || char === '—') return 3;

        // Character-based breaks for some scripts
        if (this.isIdeographic(char)) return 4;

        // Hyphenation opportunities
        if (this.options.hyphenation && this.canHyphenate(text, position)) {
            return 5;
        }

        // Allow breaking anywhere if specified
        if (this.options.lineBreak === LineBreak.Anywhere) return 10;

        return Number.POSITIVE_INFINITY;
    }

    /**
     * Check if character is ideographic (CJK)
     */
    private isIdeographic(char: string): boolean {
        const code = char.codePointAt(0) || 0;
        return (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
            (code >= 0x3400 && code <= 0x4DBF) || // CJK Extension A
            (code >= 0x20000 && code <= 0x2A6DF) || // CJK Extension B
            (code >= 0x3040 && code <= 0x309F) || // Hiragana
            (code >= 0x30A0 && code <= 0x30FF);   // Katakana
    }

    /**
     * Check if position is suitable for hyphenation
     */
    private canHyphenate(text: string, position: number): boolean {
        // Simple hyphenation - look for vowel-consonant boundaries
        const currentChar = text[position]?.toLowerCase();
        const nextChar = text[position + 1]?.toLowerCase();

        if (!currentChar || !nextChar) return false;

        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnpqrstvwxyz';

        return vowels.includes(currentChar) && consonants.includes(nextChar);
    }

    /**
     * Create lines from text and break opportunities
     */
    private createLines(text: string, breakOpportunities: BreakOpportunity[], maxWidth: number): TextLine[] {
        const lines: TextLine[] = [];
        let lineStart = 0;
        let lineY = 0;
        const lineHeight = this.options.fontSize * this.options.lineHeight;

        for (const opportunity of breakOpportunities) {
            const lineText = text.substring(lineStart, opportunity.position);
            const lineWidth = this.measureLineWidth(lineText);

            // Check if line fits or if we need to break
            if (lineWidth <= maxWidth || !this.options.softWrap || lines.length === 0) {
                // Line fits or we're not wrapping
                if (opportunity.forced || opportunity === breakOpportunities[breakOpportunities.length - 1]) {
                    const line = this.createLine(lineText, lineWidth, lineHeight, 0, lineY);
                    lines.push(line);
                    lineStart = opportunity.position;
                    lineY += lineHeight;
                }
            } else {
                // Line doesn't fit, find best break before this
                const bestBreak = this.findBestBreak(breakOpportunities, lineStart, opportunity.position, maxWidth);
                if (bestBreak) {
                    const bestLineText = text.substring(lineStart, bestBreak.position);
                    const bestLineWidth = this.measureLineWidth(bestLineText);
                    const line = this.createLine(bestLineText, bestLineWidth, lineHeight, 0, lineY);
                    lines.push(line);
                    lineStart = bestBreak.position;
                    lineY += lineHeight;
                }
            }
        }

        return lines;
    }

    /**
     * Find best break opportunity within constraints
     */
    private findBestBreak(
        opportunities: BreakOpportunity[],
        startPos: number,
        endPos: number,
        maxWidth: number
    ): BreakOpportunity | undefined {
        let bestBreak: BreakOpportunity | undefined = undefined;

        for (const opportunity of opportunities) {
            if (opportunity.position <= startPos || opportunity.position >= endPos) {
                continue;
            }

            if (opportunity.width - (opportunities.find(o => o.position === startPos)?.width || 0) <= maxWidth) {
                if (!bestBreak || opportunity.quality < bestBreak.quality) {
                    bestBreak = opportunity;
                }
            }
        }

        return bestBreak;
    }

    /**
     * Measure width of a line of text
     */
    private measureLineWidth(text: string): number {
        let width = 0;
        let wordCount = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (!char) continue;
            const charCode = char.codePointAt(0) || 0;

            const metrics = this.font.getCharMetrics(charCode);
            width += (metrics?.advanceWidth || 0) * this.options.fontSize;
            width += this.options.letterSpacing;

            if (/\s/.test(char)) {
                wordCount++;
                width += this.options.wordSpacing;
            }
        }

        return width;
    }

    /**
     * Create a text line object
     */
    private createLine(text: string, width: number, height: number, offsetX: number, offsetY: number): TextLine {
        const chars: Array<{ char: string; x: number; width: number }> = [];
        let x = offsetX;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (!char) continue;
            const charCode = char.codePointAt(0) || 0;
            const metrics = this.font.getCharMetrics(charCode);
            const charWidth = (metrics?.advanceWidth || 0) * this.options.fontSize;

            chars.push({ char, x, width: charWidth });
            x += charWidth + this.options.letterSpacing;

            if (/\s/.test(char)) {
                x += this.options.wordSpacing;
            }
        }

        return {
            text: text.trim(),
            width,
            height,
            offsetX,
            offsetY,
            justified: false,
            wordSpacing: this.options.wordSpacing,
            letterSpacing: this.options.letterSpacing,
            chars,
        };
    }

    /**
     * Apply line limit
     */
    private applyLineLimit(lines: TextLine[]): TextLine[] {
        if (lines.length <= this.options.maxLines) {
            return lines;
        }

        const limitedLines = lines.slice(0, this.options.maxLines);

        // Handle overflow on last line
        if (this.options.overflow === TextOverflow.Ellipsis && limitedLines.length > 0) {
            const lastLine = limitedLines[limitedLines.length - 1]!;
            const ellipsis = '…';
            const ellipsisWidth = this.measureLineWidth(ellipsis);

            // Truncate text to fit ellipsis
            let truncatedText = lastLine.text;
            while (this.measureLineWidth(truncatedText + ellipsis) > lastLine.width && truncatedText.length > 0) {
                truncatedText = truncatedText.slice(0, -1);
            }

            limitedLines[limitedLines.length - 1] = this.createLine(
                truncatedText + ellipsis,
                this.measureLineWidth(truncatedText + ellipsis),
                lastLine.height,
                lastLine.offsetX,
                lastLine.offsetY
            );
        }

        return limitedLines;
    }

    /**
     * Apply text alignment and justification
     */
    private applyAlignment(lines: TextLine[], maxWidth: number): TextLine[] {
        return lines.map((line, index) => {
            const isLastLine = index === lines.length - 1;
            const shouldJustify = this.options.align === TextAlign.Justify && !isLastLine && line.text.includes(' ');

            if (shouldJustify) {
                return this.justifyLine(line, maxWidth);
            } else {
                return this.alignLine(line, maxWidth);
            }
        });
    }

    /**
     * Justify a line of text
     */
    private justifyLine(line: TextLine, targetWidth: number): TextLine {
        const words = line.text.split(/\s+/);
        if (words.length < 2) {
            return this.alignLine(line, targetWidth);
        }

        const totalTextWidth = words.reduce((sum, word) => sum + this.measureLineWidth(word), 0);
        const totalSpaces = words.length - 1;
        const extraSpace = targetWidth - totalTextWidth;
        const spaceWidth = extraSpace / totalSpaces;

        // Rebuild character positions with justified spacing
        const chars: Array<{ char: string; x: number; width: number }> = [];
        let x = 0;

        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            if (!word) continue;

            for (let charIndex = 0; charIndex < word.length; charIndex++) {
                const char = word[charIndex];
                if (!char) continue;
                const charCode = char.codePointAt(0) || 0;
                const metrics = this.font.getCharMetrics(charCode);
                const charWidth = (metrics?.advanceWidth || 0) * this.options.fontSize;

                chars.push({ char, x, width: charWidth });
                x += charWidth + this.options.letterSpacing;
            }

            // Add justified space between words
            if (wordIndex < words.length - 1) {
                chars.push({ char: ' ', x, width: spaceWidth });
                x += spaceWidth;
            }
        }

        return {
            ...line,
            width: targetWidth,
            justified: true,
            wordSpacing: spaceWidth,
            chars,
        };
    }

    /**
     * Align a line of text
     */
    private alignLine(line: TextLine, maxWidth: number): TextLine {
        let offsetX = 0;

        switch (this.options.align) {
            case TextAlign.Center:
                offsetX = (maxWidth - line.width) / 2;
                break;
            case TextAlign.Right:
            case TextAlign.End:
                offsetX = maxWidth - line.width;
                break;
            case TextAlign.Start:
                offsetX = this.options.direction === TextDirection.RightToLeft ? maxWidth - line.width : 0;
                break;
            case TextAlign.Left:
            default:
                offsetX = 0;
                break;
        }

        // Update character positions
        const chars = line.chars.map(char => ({
            ...char,
            x: char.x + offsetX,
        }));

        return {
            ...line,
            offsetX,
            chars,
        };
    }

    /**
     * Apply bidirectional text algorithm (simplified)
     */
    private applyBidirectionalAlgorithm(text: string): string {
        // This is a simplified version - a full implementation would follow Unicode Bidirectional Algorithm
        // For now, just reverse RTL text
        return text.split('').reverse().join('');
    }
}

/**
 * Create font adapter from TtfParser
 */
export function createFontAdapter(parser: TtfParser): LayoutFont {
    return {
        measureText: (text: string) => parser.measureText(text),
        getCharMetrics: (charCode: number) => parser.getCharMetrics(charCode),
        isCharSupported: (charCode: number) => parser.isCharSupported(charCode),
        ascent: parser.ascent,
        descent: parser.descent,
        unitsPerEm: parser.unitsPerEm,
    };
}

/**
 * Create font adapter from standard PDF font
 */
export function createStandardFontAdapter(font: PdfStandardFont, fontSize: number): LayoutFont {
    // This would use the standard font metrics - simplified implementation
    const baseWidth = 0.5; // Average character width

    return {
        measureText: (text: string) => text.length * baseWidth,
        getCharMetrics: (charCode: number) => ({
            left: 0,
            top: 0,
            right: baseWidth,
            bottom: 0,
            ascent: 0.8,
            descent: -0.2,
            advanceWidth: baseWidth,
            leftBearing: 0,
        }),
        isCharSupported: (charCode: number) => charCode >= 32 && charCode <= 126,
        ascent: 718,
        descent: -207,
        unitsPerEm: 1000,
    };
}