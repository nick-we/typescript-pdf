/**
 * Internal type definitions for typescript-pdf
 * 
 * Contains interfaces and types used internally by the library
 * to replace `any` types with proper type safety.
 * 
 * @packageDocumentation
 */

import type { PdfColor } from '@/core/index.js';
import type { PdfFont } from '../core/pdf/font.js';
import type { PdfStandardFont } from '../core/pdf/font.js';
import type { Matrix4 } from '../core/pdf/graphics.js';

/**
 * Font registry interface for accessing fonts during layout and rendering
 */
export interface InternalFontRegistry {
    /**
     * Get a font by name
     */
    getFont(fontName: PdfStandardFont | string): PdfFontResource | undefined;

    /**
     * Register a font with the registry
     */
    registerFont(name: string, font: PdfFont): void;

    /**
     * Clear all registered fonts
     */
    clear(): void;

    /**
     * Get all registered font names
     */
    getRegisteredFontNames(): string[];
}

/**
 * Font resource for measurement and rendering
 */
export interface PdfFontResource {
    /** Font resource name for PDF */
    name: string;

    /** Font object */
    font?: PdfFont;

    /**
     * Measure text width
     */
    measureTextWidth(text: string, fontSize: number): number;

    /**
     * Get font ascender height
     */
    getAscender(fontSize: number): number;

    /**
     * Get font descender depth
     */
    getDescender(fontSize: number): number;

    /**
     * Get font line height
     */
    getLineHeight(fontSize: number): number;

    /**
     * Check if character is supported
     */
    supportsCharacter?(charCode: number): boolean;
}

/**
 * Matrix manipulation interface with safe value access
 */
export interface TransformMatrix {
    /** Matrix values array (16 elements for 4x4 matrix) */
    readonly values: readonly number[];

    /** Storage access for PDF operations */
    readonly storage: readonly number[];

    /**
     * Clone the matrix
     */
    clone(): TransformMatrix;

    /**
     * Multiply with another matrix
     */
    multiply(other: TransformMatrix): void;

    /**
     * Get a specific matrix value safely
     */
    getValue(index: number): number;

    /**
     * Set a specific matrix value safely
     */
    setValue(index: number, value: number): void;
}

/**
 * Extended Matrix4 that implements TransformMatrix interface
 */
export interface Matrix4Extended extends TransformMatrix {
    /** Matrix values - writable for internal operations */
    values: number[];
}

/**
 * Constraint system interface for type-safe constraint handling
 */
export interface ConstraintInfo {
    /** Minimum width constraint */
    minWidth: number;
    /** Maximum width constraint */
    maxWidth: number;
    /** Minimum height constraint */
    minHeight: number;
    /** Maximum height constraint */
    maxHeight: number;
    /** Whether constraints are tight (min === max) */
    isTight: boolean;
    /** Whether constraints allow infinite expansion */
    isUnbounded: boolean;
}

/**
 * Widget flex data interface
 */
export interface FlexData {
    /** Flex factor for layout expansion */
    flex: number;
    /** Fit behavior */
    fit?: 'tight' | 'loose';
}

/**
 * Widget with flex information
 */
export interface FlexibleWidget {
    /** Flex data if widget is flexible */
    flexData?: FlexData;
}

/**
 * Table cell data interface - supports both simple values and complex cell objects
 */
export type TableCellData =
    | string
    | number
    | boolean
    | null
    | undefined
    | {
        /** Cell content */
        value: string | number | boolean | null | undefined;
        /** Optional formatted display value */
        displayValue?: string;
        /** Optional cell metadata */
        metadata?: Record<string, unknown>;
    };

/**
 * Table row data - replaces `any[]`
 */
export type TableRowData = TableCellData[];

/**
 * Table data structure - replaces `any[][]`
 */
export type TableData = TableRowData[];

/**
 * Helper to extract the actual value from TableCellData
 */
export function getTableCellValue(cellData: TableCellData): string | number | boolean | null | undefined {
    if (cellData === null || cellData === undefined || typeof cellData === 'string' || typeof cellData === 'number' || typeof cellData === 'boolean') {
        return cellData;
    }
    return cellData.value;
}

