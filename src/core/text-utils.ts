/**
 * Text Processing Utilities - Consolidated
 * 
 * Essential text processing functionality combining:
 * - Text measurement and metrics
 * - Simple line breaking
 * - Basic text layout
 * - Font-based calculations
 * 
 * Consolidates text-layout.ts + text-metrics.ts (1,448 lines → ~250 lines)
 * Removes over-engineered features like hyphenation, bidirectional text, kerning
 * 
 * @packageDocumentation
 */

import { FontSystem, FontWeight, FontStyle } from './fonts.js';
import { Geometry } from '../types.js';

/**
 * Text alignment options
 */
export enum TextAlign {
    Left = 'left',
    Center = 'center',
    Right = 'right',
    Justify = 'justify',
}

/**
 * Text direction for basic internationalization
 */
export enum TextDirection {
    LeftToRight = 'ltr',
    RightToLeft = 'rtl',
}

/**
 * Text overflow handling
 */
export enum TextOverflow {
    Clip = 'clip',
    Ellipsis = 'ellipsis',
    Visible = 'visible',
}

/**
 * Simple text style configuration
 */
export interface TextStyle {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    lineHeight?: number;
    letterSpacing?: number;
    color?: string;
}

/**
 * Text measurement options
 */
export interface TextMeasurementOptions {
    fontSize: number;
    fontFamily: string;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    lineHeight?: number;
    letterSpacing?: number;
}

/**
 * Text line information
 */
export interface TextLine {
    text: string;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Text layout result
 */
export interface TextLayoutResult {
    lines: TextLine[];
    width: number;
    height: number;
    baseline: number;
    truncated: boolean;
}

/**
 * Simple text measurement result
 */
export interface TextMeasurement {
    width: number;
    height: number;
    lines: number;
}

/**
 * Essential Text Processing Engine
 * 
 * Provides core text functionality without over-engineering
 */
export class TextProcessor {
    private fontSystem: FontSystem;

    constructor(fontSystem: FontSystem) {
        this.fontSystem = fontSystem;
    }

    /**
     * Measure single line text dimensions
     */
    measureText(text: string, options: TextMeasurementOptions): TextMeasurement {
        const font = this.fontSystem.getFontWithStyle(
            options.fontFamily,
            options.fontWeight || FontWeight.Normal,
            options.fontStyle || FontStyle.Normal
        );

        const fontSize = options.fontSize;
        const width = font.measureTextWidth(text, fontSize);
        // Use standard calculation: fontSize * lineHeight for consistency with tests
        const height = fontSize * (options.lineHeight || 1.2);

        return {
            width: width + (text.length * (options.letterSpacing || 0)),
            height,
            lines: 1,
        };
    }

    /**
     * Measure multi-line text with word wrapping
     */
    measureTextBlock(text: string, maxWidth: number, options: TextMeasurementOptions): TextMeasurement {
        const lines = this.breakIntoLines(text, maxWidth, options);
        const width = Math.max(...lines.map(line => line.width));
        const height = lines.reduce((sum, line) => sum + line.height, 0);

        return {
            width,
            height,
            lines: lines.length,
        };
    }

