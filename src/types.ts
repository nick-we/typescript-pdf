/**
 * Consolidated type definitions for typescript-pdf
 * All types organized into logical namespaces for better structure
 * and maintainability. This replaces 6 fragmented type files.
 *
 * @packageDocumentation
 */

import type {
    ITextMeasurementService,
    IDocument,
    IGraphicsContext,
    IFontSystem,
} from '@/types/core-interfaces.js';
import type { ChartMetadata, StyleMetadata } from '@/types/pdf-types';

//===========================================
// NAMESPACE: Core
//===========================================
export namespace Core {
    /**
     * Essential page formats (reduced from 20+ to 3 most common)
     */
    export enum PageFormat {
        A4 = 'A4',
        Letter = 'Letter',
        A3 = 'A3',
    }

    /**
     * Page orientation
     */
    export enum PageOrientation {
        Portrait = 'portrait',
        Landscape = 'landscape',
    }

    /**
     * Essential page options (simplified from complex PageOptions)
     */
    export interface PageOptions {
        format?: PageFormat;
        width?: number;
        height?: number;
        orientation?: PageOrientation;
        margin?: Layout.EdgeInsets;
        backgroundColor?: string;
        clip?: boolean;
    }

    /**
     * Essential document info (simplified from extensive DocumentInfo)
     */
    export interface DocumentInfo {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
        language?: string;
    }

    /**
     * PDF version enumeration
     */
    export enum PdfVersion {
        PDF_1_4 = '1.4',
        PDF_1_5 = '1.5',
        PDF_1_6 = '1.6',
        PDF_1_7 = '1.7',
    }

    /**
     * Page dimensions in points (essential formats only)
     */
    export const PageDimensions = {
        A4: { width: 595, height: 842 },
        Letter: { width: 612, height: 792 },
        A3: { width: 842, height: 1191 },
    } as const;

    /**
     * Page utilities (essential functions only)
     */
    export const Utils = {
        getDimensions(
            format: PageFormat,
            orientation: PageOrientation = PageOrientation.Portrait
        ): Geometry.Size {
            const size = PageDimensions[format];
            if (orientation === PageOrientation.Landscape) {
                return { width: size.height, height: size.width };
            }
            return size;
        },

        getContentArea(options: PageOptions): Geometry.Rect {
            const width = options.width ?? PageDimensions.A4.width;
            const height = options.height ?? PageDimensions.A4.height;
            const margin = options.margin ?? Layout.EdgeInsets.zero;

            return {
                x: margin.left,
                y: margin.top,
                width: width - margin.left - margin.right,
                height: height - margin.top - margin.bottom,
            };
        },
    };
}

//===========================================
// NAMESPACE: Geometry (Essential Only)
//===========================================
export namespace Geometry {
    /**
     * 2D point with x, y coordinates
     */
    export interface Point {
        readonly x: number;
        readonly y: number;
    }

    /**
     * 2D size with width and height dimensions
     */
    export interface Size {
        readonly width: number;
        readonly height: number;
    }

    /**
     * Rectangle defined by position and dimensions
     */
    export interface Rect {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    }

    /**
     * 2D transformation matrix (3x3 in homogeneous coordinates)
     */
    export interface Matrix {
        readonly a: number; // Horizontal scaling
        readonly b: number; // Vertical skewing
        readonly c: number; // Horizontal skewing
        readonly d: number; // Vertical scaling
        readonly e: number; // Horizontal translation
        readonly f: number; // Vertical translation
    }

    /**
     * Offset represents a 2D offset vector
     */
    export interface Offset {
        readonly dx: number;
        readonly dy: number;
    }

