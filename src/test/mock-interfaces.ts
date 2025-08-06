/**
 * Mock Interfaces for Testing
 *
 * Provides properly typed mock interfaces to replace `any` types in tests
 * while maintaining flexibility for test scenarios.
 */

import type {
    ITextMeasurementService,
    IGraphicsContext,
    IFontSystem,
    ITextMeasurementOptions,
    FontWeight,
    FontStyle,
} from '@/types/core-interfaces.js';
import type {
    IFontLoader,
    IFontStats,
    IPage,
    IPdfFont,
} from '@/types/pdf-types';
import { Layout, Theme, type Geometry } from '@/types.js';
import type { Widget } from '@/widgets';

/**
 * Mock Text Measurement Service Interface
 * Compatible with ITextMeasurementService but simplified for testing
 */
export interface MockTextMeasurementService {
    measureTextWidth: (
        text: string,
        fontSize: number,
        fontFamily?: string
    ) => number;
    measureCharWidth: (
        char: string,
        fontSize: number,
        fontFamily?: string
    ) => number;
    wrapTextAccurate: (
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ) => string[];
    truncateTextAccurate: (
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions,
        suffix?: string
    ) => string;
    getFontMetrics: (fontSize: number, fontFamily?: string) => FontMetrics;
    // Required methods from ITextMeasurementService
    measureTextWithWrapping: (
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ) => {
        width: number;
        height: number;
        baseline: number;
        lineCount: number;
        actualLines?: string[];
    };
    getTextBounds: (
        text: string,
        maxWidth: number,
        options: ITextMeasurementOptions
    ) => Geometry.Size;
    clearCache?: () => void;
    getCacheStats?: () => {
        measurementCache: number;
        fontMetricsCache: number;
    };
}

/**
 * Font metrics interface
 */
export interface FontMetrics {
    height: number;
    baseline: number;
    ascender: number;
    descender: number;
}

/**
 * Mock Graphics Context Interface
 * Compatible with IGraphicsContext but simplified for testing
 */
export interface MockGraphicsContext {
    // State management
    save: () => void;
    restore: () => void;
    saveContext: () => void;
    restoreContext: () => void;

    // Colors
    setFillColor: (color: { red: number; green: number; blue: number }) => void;
    setStrokeColor: (color: {
        red: number;
        green: number;
        blue: number;
    }) => void;

    // Line properties
    setLineWidth: (width: number) => void;
    setLineDash: (dashArray: number[], dashPhase?: number) => void;

    // Clipping
    setClippingRect: (
        x: number,
        y: number,
        width: number,
        height: number
    ) => void;
    clearClipping: () => void;

    // Path operations
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    curveTo: (
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        x: number,
        y: number
    ) => void;
    closePath: () => void;

    // Drawing operations
    drawRect: (x: number, y: number, width: number, height: number) => void;
    drawRoundedRect: (
        x: number,
        y: number,
        width: number,
        height: number,
        topLeft?: number,
        topRight?: number,
        bottomRight?: number,
        bottomLeft?: number
    ) => void;

    // Path rendering
    fillPath: () => void;
    strokePath: () => void;
    fillAndStrokePath: () => void;

    // Text rendering
    drawString: (
        font: IPdfFont,
        fontSize: number,
        text: string,
        x: number,
        y: number
    ) => void;
    setFont: (font: IPdfFont, fontSize: number) => void;

    // Transformations
    transform: (
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number
    ) => void;
    translate: (x: number, y: number) => void;
    scale: (sx: number, sy: number) => void;
    rotate: (angle: number) => void;

    // Content management
    getContent: () => string;
    clear: () => void;

    // Extended properties for compatibility
    readonly currentPoint: { x: number; y: number };
    readonly matrix: number[];
    readonly fontRegistry: IFontSystem | undefined;

    // Legacy compatibility methods
    setColor?: (color: string | { r: number; g: number; b: number }) => void;
    drawLine?: (x1: number, y1: number, x2: number, y2: number) => void;
}

