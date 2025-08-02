/**
 * Layout system types for constraint-based layout
 * 
 * Implements Flutter-style constraint-based layout system where:
 * - Parent provides constraints to child
 * - Child reports its size back to parent
 * - Parent then positions the child
 * 
 * @packageDocumentation
 */

import type { Point, Size, Rect } from './geometry.js';
import type { PdfGraphics } from '../core/pdf/graphics.js';

/**
 * Box constraints define the minimum and maximum width and height
 * that a widget can occupy during layout.
 */
export interface BoxConstraints {
    /** Minimum width in points */
    readonly minWidth: number;
    /** Maximum width in points */
    readonly maxWidth: number;
    /** Minimum height in points */
    readonly minHeight: number;
    /** Maximum height in points */
    readonly maxHeight: number;
}

/**
 * Helper functions for creating common BoxConstraints
 */
export const BoxConstraints = {
    /**
     * Create constraints with fixed dimensions
     */
    tight(size: Size): BoxConstraints {
        return {
            minWidth: size.width,
            maxWidth: size.width,
            minHeight: size.height,
            maxHeight: size.height,
        };
    },

    /**
     * Create constraints with no limits (expand to fill available space)
     */
    expand(width?: number, height?: number): BoxConstraints {
        return {
            minWidth: width ?? 0,
            maxWidth: width ?? Number.POSITIVE_INFINITY,
            minHeight: height ?? 0,
            maxHeight: height ?? Number.POSITIVE_INFINITY,
        };
    },

    /**
     * Create constraints with maximum limits only
     */
    loose(size: Size): BoxConstraints {
        return {
            minWidth: 0,
            maxWidth: size.width,
            minHeight: 0,
            maxHeight: size.height,
        };
    },

    /**
     * Create constraints with minimum size requirements
     */
    tightFor(width?: number, height?: number): BoxConstraints {
        return {
            minWidth: width ?? 0,
            maxWidth: width ?? Number.POSITIVE_INFINITY,
            minHeight: height ?? 0,
            maxHeight: height ?? Number.POSITIVE_INFINITY,
        };
    },

    /**
     * Check if constraints are valid
     */
    isValid(constraints: BoxConstraints): boolean {
        return (
            constraints.minWidth >= 0 &&
            constraints.maxWidth >= constraints.minWidth &&
            constraints.minHeight >= 0 &&
            constraints.maxHeight >= constraints.minHeight &&
            isFinite(constraints.minWidth) &&
            isFinite(constraints.minHeight)
        );
    },

    /**
     * Enforce a size within the given constraints
     */
    constrain(constraints: BoxConstraints, size: Size): Size {
        return {
            width: Math.max(constraints.minWidth, Math.min(constraints.maxWidth, size.width)),
            height: Math.max(constraints.minHeight, Math.min(constraints.maxHeight, size.height)),
        };
    },

    /**
     * Check if size satisfies constraints
     */
    satisfies(constraints: BoxConstraints, size: Size): boolean {
        return (
            size.width >= constraints.minWidth &&
            size.width <= constraints.maxWidth &&
            size.height >= constraints.minHeight &&
            size.height <= constraints.maxHeight
        );
    },
};

import type {
    ThemeData as ComprehensiveThemeData,
} from './theming.js';

import {
    defaultTheme as comprehensiveDefaultTheme,
} from './theming.js';
import type { FontRegistry } from '@/core/index.js';
import type { TextDirection } from '@/core/text-layout.js';

// Use the comprehensive theme system
export type ThemeData = ComprehensiveThemeData;
export const defaultTheme: ThemeData = comprehensiveDefaultTheme;

/**
 * Layout context provides environmental information during layout
 */
export interface LayoutContext {
    /** Constraints provided by parent */
    readonly constraints: BoxConstraints;
    /** Text direction for layout */
    readonly textDirection: TextDirection;
    /** Theme data for styling */
    readonly theme: ThemeData;
}

/**
 * Result of a layout operation
 */
export interface LayoutResult {
    /** Final size of the widget */
    readonly size: Size;
    /** Baseline information for text alignment (optional) */
    readonly baseline?: number;
    /** Whether the widget needs to be repainted if constraints change */
    readonly needsRepaint: boolean;
}

/**
 * Paint context provides information needed for painting
 */
export interface PaintContext {
    /** Graphics context for drawing operations */
    readonly graphics: PdfGraphics;
    /** Size of the widget being painted */
    readonly size: Size;
    /** Theme data for styling */
    readonly theme: ThemeData;
    /** Font registry for accurate text measurements */
    readonly fontRegistry?: FontRegistry;
}

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
    /**
     * Create insets with all sides equal
     */
    all(value: number): EdgeInsets {
        return { top: value, right: value, bottom: value, left: value };
    },

    /**
     * Create insets with horizontal and vertical values
     */
    symmetric(options: { horizontal?: number, vertical?: number }): EdgeInsets {
        return {
            top: options.vertical ?? 0,
            right: options.horizontal ?? 0,
            bottom: options.vertical ?? 0,
            left: options.horizontal ?? 0,
        };
    },

    /**
     * Create insets with individual values
     */
    only(options: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    }): EdgeInsets {
        return {
            top: options.top ?? 0,
            right: options.right ?? 0,
            bottom: options.bottom ?? 0,
            left: options.left ?? 0,
        };
    },

    /**
     * Create zero insets
     */
    zero: { top: 0, right: 0, bottom: 0, left: 0 } as EdgeInsets,

    /**
     * Get total horizontal insets
     */
    horizontal(insets: EdgeInsets): number {
        return insets.left + insets.right;
    },

    /**
     * Get total vertical insets
     */
    vertical(insets: EdgeInsets): number {
        return insets.top + insets.bottom;
    },

    /**
     * Deflate a size by the insets
     */
    deflateSize(insets: EdgeInsets, size: Size): Size {
        return {
            width: Math.max(0, size.width - EdgeInsets.horizontal(insets)),
            height: Math.max(0, size.height - EdgeInsets.vertical(insets)),
        };
    },

    /**
     * Inflate a size by the insets
     */
    inflateSize(insets: EdgeInsets, size: Size): Size {
        return {
            width: size.width + EdgeInsets.horizontal(insets),
            height: size.height + EdgeInsets.vertical(insets),
        };
    },

    /**
     * Deflate constraints by the insets
     */
    deflateConstraints(insets: EdgeInsets, constraints: BoxConstraints): BoxConstraints {
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
    /**
     * Calculate position based on alignment, container size, and child size
     */
    resolve(
        alignment: Alignment,
        containerSize: Size,
        childSize: Size
    ): Point {
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