    /**
     * Essential geometry utilities (reduced from 20+ to 6 core functions)
     */
    export const Utils = {
        point: (x: number, y: number): Point => ({ x, y }),

        size: (width: number, height: number): Size => ({ width, height }),

        rect: (x: number, y: number, width: number, height: number): Rect => ({
            x,
            y,
            width,
            height,
        }),

        identityMatrix: (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),

        transformPoint: (point: Point, matrix: Matrix): Point => ({
            x: matrix.a * point.x + matrix.c * point.y + matrix.e,
            y: matrix.b * point.x + matrix.d * point.y + matrix.f,
        }),

        rectCenter: (rect: Rect): Point => ({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        }),

        distance: (point1: Point, point2: Point): number => {
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

        rectIntersection: (rect1: Rect, rect2: Rect): Rect | undefined => {
            const left = Math.max(rect1.x, rect2.x);
            const top = Math.max(rect1.y, rect2.y);
            const right = Math.min(
                rect1.x + rect1.width,
                rect2.x + rect2.width
            );
            const bottom = Math.min(
                rect1.y + rect1.height,
                rect2.y + rect2.height
            );

            if (left < right && top < bottom) {
                return {
                    x: left,
                    y: top,
                    width: right - left,
                    height: bottom - top,
                };
            }
            return undefined;
        },
    };
}

//===========================================
// NAMESPACE: Layout
//===========================================
export namespace Layout {
    /**
     * Box constraints define the minimum and maximum width and height
     * that a widget can occupy during layout.
     */
    export interface BoxConstraints {
        readonly minWidth: number;
        readonly maxWidth: number;
        readonly minHeight: number;
        readonly maxHeight: number;
    }

    /**
     * Helper functions for creating common BoxConstraints
     */
    export const BoxConstraints = {
        tight: (size: Geometry.Size): BoxConstraints => ({
            minWidth: size.width,
            maxWidth: size.width,
            minHeight: size.height,
            maxHeight: size.height,
        }),

        loose: (size: Geometry.Size): BoxConstraints => ({
            minWidth: 0,
            maxWidth: size.width,
            minHeight: 0,
            maxHeight: size.height,
        }),

        expand: (width?: number, height?: number): BoxConstraints => ({
            minWidth: width ?? 0,
            maxWidth: width ?? Number.POSITIVE_INFINITY,
            minHeight: height ?? 0,
            maxHeight: height ?? Number.POSITIVE_INFINITY,
        }),

        tightFor: (width?: number, height?: number): BoxConstraints => ({
            minWidth: width ?? 0,
            maxWidth: width ?? Number.POSITIVE_INFINITY,
            minHeight: height ?? 0,
            maxHeight: height ?? Number.POSITIVE_INFINITY,
        }),

        constrain: (
            constraints: BoxConstraints,
            size: Geometry.Size
        ): Geometry.Size => ({
            width: Math.max(
                constraints.minWidth,
                Math.min(constraints.maxWidth, size.width)
            ),
            height: Math.max(
                constraints.minHeight,
                Math.min(constraints.maxHeight, size.height)
            ),
        }),
    };

    /**
     * Edge insets for padding and margins
     */
    export interface EdgeInsets {
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
        readonly left: number;
    }

    /**
     * Helper functions for creating EdgeInsets
     */
    export const EdgeInsets = {
        all: (value: number): EdgeInsets => ({
            top: value,
            right: value,
            bottom: value,
            left: value,
        }),

        symmetric: (options: {
            horizontal?: number;
            vertical?: number;
        }): EdgeInsets => ({
            top: options.vertical ?? 0,
            bottom: options.vertical ?? 0,
            left: options.horizontal ?? 0,
            right: options.horizontal ?? 0,
        }),

        only: (options: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        }): EdgeInsets => ({
            top: options.top ?? 0,
            right: options.right ?? 0,
            bottom: options.bottom ?? 0,
            left: options.left ?? 0,
        }),

        zero: { top: 0, right: 0, bottom: 0, left: 0 } as EdgeInsets,

        horizontal: (insets: EdgeInsets): number => insets.left + insets.right,

        vertical: (insets: EdgeInsets): number => insets.top + insets.bottom,

        deflateSize: (
            insets: EdgeInsets,
            size: Geometry.Size
        ): Geometry.Size => ({
            width: Math.max(0, size.width - EdgeInsets.horizontal(insets)),
            height: Math.max(0, size.height - EdgeInsets.vertical(insets)),
        }),

        deflateConstraints: (
            insets: EdgeInsets,
            constraints: BoxConstraints
        ): BoxConstraints => {
            const horizontal = EdgeInsets.horizontal(insets);
            const vertical = EdgeInsets.vertical(insets);
            return {
                minWidth: Math.max(0, constraints.minWidth - horizontal),
                maxWidth: Math.max(0, constraints.maxWidth - horizontal),
                minHeight: Math.max(0, constraints.minHeight - vertical),
                maxHeight: Math.max(0, constraints.maxHeight - vertical),
            };
        },
    };

