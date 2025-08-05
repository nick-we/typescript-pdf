/**
 * Test Utilities
 *
 * Simple typed utilities for testing without complex mock interfaces
 */

import { TextDirection } from '@/core/text-utils.js';
import type { Layout } from '@/types.js';
import { Theme } from '@/types.js';

/**
 * Simple text measurement options for testing
 */
export interface TestTextOptions {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
}

/**
 * Simple text measurement service for testing
 */
export interface TestTextMeasurement {
    measureTextWidth: (
        text: string,
        fontSize: number,
        fontFamily?: string
    ) => number;
    wrapTextAccurate: (
        text: string,
        maxWidth: number,
        options: TestTextOptions
    ) => string[];
    truncateTextAccurate: (
        text: string,
        maxWidth: number,
        options: TestTextOptions,
        suffix?: string
    ) => string;
    getFontMetrics: (
        fontSize: number,
        fontFamily?: string
    ) => {
        height: number;
        baseline: number;
        ascender: number;
        descender: number;
    };
}

/**
 * Create a simple mock layout context for testing
 */
export function createTestLayoutContext(
    overrides: Partial<Layout.LayoutContext> = {}
): Layout.LayoutContext {
    const mockTextMeasurement: TestTextMeasurement = {
        measureTextWidth: (text: string, fontSize: number) => {
            return text.length * fontSize * 0.6;
        },
        wrapTextAccurate: (
            text: string,
            maxWidth: number,
            options: TestTextOptions
        ) => {
            const charWidth = options.fontSize * 0.6;
            const charsPerLine = Math.floor(maxWidth / charWidth);
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (testLine.length <= charsPerLine) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    currentLine = word;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        },
        truncateTextAccurate: (
            text: string,
            maxWidth: number,
            options: TestTextOptions,
            suffix = '...'
        ) => {
            const charWidth = options.fontSize * 0.6;
            const maxChars = Math.floor(maxWidth / charWidth) - suffix.length;
            return text.length > maxChars
                ? text.substring(0, maxChars) + suffix
                : text;
        },
        getFontMetrics: (fontSize: number) => ({
            height: fontSize * 1.2,
            baseline: fontSize * 0.8,
            ascender: fontSize * 0.8,
            descender: fontSize * 0.2,
        }),
    };

    const baseContext: Layout.LayoutContext = {
        constraints: {
            minWidth: 0,
            maxWidth: 600,
            minHeight: 0,
            maxHeight: 800,
        },
        textDirection: TextDirection.LeftToRight,
        theme: {
            colorScheme: Theme.ColorSchemes.light,
            spacing: Theme.defaultSpacing,
            defaultTextStyle: {
                fontSize: 12,
                fontFamily: 'Helvetica',
                color: '#000000',
            },
            cornerRadius: { none: 0, small: 4, medium: 8, large: 16 },
        } as Theme.ThemeData,
        textMeasurement: mockTextMeasurement as unknown as NonNullable<
            Layout.LayoutContext['textMeasurement']
        >,
    };

    // Handle optional properties properly for exactOptionalPropertyTypes
    const result = { ...baseContext };
    if (overrides.constraints !== undefined) {
        result.constraints = overrides.constraints;
    }
    if (overrides.textDirection !== undefined) {
        result.textDirection = overrides.textDirection;
    }
    if (overrides.theme !== undefined) {
        result.theme = overrides.theme;
    }
    if (overrides.textMeasurement !== undefined) {
        result.textMeasurement = overrides.textMeasurement;
    }

    return result;
}

/**
 * Create simple test paint context
 */
export function createTestPaintContext(
    overrides: Partial<Layout.PaintContext> = {}
): Layout.PaintContext {
    const mockGraphics = {
        drawString: () => {},
        drawRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
    };

    const mockTextMeasurement: TestTextMeasurement = {
        measureTextWidth: (text: string, fontSize: number) =>
            text.length * fontSize * 0.6,
        wrapTextAccurate: (
            text: string,
            maxWidth: number,
            options: TestTextOptions
        ) => {
            const charWidth = options.fontSize * 0.6;
            const charsPerLine = Math.floor(maxWidth / charWidth);
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (testLine.length <= charsPerLine) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    currentLine = word;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        },
        truncateTextAccurate: (
            text: string,
            maxWidth: number,
            options: TestTextOptions,
            suffix = '...'
        ) => {
            const charWidth = options.fontSize * 0.6;
            const maxChars = Math.floor(maxWidth / charWidth) - suffix.length;
            return text.length > maxChars
                ? text.substring(0, maxChars) + suffix
                : text;
        },
        getFontMetrics: (fontSize: number) => ({
            height: fontSize * 1.2,
            baseline: fontSize * 0.8,
            ascender: fontSize * 0.8,
            descender: fontSize * 0.2,
        }),
    };

    const baseContext: Layout.PaintContext = {
        size: { width: 600, height: 800 },
        graphics: mockGraphics as unknown as NonNullable<
            Layout.PaintContext['graphics']
        >,
        theme: {
            colorScheme: Theme.ColorSchemes.light,
            spacing: Theme.defaultSpacing,
            defaultTextStyle: {
                fontSize: 12,
                fontFamily: 'Helvetica',
                color: '#000000',
            },
            cornerRadius: { none: 0, small: 4, medium: 8, large: 16 },
        } as Theme.ThemeData,
        textMeasurement: mockTextMeasurement as unknown as NonNullable<
            Layout.LayoutContext['textMeasurement']
        >,
    };

    // Handle optional properties properly for exactOptionalPropertyTypes
    const result = { ...baseContext };
    if (overrides.size !== undefined) {
        result.size = overrides.size;
    }
    if (overrides.theme !== undefined) {
        result.theme = overrides.theme;
    }
    if (overrides.document !== undefined) {
        result.document = overrides.document;
    }
    if (overrides.graphics !== undefined) {
        result.graphics = overrides.graphics;
    }
    if (overrides.fontRegistry !== undefined) {
        result.fontRegistry = overrides.fontRegistry;
    }
    if (overrides.textMeasurement !== undefined) {
        result.textMeasurement = overrides.textMeasurement;
    }

    return result;
}

/**
 * Test page format type with proper typing
 */
export type TestPageFormat = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';

/**
 * Test orientation type
 */
export type TestOrientation = 'portrait' | 'landscape';

/**
 * Test alignment type
 */
export type TestAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Test axis alignment type
 */
export type TestAxisAlignment =
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';

/**
 * Test cross axis alignment type
 */
export type TestCrossAxisAlignment =
    | 'start'
    | 'center'
    | 'end'
    | 'stretch'
    | 'baseline';

/**
 * Test stack fit type
 */
export type TestStackFit = 'loose' | 'expand' | 'passthrough';

/**
 * Test chart marker type
 */
export type TestChartMarker = 'circle' | 'square' | 'triangle' | 'diamond';

/**
 * Test column width type
 */
export type TestColumnWidthType = 'fixed' | 'flex' | 'intrinsic' | 'fraction';

/**
 * Setup basic DOM mocks for Node.js testing
 */
export function setupTestDOM(): void {
    if (typeof global !== 'undefined' && typeof window === 'undefined') {
        (global as Record<string, unknown>)['window'] = {};
        (global as Record<string, unknown>)['document'] = {
            createElement: () => ({
                getContext: () => ({
                    fillText: () => {},
                    measureText: () => ({ width: 100 }),
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    stroke: () => {},
                    fill: () => {},
                }),
            }),
        };
    }
}