    /**
     * Layout text within constraints
     */
    layoutText(
        text: string,
        maxWidth: number,
        maxHeight: number = Number.POSITIVE_INFINITY,
        options: TextMeasurementOptions & {
            align?: TextAlign;
            overflow?: TextOverflow;
            maxLines?: number;
        } = { fontSize: 12, fontFamily: 'Helvetica' }
    ): TextLayoutResult {
        if (!text.trim()) {
            return this.createEmptyResult();
        }

        // Break text into lines
        let lines = this.breakIntoLines(text, maxWidth, options);

        // Apply line limit
        const maxLines = options.maxLines || Number.MAX_SAFE_INTEGER;
        const truncated = lines.length > maxLines;
        if (truncated) {
            lines = lines.slice(0, maxLines);

            // Handle ellipsis overflow
            if (options.overflow === TextOverflow.Ellipsis && lines.length > 0) {
                const lastLine = lines[lines.length - 1]!;
                const ellipsis = '…';
                const ellipsisWidth = this.measureText(ellipsis, options).width;

                // Truncate last line to fit ellipsis
                let truncatedText = lastLine.text;
                while (this.measureText(truncatedText + ellipsis, options).width > maxWidth && truncatedText.length > 0) {
                    truncatedText = truncatedText.slice(0, -1);
                }

                lines[lines.length - 1] = {
                    ...lastLine,
                    text: truncatedText + ellipsis,
                    width: this.measureText(truncatedText + ellipsis, options).width,
                };
            }
        }

        // Apply alignment
        lines = this.applyAlignment(lines, maxWidth, options.align || TextAlign.Left);

        // Calculate total dimensions
        const totalWidth = Math.max(...lines.map(line => line.width));
        const totalHeight = lines.reduce((sum, line) => sum + line.height, 0);
        const baseline = lines.length > 0 ? lines[0]!.height * 0.8 : 0;

        return {
            lines,
            width: totalWidth,
            height: Math.min(totalHeight, maxHeight),
            baseline,
            truncated,
        };
    }

    /**
     * Break text into lines with simple word wrapping
     */
    private breakIntoLines(text: string, maxWidth: number, options: TextMeasurementOptions): TextLine[] {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const lines: TextLine[] = [];
        const lineHeight = options.fontSize * (options.lineHeight || 1.2);

        let currentLine: string[] = [];
        let currentWidth = 0;
        let lineY = 0;

        for (const word of words) {
            const wordWidth = this.measureText(word, options).width;
            const spaceWidth = this.measureText(' ', options).width;
            const additionalWidth = currentLine.length > 0 ? spaceWidth : 0;

            if (currentWidth + additionalWidth + wordWidth <= maxWidth || currentLine.length === 0) {
                // Word fits on current line
                currentLine.push(word);
                currentWidth += additionalWidth + wordWidth;
            } else {
                // Word doesn't fit, finish current line and start new one
                if (currentLine.length > 0) {
                    const lineText = currentLine.join(' ');
                    lines.push({
                        text: lineText,
                        width: this.measureText(lineText, options).width,
                        height: lineHeight,
                        offsetX: 0,
                        offsetY: lineY,
                    });
                    lineY += lineHeight;
                }

                // Start new line with current word
                currentLine = [word];
                currentWidth = wordWidth;
            }
        }

        // Add final line if there are remaining words
        if (currentLine.length > 0) {
            const lineText = currentLine.join(' ');
            lines.push({
                text: lineText,
                width: this.measureText(lineText, options).width,
                height: lineHeight,
                offsetX: 0,
                offsetY: lineY,
            });
        }

        return lines;
    }

    /**
     * Apply text alignment to lines
     */
    private applyAlignment(lines: TextLine[], maxWidth: number, align: TextAlign): TextLine[] {
        return lines.map((line, index) => {
            let offsetX = 0;

            switch (align) {
                case TextAlign.Center:
                    offsetX = (maxWidth - line.width) / 2;
                    break;
                case TextAlign.Right:
                    offsetX = maxWidth - line.width;
                    break;
                case TextAlign.Justify:
                    // Simple justification - only for non-last lines with multiple words
                    if (index < lines.length - 1 && line.text.includes(' ')) {
                        // For simplicity, just return left-aligned
                        // Full justification would require word spacing adjustments
                        offsetX = 0;
                    }
                    break;
                case TextAlign.Left:
                default:
                    offsetX = 0;
                    break;
            }

            return {
                ...line,
                offsetX,
            };
        });
    }

    /**
     * Create empty layout result
     */
    private createEmptyResult(): TextLayoutResult {
        return {
            lines: [],
            width: 0,
            height: 12, // Default line height
            baseline: 12 * 0.8,
            truncated: false,
        };
    }