    /**
     * Alignment options for positioning within available space
     */
    export enum Alignment {
        TopLeft = 'topLeft',
        TopCenter = 'topCenter',
        TopRight = 'topRight',
        CenterLeft = 'centerLeft',
        Center = 'center',
        CenterRight = 'centerRight',
        BottomLeft = 'bottomLeft',
        BottomCenter = 'bottomCenter',
        BottomRight = 'bottomRight',
    }

    /**
     * Helper functions for alignment calculations
     */
    export const AlignmentUtils = {
        resolve: (
            alignment: Alignment,
            containerSize: Geometry.Size,
            childSize: Geometry.Size
        ): Geometry.Point => {
            const xOffset = containerSize.width - childSize.width;
            const yOffset = containerSize.height - childSize.height;

            switch (alignment) {
                case Alignment.TopLeft:
                    return { x: 0, y: 0 };
                case Alignment.TopCenter:
                    return { x: xOffset / 2, y: 0 };
                case Alignment.TopRight:
                    return { x: xOffset, y: 0 };
                case Alignment.CenterLeft:
                    return { x: 0, y: yOffset / 2 };
                case Alignment.Center:
                    return { x: xOffset / 2, y: yOffset / 2 };
                case Alignment.CenterRight:
                    return { x: xOffset, y: yOffset / 2 };
                case Alignment.BottomLeft:
                    return { x: 0, y: yOffset };
                case Alignment.BottomCenter:
                    return { x: xOffset / 2, y: yOffset };
                case Alignment.BottomRight:
                    return { x: xOffset, y: yOffset };
                default:
                    return { x: 0, y: 0 };
            }
        },
    };

    /**
     * Layout context provides environmental information during layout
     */
    export interface LayoutContext {
        readonly constraints: BoxConstraints;
        readonly textDirection: 'ltr' | 'rtl';
        readonly theme: Theme.ThemeData;
        readonly textMeasurement?: ITextMeasurementService;
    }

    /**
     * Result of a layout operation
     */
    export interface LayoutResult {
        readonly size: Geometry.Size;
        readonly baseline?: number;
        readonly needsRepaint: boolean;
    }

    /**
     * Paint context provides information needed for painting
     */
    export interface PaintContext {
        readonly size: Geometry.Size;
        readonly theme: Theme.ThemeData;
        readonly document?: IDocument;
        readonly graphics?: IGraphicsContext;
        readonly fontRegistry?: IFontSystem;
        readonly textMeasurement?: ITextMeasurementService;
    }
}

//===========================================
// NAMESPACE: Flex
//===========================================
export namespace Flex {
    /**
     * Direction of the main axis in a flex layout
     */
    export enum Axis {
        Horizontal = 'horizontal',
        Vertical = 'vertical',
    }

    /**
     * How children should be aligned along the main axis
     */
    export enum MainAxisAlignment {
        Start = 'start',
        End = 'end',
        Center = 'center',
        SpaceBetween = 'spaceBetween',
        SpaceAround = 'spaceAround',
        SpaceEvenly = 'spaceEvenly',
    }

    /**
     * How children should be aligned along the cross axis
     */
    export enum CrossAxisAlignment {
        Start = 'start',
        End = 'end',
        Center = 'center',
        Stretch = 'stretch',
        Baseline = 'baseline',
    }

    /**
     * Direction of vertical axis layout
     */
    export enum VerticalDirection {
        Down = 'down',
        Up = 'up',
    }

    /**
     * How much space the flex container should occupy along the main axis
     */
    export enum MainAxisSize {
        Min = 'min',
        Max = 'max',
    }

    /**
     * How a flex child should fit within the available space
     */
    export enum FlexFit {
        Loose = 'loose',
        Tight = 'tight',
    }

    /**
     * Flex child data for widgets that participate in flex layout
     */
    export interface FlexChildData {
        flex?: number;
        fit?: FlexFit;
    }

    /**
     * Configuration for spacing between flex children
     */
    export interface FlexSpacing {
        mainAxisSpacing?: number;
        crossAxisSpacing?: number;
    }