/**
 * Mock Document Interface
 * Compatible with IDocument but simplified for testing
 */
export interface MockDocument {
    addPage: (options?: PageOptions) => MockPage;
    save: () => Uint8Array;
    getPages: () => MockPage[];
    fontSystem: MockFontSystem;
    getPageCount: () => number;
    getStats: () => { pageCount: number; fontStats: IFontStats };
}

/**
 * Mock Page Interface
 */
export interface MockPage extends IPage {
    readonly size: Geometry.Size;
    readonly margins: Layout.EdgeInsets;
    readonly format?: string;
    readonly orientation?: 'portrait' | 'landscape';
    renderWidget: (widget: Widget) => void;
    getGraphicsContext: () => IGraphicsContext;
}

/**
 * Page options for mock document
 */
export interface PageOptions {
    format?: string;
    size?: Geometry.Size;
    margins?: Layout.EdgeInsets;
    orientation?: 'portrait' | 'landscape';
}

/**
 * Mock Font System Interface
 */
export interface MockFontSystem {
    getFont: (fontNameOrFamily: string, name?: string) => MockFont;
    getFontWithStyle: (
        family: string | string[],
        weight?: FontWeight,
        style?: FontStyle
    ) => MockFont;
    registerFont: (fontFamily: string, fontData: Uint8Array) => void;
    getDefaultFont: () => MockFont;
    getFontNames: () => string[];
    getStats: () => {
        standardFonts: number;
        customFonts: number;
        totalFonts: number;
        fontLoader: IFontLoader;
    };
}

/**
 * Helper function to create a mock IPdfFont
 */
function createMockPdfFont(name: string, _fontFamily: string): IPdfFont {
    return {
        name,
        fontName: name,
        type: 'standard' as const,
        measureTextWidth: (text: string, fontSize: number) =>
            text.length * fontSize * 0.6,
        getFontHeight: (fontSize: number) => fontSize * 1.2,
        getAscender: (fontSize: number) => fontSize * 0.8,
        getDescender: (fontSize: number) => fontSize * 0.2,
        getPdfFontName: () => name,
        ref: () => `${name}-ref`,
        getId: () => 1,
    };
}

/**
 * Mock Font Interface
 */
export interface MockFont {
    name: string;
    fontFamily: string;
    type: 'standard' | 'ttf';
    fontWeight?: string;
    fontStyle?: string;
    measureText?: (
        text: string,
        fontSize: number
    ) => { width: number; height: number };
    measureTextWidth: (text: string, fontSize: number) => number;
    getFontHeight: (fontSize: number) => number;
    getAscender: (fontSize: number) => number;
    getDescender: (fontSize: number) => number;
    getUnderlyingFont: () => IPdfFont;
}

/**
 * Mock Layout Context Factory
 */
export function createMockLayoutContext(
    overrides: Partial<Layout.LayoutContext> = {}
): Layout.LayoutContext {
    return {
        constraints: {
            minWidth: 0,
            maxWidth: 600,
            minHeight: 0,
            maxHeight: 800,
        },
        textDirection: 'ltr' as const,
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
        textMeasurement:
            createMockTextMeasurementService() as unknown as ITextMeasurementService,
        ...overrides,
    };
}
/**
 * Mock PDF Page Factory
 */
export function createMockPdfPage(options: Partial<MockPage> = {}): MockPage {
    return {
        size: { width: 600, height: 800 },
        margins: Layout.EdgeInsets.all(20),
        renderWidget: (_widget: Widget) => {
            /* Mock implementation */
        },
        getGraphicsContext: () =>
            createMockGraphicsContext() as IGraphicsContext,
        ...options,
    };
}

/**
 * Mock Paint Context Factory
 */