    /**
     * Calculate optimal font size to fit text in bounds
     */
    calculateOptimalFontSize(
        text: string,
        bounds: Geometry.Size,
        options: Omit<TextMeasurementOptions, 'fontSize'> & {
            minFontSize?: number;
            maxFontSize?: number;
        }
    ): number {
        const minSize = options.minFontSize || 8;
        const maxSize = options.maxFontSize || 72;

        let low = minSize;
        let high = maxSize;
        let optimalSize = minSize;

        // Binary search for optimal font size
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testOptions = { ...options, fontSize: mid };
            const measurement = this.measureTextBlock(text, bounds.width, testOptions);

            if (measurement.width <= bounds.width && measurement.height <= bounds.height) {
                optimalSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return optimalSize;
    }
}

/**
 * Text utility functions for common operations
 */
export const TextUtils = {
    /**
     * Quick text width measurement
     */
    measureWidth: (text: string, fontSize: number, fontFamily = 'Helvetica'): number => {
        // Simple estimation for basic use cases
        // Use accurate text measurement service if available
        try {
            const { getGlobalTextMeasurement } = require('./accurate-text-measurement');
            const measurementService = getGlobalTextMeasurement();
            return measurementService.measureTextWidth(text, fontSize);
        } catch {
            // Fallback to conservative estimate
            return text.length * fontSize * 0.55;
        }
    },

    /**
     * Quick line height calculation
     */
    calculateLineHeight: (fontSize: number, lineHeightMultiplier = 1.2): number => {
        return Math.round((fontSize * lineHeightMultiplier) * 10) / 10;
    },

    /**
     * Estimate height utility for tests
     */
    estimateHeight: (fontSize: number, lineHeight = 1.2): number => {
        return Math.round((fontSize * lineHeight) * 10) / 10;
    },

    /**
     * Truncate text utility for tests
     */
    truncate: (text: string, maxWidth: number, fontSize: number): string => {
        return TextUtils.truncateText(text, maxWidth, fontSize);
    },

    /**
     * Simple word count
     */
    countWords: (text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Truncate text to fit width with ellipsis
     */
    truncateText: (text: string, maxWidth: number, fontSize: number, fontFamily = 'Helvetica'): string => {
        const ellipsis = '…';
        const ellipsisWidth = TextUtils.measureWidth(ellipsis, fontSize, fontFamily);

        if (TextUtils.measureWidth(text, fontSize, fontFamily) <= maxWidth) {
            return text;
        }

        let truncated = text;
        while (TextUtils.measureWidth(truncated + ellipsis, fontSize, fontFamily) > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }

        return truncated + ellipsis;
    },

    /**
     * Wrap text to fit within width
     */
    wrapText: (text: string, maxWidth: number, fontSize: number, fontFamily = 'Helvetica'): string[] => {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const lines: string[] = [];
        let currentLine: string[] = [];

        for (const word of words) {
            const testLine = [...currentLine, word].join(' ');
            if (TextUtils.measureWidth(testLine, fontSize, fontFamily) <= maxWidth || currentLine.length === 0) {
                currentLine.push(word);
            } else {
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(' '));
                }
                currentLine = [word];
            }
        }

        if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
        }

        return lines;
    },

    /**
     * Calculate text bounds
     */
    getTextBounds: (
        text: string,
        fontSize: number,
        maxWidth: number,
        lineHeight = 1.2,
        fontFamily = 'Helvetica'
    ): Geometry.Size => {
        const lines = TextUtils.wrapText(text, maxWidth, fontSize, fontFamily);
        const width = Math.min(maxWidth, Math.max(...lines.map(line =>
            TextUtils.measureWidth(line, fontSize, fontFamily)
        )));
        const height = lines.length * TextUtils.calculateLineHeight(fontSize, lineHeight);

        return { width, height };
    },
};