    /**
     * Essential flex utilities (simplified from complex calculations)
     */
    export const Utils = {
        getMainAxisSize: (size: Geometry.Size, axis: Axis): number => {
            return axis === Axis.Horizontal ? size.width : size.height;
        },

        getCrossAxisSize: (size: Geometry.Size, axis: Axis): number => {
            return axis === Axis.Horizontal ? size.height : size.width;
        },

        createSize: (
            mainAxisSize: number,
            crossAxisSize: number,
            axis: Axis
        ): Geometry.Size => {
            return axis === Axis.Horizontal
                ? { width: mainAxisSize, height: crossAxisSize }
                : { width: crossAxisSize, height: mainAxisSize };
        },
    };
}

//===========================================
// NAMESPACE: Theme
//===========================================
export namespace Theme {
    /**
     * Font weight enumeration
     */
    export enum FontWeight {
        Normal = 400,
        Bold = 700,
    }

    /**
     * Font style enumeration
     */
    export enum FontStyle {
        Normal = 'normal',
        Italic = 'italic',
    }

    /**
     * Text decoration style
     */
    export enum TextDecorationStyle {
        Solid = 'solid',
        Dashed = 'dashed',
        Dotted = 'dotted',
    }

    /**
     * Text style configuration (simplified from complex TextStyle)
     */
    export interface TextStyle {
        inherit?: boolean;
        color?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: FontWeight;
        fontStyle?: FontStyle;
        letterSpacing?: number;
        wordSpacing?: number;
        lineSpacing?: number;
        decoration?: {
            underline?: boolean;
            overline?: boolean;
            strikethrough?: boolean;
            color?: string;
            style?: TextDecorationStyle;
        };
    }

    /**
     * Color palette for consistent theming
     */
    export interface ColorScheme {
        readonly primary: string;
        readonly secondary: string;
        readonly background: string;
        readonly surface: string;
        readonly onBackground: string;
        readonly onSurface: string;
        readonly onPrimary: string;
        readonly onSecondary: string;
        readonly error: string;
        readonly success: string;
        readonly warning: string;
        readonly info: string;
    }

    /**
     * Spacing system for consistent layouts
     */
    export interface SpacingSystem {
        readonly xs: number; // 2pt
        readonly sm: number; // 4pt
        readonly md: number; // 8pt
        readonly lg: number; // 16pt
        readonly xl: number; // 24pt
        readonly xxl: number; // 32pt
    }

    /**
     * Comprehensive theme data (simplified from complex ThemeData)
     */
    export interface ThemeData {
        readonly colorScheme: ColorScheme;
        readonly spacing: SpacingSystem;
        readonly defaultTextStyle: TextStyle;
        readonly cornerRadius: {
            readonly none: number;
            readonly small: number;
            readonly medium: number;
            readonly large: number;
        };
    }

    /**
     * Default color schemes
     */
    export const ColorSchemes = {
        light: {
            primary: '#1976d2',
            secondary: '#dc004e',
            background: '#ffffff',
            surface: '#f5f5f5',
            onBackground: '#000000',
            onSurface: '#000000',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#d32f2f',
            success: '#388e3c',
            warning: '#f57c00',
            info: '#1976d2',
        } as ColorScheme,

        professional: {
            primary: '#2c3e50',
            secondary: '#34495e',
            background: '#ffffff',
            surface: '#f8f9fa',
            onBackground: '#2c3e50',
            onSurface: '#2c3e50',
            onPrimary: '#ffffff',
            onSecondary: '#ffffff',
            error: '#e74c3c',
            success: '#27ae60',
            warning: '#f39c12',
            info: '#3498db',
        } as ColorScheme,
    };

    /**
     * Default spacing system
     */
    export const defaultSpacing: SpacingSystem = {
        xs: 2,
        sm: 4,
        md: 8,
        lg: 16,
        xl: 24,
        xxl: 32,
    };

