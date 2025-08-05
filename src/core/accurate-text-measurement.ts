/**
 * Accurate Text Measurement Service
 *
 * Provides precise text measurement using real font metrics instead of
 * crude avgCharWidth approximations. Integrates with the existing FontSystem
 * to deliver accurate character-by-character width calculations.
 *
 * @packageDocumentation
 */

import type { Geometry } from '../types.js';

import type { FontSystem } from './fonts.js';
import { FontWeight, FontStyle } from './fonts.js';

/**
 * Font height and baseline metrics
 */
export interface FontHeightMetrics {
    /** Total font height (ascender + descender) */
    height: number;
    /** Ascender height (baseline to top) */
    ascender: number;
    /** Descender depth (baseline to bottom, negative value) */
    descender: number;
    /** Baseline position from top */
    baseline: number;
}

/**
 * Accurate text measurement result
 */
export interface AccurateTextMeasurement {
    /** Actual text width using font metrics */
    width: number;
    /** Font height with line spacing */
    height: number;
    /** Baseline position */
    baseline: number;
    /** Number of lines */
    lineCount: number;
    /** Actual wrapped lines (if applicable) */
    actualLines?: string[];
}

/**
 * Text measurement options
 */
export interface TextMeasurementOptions {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    lineSpacing?: number;
}

/**
 * Accurate text measurement service using real font metrics
 */
export class AccurateTextMeasurementService {
    private readonly fontSystem: FontSystem;

    // Cache for frequently used measurements
    private readonly measurementCache = new Map<string, number>();
    private readonly fontMetricsCache = new Map<string, FontHeightMetrics>();

    constructor(fontSystem: FontSystem) {
        this.fontSystem = fontSystem;
    }

    /**
     * Measure text width using actual font metrics
     */
    measureTextWidth(
        text: string,
        fontSize: number,
        fontFamily: string = 'Helvetica',
        fontWeight: FontWeight = FontWeight.Normal,
        fontStyle: FontStyle = FontStyle.Normal
    ): number {
        if (!text) {
            return 0;
        }

        // Check cache first
        const cacheKey = `${text}|${fontSize}|${fontFamily}|${fontWeight}|${fontStyle}`;
        const cached = this.measurementCache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        // Get font and measure
        const font = this.fontSystem.getFontWithStyle(
            fontFamily,
            fontWeight,
            fontStyle
        );
        const width = font.measureTextWidth(text, fontSize);

        // Cache result
        this.measurementCache.set(cacheKey, width);

        return width;
    }

    /**
     * Measure single character width
     */
    measureCharWidth(
        char: string,
        fontSize: number,
        fontFamily: string = 'Helvetica',
        fontWeight: FontWeight = FontWeight.Normal,
        fontStyle: FontStyle = FontStyle.Normal
    ): number {
        return this.measureTextWidth(
            char,
            fontSize,
            fontFamily,
            fontWeight,
            fontStyle
        );
    }

    /**
     * Get font height and baseline metrics
     */
    getFontMetrics(
        fontSize: number,
        fontFamily: string = 'Helvetica',
        fontWeight: FontWeight = FontWeight.Normal,
        fontStyle: FontStyle = FontStyle.Normal,
        lineSpacing: number = 1.2
    ): FontHeightMetrics {
        // Check cache first
        const cacheKey = `${fontSize}|${fontFamily}|${fontWeight}|${fontStyle}|${lineSpacing}`;
        const cached = this.fontMetricsCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Get font metrics
        const font = this.fontSystem.getFontWithStyle(
            fontFamily,
            fontWeight,
            fontStyle
        );
        const ascender = font.getAscender(fontSize);
        const descender = font.getDescender(fontSize);

        const metrics: FontHeightMetrics = {
            height: fontSize * lineSpacing,
            ascender,
            descender,
            baseline: ascender,
        };

        // Cache result
        this.fontMetricsCache.set(cacheKey, metrics);

        return metrics;
    }