export function createMockPaintContext(
    overrides: Partial<Layout.PaintContext> = {}
): Layout.PaintContext {
    return {
        size: { width: 600, height: 800 },
        graphics: createMockGraphicsContext() as IGraphicsContext,
        fontRegistry: createMockFontSystem() as IFontSystem,
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
        textMeasurement:
            createMockTextMeasurementService() as unknown as ITextMeasurementService,
        ...overrides,
    };
}

/**
 * Mock Text Measurement Service Factory
 */
export function createMockTextMeasurementService(
    options: Partial<MockTextMeasurementService> = {}
): MockTextMeasurementService {
    return {
        measureTextWidth: (text: string, fontSize: number) => {
            return text.length * fontSize * 0.6; // More accurate than default 0.55
        },

        measureCharWidth: (char: string, fontSize: number) => {
            return fontSize * 0.6;
        },

        wrapTextAccurate: (
            text: string,
            maxWidth: number,
            options: ITextMeasurementOptions
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
            options: ITextMeasurementOptions,
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

        // Required methods from ITextMeasurementService
        measureTextWithWrapping: (
            text: string,
            maxWidth: number,
            options: ITextMeasurementOptions
        ) => ({
            width: Math.min(text.length * options.fontSize * 0.6, maxWidth),
            height: options.fontSize * 1.2,
            baseline: options.fontSize * 0.8,
            lineCount:
                Math.ceil((text.length * options.fontSize * 0.6) / maxWidth) ||
                1,
            actualLines: [text], // Simplified for mock
        }),

        getTextBounds: (
            text: string,
            maxWidth: number,
            options: ITextMeasurementOptions
        ) => ({
            width: Math.min(text.length * options.fontSize * 0.6, maxWidth),
            height: options.fontSize * 1.2,
        }),

        clearCache: () => {
            // Mock implementation
        },

        getCacheStats: () => ({
            measurementCache: 0,
            fontMetricsCache: 0,
        }),

        ...options,
    };
}

/**
 * Mock Graphics Context Factory
 */
export function createMockGraphicsContext(
    options: Partial<MockGraphicsContext> = {}
): MockGraphicsContext {
    return {
        // State management
        save: () => {
            /* Mock implementation */
        },
        restore: () => {
            /* Mock implementation */
        },
        saveContext: () => {
            /* Mock implementation */
        },
        restoreContext: () => {
            /* Mock implementation */
        },

        // Colors
        setFillColor: (_color: {
            red: number;
            green: number;
            blue: number;
        }) => {
            /* Mock implementation */
        },
        setStrokeColor: (_color: {
            red: number;
            green: number;
            blue: number;
        }) => {
            /* Mock implementation */
        },

        // Line properties
        setLineWidth: (_width: number) => {
            /* Mock implementation */
        },
        setLineDash: (_dashArray: number[], _dashPhase?: number) => {
            /* Mock implementation */
        },

        // Clipping
        setClippingRect: (
            _x: number,
            _y: number,
            _width: number,
            _height: number
        ) => {
            /* Mock implementation */
        },
        clearClipping: () => {
            /* Mock implementation */
        },

        // Path operations
        moveTo: (_x: number, _y: number) => {
            /* Mock implementation */
        },
        lineTo: (_x: number, _y: number) => {
            /* Mock implementation */
        },
        curveTo: (
            _cp1x: number,
            _cp1y: number,
            _cp2x: number,
            _cp2y: number,
            _x: number,
            _y: number
        ) => {
            /* Mock implementation */
        },
        closePath: () => {
            /* Mock implementation */
        },

        // Drawing operations
        drawRect: (_x: number, _y: number, _width: number, _height: number) => {
            /* Mock implementation */
        },
        drawRoundedRect: (
            _x: number,
            _y: number,
            _width: number,
            _height: number,
            _topLeft?: number,
            _topRight?: number,
            _bottomRight?: number,
            _bottomLeft?: number
        ) => {
            /* Mock implementation */
        },

        // Path rendering
        fillPath: () => {
            /* Mock implementation */
        },
        strokePath: () => {
            /* Mock implementation */
        },
        fillAndStrokePath: () => {
            /* Mock implementation */
        },

        // Text rendering
        drawString: (
            _font: IPdfFont,
            _fontSize: number,
            _text: string,
            _x: number,
            _y: number
        ) => {
            /* Mock implementation */
        },
        setFont: (_font: IPdfFont, _fontSize: number) => {
            /* Mock implementation */
        },

        // Transformations
        transform: (
            _a: number,
            _b: number,
            _c: number,
            _d: number,
            _e: number,
            _f: number
        ) => {
            /* Mock implementation */
        },
        translate: (_x: number, _y: number) => {
            /* Mock implementation */
        },
        scale: (_sx: number, _sy: number) => {
            /* Mock implementation */
        },
        rotate: (_angle: number) => {
            /* Mock implementation */
        },

        // Content management
        getContent: () => 'mock content',
        clear: () => {
            /* Mock implementation */
        },

        // Extended properties for compatibility
        currentPoint: { x: 0, y: 0 },
        matrix: [1, 0, 0, 1, 0, 0],
        fontRegistry: undefined as IFontSystem | undefined,

        // Legacy compatibility methods
        setColor: (_color: string | { r: number; g: number; b: number }) => {
            /* Mock implementation */
        },
        drawLine: (_x1: number, _y1: number, _x2: number, _y2: number) => {
            /* Mock implementation */
        },

        ...options,
    };
}

/**
 * Mock Document Factory
 */
export function createMockDocument(
    options: Partial<MockDocument> = {}
): MockDocument {
    const pages: MockPage[] = [];

    return {
        addPage: (pageOptions?: PageOptions) => {
            const page: MockPage = {
                size: pageOptions?.size ?? { width: 595, height: 842 }, // A4 default
                margins: pageOptions?.margins ?? Layout.EdgeInsets.all(20),
                ...(pageOptions?.format && { format: pageOptions.format }),
                ...(pageOptions?.orientation && {
                    orientation: pageOptions.orientation,
                }),
                renderWidget: (_widget: Widget) => {
                    /* Mock implementation */
                },
                getGraphicsContext: () =>
                    createMockGraphicsContext() as IGraphicsContext,
            };
            pages.push(page);
            return page;
        },
        fontSystem: createMockFontSystem(),
        getPageCount: () => pages.length,
        getStats: () => ({
            pageCount: pages.length,
            fontStats: {
                standardFonts: 3,
                customFonts: 0,
                totalFonts: 3,
                fontLoader: {
                    fontsLoaded: 0,
                    fontsCached: 0,
                    cacheSize: 0,
                    hitRate: 0,
                },
            } as IFontStats,
        }),
        save: () => new Uint8Array(0),
        getPages: () => [...pages],
        ...options,
    };
}

/**
 * Mock Font System Factory
 */
export function createMockFontSystem(
    options: Partial<MockFontSystem> = {}
): MockFontSystem {
    const fonts = new Map<string, MockFont>();

    return {
        getFont: (fontNameOrFamily: string, _name?: string) => {
            return (
                fonts.get(fontNameOrFamily) ?? {
                    name: fontNameOrFamily,
                    fontFamily: fontNameOrFamily,
                    type: 'standard' as const,
                    measureText: (text: string, fontSize: number) => ({
                        width: text.length * fontSize * 0.6,
                        height: fontSize * 1.2,
                    }),
                    measureTextWidth: (text: string, fontSize: number) =>
                        text.length * fontSize * 0.6,
                    getFontHeight: (fontSize: number) => fontSize * 1.2,
                    getAscender: (fontSize: number) => fontSize * 0.8,
                    getDescender: (fontSize: number) => fontSize * 0.2,
                    getUnderlyingFont: () =>
                        createMockPdfFont(fontNameOrFamily, fontNameOrFamily),
                }
            );
        },
        getFontWithStyle: (
            family: string | string[],
            weight?: FontWeight,
            style?: FontStyle
        ) => {
            const fontFamily = Array.isArray(family)
                ? (family[0] ?? 'Helvetica')
                : family;
            const weightStr = weight ? weight.toString() : 'normal';
            const styleStr = style ?? 'normal';
            const key = `${fontFamily}-${weightStr}-${styleStr}`;
            return (
                fonts.get(key) ?? {
                    name: `${fontFamily}-${weightStr}-${styleStr}`,
                    fontFamily: fontFamily,
                    type: 'standard' as const,
                    fontWeight: weightStr,
                    fontStyle: styleStr,
                    measureText: (text: string, fontSize: number) => ({
                        width: text.length * fontSize * 0.6,
                        height: fontSize * 1.2,
                    }),
                    measureTextWidth: (text: string, fontSize: number) =>
                        text.length * fontSize * 0.6,
                    getFontHeight: (fontSize: number) => fontSize * 1.2,
                    getAscender: (fontSize: number) => fontSize * 0.8,
                    getDescender: (fontSize: number) => fontSize * 0.2,
                    getUnderlyingFont: () =>
                        createMockPdfFont(fontFamily, fontFamily),
                }
            );
        },
        registerFont: (fontFamily: string, _fontData: Uint8Array) => {
            fonts.set(fontFamily, {
                name: fontFamily,
                fontFamily,
                type: 'ttf' as const,
                measureText: (text: string, fontSize: number) => ({
                    width: text.length * fontSize * 0.6,
                    height: fontSize * 1.2,
                }),
                measureTextWidth: (text: string, fontSize: number) =>
                    text.length * fontSize * 0.6,
                getFontHeight: (fontSize: number) => fontSize * 1.2,
                getAscender: (fontSize: number) => fontSize * 0.8,
                getDescender: (fontSize: number) => fontSize * 0.2,
                getUnderlyingFont: () =>
                    createMockPdfFont(fontFamily, fontFamily),
            });
        },
        getDefaultFont: () => ({
            name: 'Helvetica',
            fontFamily: 'Helvetica',
            type: 'standard' as const,
            measureText: (text: string, fontSize: number) => ({
                width: text.length * fontSize * 0.6,
                height: fontSize * 1.2,
            }),
            measureTextWidth: (text: string, fontSize: number) =>
                text.length * fontSize * 0.6,
            getFontHeight: (fontSize: number) => fontSize * 1.2,
            getAscender: (fontSize: number) => fontSize * 0.8,
            getDescender: (fontSize: number) => fontSize * 0.2,
            getUnderlyingFont: () =>
                createMockPdfFont('Helvetica', 'Helvetica'),
        }),
        getFontNames: () => ['Helvetica', 'Times-Roman', 'Courier'],
        getStats: () => ({
            standardFonts: 3,
            customFonts: fonts.size,
            totalFonts: 3 + fonts.size,
            fontLoader: {
                fontsLoaded: 0,
                fontsCached: 0,
                cacheSize: 0,
                hitRate: 0,
            },
        }),
        ...options,
    };
}

/**
 * DOM Mock Interfaces for Node.js Testing
 */
export interface MockCanvasContext {
    fillText: (text: string, x: number, y: number) => void;
    measureText: (text: string) => { width: number };
    beginPath: () => void;
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    stroke: () => void;
    fill: () => void;
}

export interface MockCanvasElement {
    getContext: (type: string) => MockCanvasContext;
}

// Remove duplicate MockDocument interface - it's already defined above

export interface MockWindow {
    [key: string]: unknown;
}

/**
 * Global DOM Mock Setup
 */
export function setupDOMMocks(): void {
    if (typeof global !== 'undefined' && typeof window === 'undefined') {
        // Type-safe global DOM mocks
        const mockWindow: MockWindow = {};
        const mockDocument = {
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

        // Use Record<string, unknown> for global assignment with proper typing
        (global as Record<string, unknown>)['window'] = mockWindow;
        (global as Record<string, unknown>)['document'] = mockDocument;
    }
}