    /**
     * Theme creation utilities (simplified from complex ThemeUtils)
     */
    export const Utils = {
        createTheme: (
            colorScheme: ColorScheme = ColorSchemes.light
        ): ThemeData => ({
            colorScheme,
            spacing: defaultSpacing,
            defaultTextStyle: {
                fontSize: 12,
                color: colorScheme.onBackground,
                fontFamily: 'Helvetica',
                fontWeight: FontWeight.Normal,
                fontStyle: FontStyle.Normal,
            },
            cornerRadius: { none: 0, small: 4, medium: 8, large: 16 },
        }),

        light: (): ThemeData => Utils.createTheme(ColorSchemes.light),

        professional: (): ThemeData =>
            Utils.createTheme(ColorSchemes.professional),

        mergeTextStyles: (base: TextStyle, override?: TextStyle): TextStyle => {
            if (!override) {
                return base;
            }

            // Only skip merging if explicitly set to not inherit
            if (override.inherit === false) {
                return override;
            }

            const result: TextStyle = {
                ...base,
                ...override,
            };

            // Ensure fontFamily is preserved from base if not in override
            if (!override.fontFamily && base.fontFamily) {
                result.fontFamily = base.fontFamily;
            }

            // Handle decoration merging carefully
            if (override.decoration && base.decoration) {
                result.decoration = {
                    ...base.decoration,
                    ...override.decoration,
                };
            } else if (override.decoration) {
                result.decoration = override.decoration;
            } else if (base.decoration) {
                result.decoration = base.decoration;
            }

            return result;
        },
    };
}

//===========================================
// NAMESPACE: Internal (Type Safety)
//===========================================
export namespace Internal {
    /**
     * Table cell data interface
     */
    export type TableCellData =
        | string
        | number
        | boolean
        | null
        | undefined
        | {
              value: string | number | boolean | null | undefined;
              displayValue?: string;
              metadata?: ChartMetadata;
          };

    /**
     * Table row data
     */
    export type TableRowData = TableCellData[];

    /**
     * Table data structure
     */
    export type TableData = TableRowData[];

    /**
     * Chart data interface
     */
    export interface ChartDataPoint {
        x: number | string;
        y: number;
        label?: string;
        color?: string;
        metadata?: ChartMetadata;
    }

    /**
     * Chart series data
     */
    export interface ChartSeries {
        name: string;
        data: ChartDataPoint[];
        color?: string;
        style?: StyleMetadata;
    }

    /**
     * Performance monitoring interface
     */
    export interface PerformanceStats {
        operation: string;
        count: number;
        totalTime: number;
        averageTime: number;
        maxTime: number;
        minTime: number;
    }

    /**
     * Layout cache entry interface
     */
    export interface LayoutCacheEntry<T = unknown> {
        value: T;
        timestamp: number;
        inputHash: string;
        size: number;
    }

    /**
     * Type-safe utility functions (simplified from complex TypeSafeUtils)
     */
    export const Utils = {
        mergeObjects: <T>(target: T, source: Partial<T>): T => {
            const result = { ...target };
            for (const key in source) {
                if (
                    Object.prototype.hasOwnProperty.call(source, key) &&
                    source[key] !== undefined
                ) {
                    (result as Record<string, unknown>)[key] = source[key];
                }
            }
            return result;
        },

        hashObject: (obj: object): string => {
            const objAsRecord = obj as Record<string, unknown>;
            return JSON.stringify(obj, Object.keys(objAsRecord).sort())
                .split('')
                .reduce((hash, char) => {
                    hash = (hash << 5) - hash + char.charCodeAt(0);
                    return hash & hash;
                }, 0)
                .toString(36);
        },

        getTableCellValue: (
            cellData: TableCellData
        ): string | number | boolean | null | undefined => {
            if (
                cellData === null ||
                cellData === undefined ||
                typeof cellData === 'string' ||
                typeof cellData === 'number' ||
                typeof cellData === 'boolean'
            ) {
                return cellData;
            }
            return cellData.value;
        },

        getTableCellDisplayValue: (cellData: TableCellData): string => {
            if (cellData === null || cellData === undefined) {
                return '';
            }
            if (
                typeof cellData === 'string' ||
                typeof cellData === 'number' ||
                typeof cellData === 'boolean'
            ) {
                return String(cellData);
            }
            return cellData.displayValue ?? String(cellData.value);
        },
    };
}

//===========================================
// Default exports for convenience
//===========================================

/**
 * Default theme instance
 */
export const defaultTheme = Theme.Utils.light();

/**
 * Common alignments for quick access
 */
export const Alignments = Layout.Alignment;

/**
 * Font weights for quick access
 */
export const FontWeights = Theme.FontWeight;

/**
 * Font styles for quick access
 */
export const FontStyles = Theme.FontStyle;

/**
 * Default constants for backward compatibility
 */
export const DEFAULT_PAGE_FORMAT = Core.PageFormat.A4;
export const DEFAULT_PDF_VERSION = Core.PdfVersion.PDF_1_4;

/**
 * Page formats for backward compatibility
 */
export const PageFormats = Core.PageFormat;