    /**
     * Measure text with accurate wrapping
     */
    measureTextWithWrapping(
        text: string,
        maxWidth: number,
        options: TextMeasurementOptions
    ): AccurateTextMeasurement {
        if (!text.trim()) {
            const metrics = this.getFontMetrics(
                options.fontSize,
                options.fontFamily,
                options.fontWeight,
                options.fontStyle,
                options.lineSpacing
            );
            return {
                width: 0,
                height: metrics.height,
                baseline: metrics.baseline,
                lineCount: 1,
                actualLines: [''],
            };
        }

        // Wrap text using accurate measurements
        const wrappedLines = this.wrapTextAccurate(text, maxWidth, options);

        // Calculate dimensions
        const actualWidths = wrappedLines.map(line =>
            this.measureTextWidth(
                line,
                options.fontSize,
                options.fontFamily,
                options.fontWeight,
                options.fontStyle
            )
        );

        const maxLineWidth = Math.max(...actualWidths);
        const metrics = this.getFontMetrics(
            options.fontSize,
            options.fontFamily,
            options.fontWeight,
            options.fontStyle,
            options.lineSpacing
        );

        return {
            width: Math.min(maxLineWidth, maxWidth),
            height: wrappedLines.length * metrics.height,
            baseline: metrics.baseline,
            lineCount: wrappedLines.length,
            actualLines: wrappedLines,
        };
    }

    /**
     * Wrap text using accurate font measurements
     */
    wrapTextAccurate(
        text: string,
        maxWidth: number,
        options: TextMeasurementOptions
    ): string[] {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const lines: string[] = [];
        let currentLine: string[] = [];

        for (const word of words) {
            const testLine = [...currentLine, word].join(' ');
            const lineWidth = this.measureTextWidth(
                testLine,
                options.fontSize,
                options.fontFamily,
                options.fontWeight,
                options.fontStyle
            );

            if (lineWidth <= maxWidth || currentLine.length === 0) {
                currentLine.push(word);
            } else {
                // Current word doesn't fit, finish current line
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(' '));
                }
                currentLine = [word];
            }
        }

        // Add final line
        if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
        }

        return lines.length > 0 ? lines : [''];
    }

    /**
     * Truncate text with accurate ellipsis positioning
     */
    truncateTextAccurate(
        text: string,
        maxWidth: number,
        options: TextMeasurementOptions,
        ellipsis: string = '…'
    ): string {
        const fullWidth = this.measureTextWidth(
            text,
            options.fontSize,
            options.fontFamily,
            options.fontWeight,
            options.fontStyle
        );

        // If text fits, return as-is
        if (fullWidth <= maxWidth) {
            return text;
        }

        // Measure ellipsis width
        const ellipsisWidth = this.measureTextWidth(
            ellipsis,
            options.fontSize,
            options.fontFamily,
            options.fontWeight,
            options.fontStyle
        );

        // Binary search for optimal truncation point
        let left = 0;
        let right = text.length;
        let bestLength = 0;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const truncated = text.substring(0, mid);
            const truncatedWidth = this.measureTextWidth(
                truncated,
                options.fontSize,
                options.fontFamily,
                options.fontWeight,
                options.fontStyle
            );

            if (truncatedWidth + ellipsisWidth <= maxWidth) {
                bestLength = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return text.substring(0, bestLength) + ellipsis;
    }

    /**
     * Calculate text bounds for layout
     */
    getTextBounds(
        text: string,
        maxWidth: number,
        options: TextMeasurementOptions
    ): Geometry.Size {
        const measurement = this.measureTextWithWrapping(
            text,
            maxWidth,
            options
        );
        return {
            width: measurement.width,
            height: measurement.height,
        };
    }

    /**
     * Clear measurement caches (useful for memory management)
     */
    clearCache(): void {
        this.measurementCache.clear();
        this.fontMetricsCache.clear();
    }

    /**
     * Get cache statistics for debugging
     */
    getCacheStats(): { measurementCache: number; fontMetricsCache: number } {
        return {
            measurementCache: this.measurementCache.size,
            fontMetricsCache: this.fontMetricsCache.size,
        };
    }
}

/**
 * Global instance for easy access (will be initialized with document)
 */
export let globalTextMeasurement: AccurateTextMeasurementService | undefined =
    undefined;

/**
 * Initialize global text measurement service
 */
export function initializeGlobalTextMeasurement(fontSystem: FontSystem): void {
    globalTextMeasurement = new AccurateTextMeasurementService(fontSystem);
}

/**
 * Get global text measurement service (with error handling)
 */
export function getGlobalTextMeasurement(): AccurateTextMeasurementService {
    if (!globalTextMeasurement) {
        throw new Error(
            'Text measurement service not initialized. Call initializeGlobalTextMeasurement() first.'
        );
    }
    return globalTextMeasurement;
}