/**
 * Helper to get display value from TableCellData
 */
export function getTableCellDisplayValue(cellData: TableCellData): string {
    if (cellData === null || cellData === undefined) {
        return '';
    }
    if (typeof cellData === 'string' || typeof cellData === 'number' || typeof cellData === 'boolean') {
        return String(cellData);
    }
    return cellData.displayValue ?? String(cellData.value);
}

/**
 * Generic object merger for type-safe property copying
 */
export interface ObjectMerger {
    /**
     * Merge source properties into target, only copying defined values
     */
    merge<T>(target: T, source: Partial<T>): T;

    /**
     * Deep merge objects with nested property support
     */
    deepMerge<T>(target: T, source: DeepPartial<T>): T;
}

/**
 * Deep partial type for nested object merging
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Widget constructor data for type-safe property assignment
 */
export interface WidgetConstructorData {
    /** Widget key */
    key?: string;
    /** Debug label */
    debugLabel?: string;
    /** Additional properties that may be set during construction */
    [propertyName: string]: unknown;
}

/**
 * Layout cache entry interface
 */
export interface LayoutCacheEntry<T = unknown> {
    /** Cached value */
    value: T;
    /** Cache timestamp */
    timestamp: number;
    /** Hash of the input that produced this value */
    inputHash: string;
    /** Size of the cached data */
    size: number;
}

/**
 * Performance monitoring interface
 */
export interface PerformanceStats {
    /** Operation name */
    operation: string;
    /** Number of times called */
    count: number;
    /** Total time spent */
    totalTime: number;
    /** Average time per call */
    averageTime: number;
    /** Maximum time for a single call */
    maxTime: number;
    /** Minimum time for a single call */
    minTime: number;
}

/**
 * Chart data interface to replace `any` in chart widgets
 */
export interface InternalChartDataPoint {
    /** X-axis value */
    x: number | string;
    /** Y-axis value */
    y: number;
    /** Optional label */
    label?: string;
    /** Optional color override */
    color?: PdfColor;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Chart series data
 */
export interface ChartSeries {
    /** Series name */
    name: string;
    /** Data points */
    data: InternalChartDataPoint[];
    /** Series color */
    color?: PdfColor;
    /** Series style options */
    style?: Record<string, unknown>;
}

/**
 * Mock object interface for tests
 */
export interface MockGraphicsContext {
    /** Recorded operations for verification */
    operations: string[];
    /** Mock implementation functions */
    [key: string]: unknown;
}

/**
 * Type-safe utilities for object manipulation
 */
export const TypeSafeUtils = {
    /**
     * Merge objects with type safety, only copying defined properties
     */
    mergeObjects<T>(target: T, source: Partial<T>): T {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key) && source[key] !== undefined) {
                // Use bracket notation for safer assignment
                (result as Record<string, unknown>)[key] = source[key];
            }
        }

        return result;
    },

    /**
     * Deep merge objects with nested support
     */
    deepMergeObjects<T>(target: T, source: DeepPartial<T>): T {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                const sourceValue = source[key];
                if (sourceValue !== undefined) {
                    if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {
                        (result as Record<string, unknown>)[key] = this.deepMergeObjects(
                            ((target as Record<string, unknown>)[key] as T) || {} as T,
                            sourceValue as DeepPartial<T>
                        );
                    } else {
                        (result as Record<string, unknown>)[key] = sourceValue;
                    }
                }
            }
        }

        return result;
    },

    /**
     * Check if an object has all required properties
     */
    hasRequiredProperties<T>(obj: Partial<T>, requiredKeys: (keyof T)[]): obj is T {
        return requiredKeys.every(key => obj[key] !== undefined);
    },

    /**
     * Create a hash from an object for caching
     */
    hashObject(obj: unknown): string {
        return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort())
            .split('')
            .reduce((hash, char) => {
                hash = ((hash << 5) - hash) + char.charCodeAt(0);
                return hash & hash; // Convert to 32-bit integer
            }, 0)
            .toString(36);
    }
};