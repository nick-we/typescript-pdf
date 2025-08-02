/**
 * Flex layout types and enums
 * 
 * Implements Flutter-style flex layout system with main-axis and cross-axis
 * alignment, flexible and expanded children, and spacing controls.
 * 
 * @packageDocumentation
 */

import { TextDirection } from '../core/text-layout.js';

/**
 * Direction of the main axis in a flex layout
 */
export enum Axis {
    /** Horizontal main axis (Row) */
    Horizontal = 'horizontal',
    /** Vertical main axis (Column) */
    Vertical = 'vertical',
}

/**
 * How children should be aligned along the main axis
 */
export enum MainAxisAlignment {
    /** Place children at the start of the main axis */
    Start = 'start',
    /** Place children at the end of the main axis */
    End = 'end',
    /** Place children at the center of the main axis */
    Center = 'center',
    /** Distribute children evenly with space between them */
    SpaceBetween = 'spaceBetween',
    /** Distribute children evenly with space around them */
    SpaceAround = 'spaceAround',
    /** Distribute children evenly with equal space around them */
    SpaceEvenly = 'spaceEvenly',
}

/**
 * How children should be aligned along the cross axis
 */
export enum CrossAxisAlignment {
    /** Align children to the start of the cross axis */
    Start = 'start',
    /** Align children to the end of the cross axis */
    End = 'end',
    /** Align children to the center of the cross axis */
    Center = 'center',
    /** Stretch children to fill the cross axis */
    Stretch = 'stretch',
    /** Align children to their baseline (text widgets) */
    Baseline = 'baseline',
}

/**
 * Direction of vertical axis layout (for Column widgets)
 */
export enum VerticalDirection {
    /** Children are positioned from top to bottom (Flutter default) */
    Down = 'down',
    /** Children are positioned from bottom to top */
    Up = 'up',
}

/**
 * How much space the flex container should occupy along the main axis
 */
export enum MainAxisSize {
    /** Take up the minimum space required by children */
    Min = 'min',
    /** Take up the maximum available space */
    Max = 'max',
}

/**
 * How a flex child should fit within the available space
 */
export enum FlexFit {
    /** Child can be smaller than the flex space allocated to it */
    Loose = 'loose',
    /** Child must fill the flex space allocated to it */
    Tight = 'tight',
}

/**
 * Configuration for spacing between flex children
 */
export interface FlexSpacing {
    /** Main axis spacing between children */
    mainAxisSpacing?: number;
    /** Cross axis spacing between children */
    crossAxisSpacing?: number;
}

/**
 * Flex child data for widgets that participate in flex layout
 */
export interface FlexChildData {
    /** Flex factor for this child (default: 0 = non-flexible) */
    flex?: number;
    /** How this child should fit within its flex space */
    fit?: FlexFit;
}

/**
 * Flex layout calculation result for internal use
 */
export interface FlexLayoutData {
    /** Total main axis size */
    mainAxisSize: number;
    /** Total cross axis size */
    crossAxisSize: number;
    /** Individual child layouts */
    children: Array<{
        /** Child size after layout */
        size: { width: number; height: number };
        /** Child position relative to flex container */
        position: { x: number; y: number };
        /** Original layout result from child */
        layoutResult: import('./layout.js').LayoutResult;
        /** Original child index */
        index: number;
    }>;
}

/**
 * Utility functions for flex layout calculations
 */
export const FlexUtils = {
    /**
     * Get the main axis size from a size object
     */
    getMainAxisSize(size: { width: number; height: number }, axis: Axis): number {
        return axis === Axis.Horizontal ? size.width : size.height;
    },

    /**
     * Get the cross axis size from a size object
     */
    getCrossAxisSize(size: { width: number; height: number }, axis: Axis): number {
        return axis === Axis.Horizontal ? size.height : size.width;
    },

    /**
     * Create a size object from main and cross axis values
     */
    createSize(mainAxisSize: number, crossAxisSize: number, axis: Axis): { width: number; height: number } {
        return axis === Axis.Horizontal
            ? { width: mainAxisSize, height: crossAxisSize }
            : { width: crossAxisSize, height: mainAxisSize };
    },

    /**
     * Get main axis constraint values from BoxConstraints
     */
    getMainAxisConstraints(constraints: import('./layout.js').BoxConstraints, axis: Axis): {
        min: number;
        max: number;
    } {
        if (axis === Axis.Horizontal) {
            return { min: constraints.minWidth, max: constraints.maxWidth };
        } else {
            return { min: constraints.minHeight, max: constraints.maxHeight };
        }
    },

    /**
     * Get cross axis constraint values from BoxConstraints
     */
    getCrossAxisConstraints(constraints: import('./layout.js').BoxConstraints, axis: Axis): {
        min: number;
        max: number;
    } {
        if (axis === Axis.Horizontal) {
            return { min: constraints.minHeight, max: constraints.maxHeight };
        } else {
            return { min: constraints.minWidth, max: constraints.maxWidth };
        }
    },

    /**
     * Calculate flex space distribution among flexible children
     */
    calculateFlexSpace(
        availableSpace: number,
        totalFlex: number,
        flexChildren: Array<{ flex: number; minSize: number }>
    ): Array<number> {
        if (totalFlex === 0 || availableSpace <= 0) {
            return flexChildren.map(() => 0);
        }

        const flexUnit = Math.max(0, availableSpace / totalFlex);
        return flexChildren.map(child => Math.max(child.minSize, child.flex * flexUnit));
    },

    /**
     * Calculate main axis positions based on alignment
     */
    calculateMainAxisPositions(
        childSizes: number[],
        containerSize: number,
        alignment: MainAxisAlignment,
        spacing?: number
    ): number[] {
        if (childSizes.length === 0) return [];

        // Ensure all inputs are valid numbers
        const safeContainerSize = typeof containerSize === 'number' && !isNaN(containerSize) ? containerSize : 0;
        const safeSpacing = typeof spacing === 'number' && !isNaN(spacing) ? spacing : 0;
        const safeChildSizes = childSizes.map(size => typeof size === 'number' && !isNaN(size) ? size : 0);

        const totalChildSize = safeChildSizes.reduce((sum, size) => sum + size, 0);
        const totalSpacing = safeSpacing * Math.max(0, safeChildSizes.length - 1);
        const remainingSpace = Math.max(0, safeContainerSize - totalChildSize - totalSpacing);

        const positions: number[] = [];
        let currentPosition = 0;

        switch (alignment) {
            case MainAxisAlignment.Start:
                // For Flutter coordinates: Start means top (Y=0) for vertical, left (X=0) for horizontal
                currentPosition = 0;
                break;
            case MainAxisAlignment.End:
                currentPosition = remainingSpace;
                break;
            case MainAxisAlignment.Center:
                currentPosition = remainingSpace / 2;
                break;
            case MainAxisAlignment.SpaceBetween:
                if (safeChildSizes.length === 1) {
                    currentPosition = remainingSpace / 2;
                } else {
                    const spaceBetween = safeChildSizes.length > 1 ? remainingSpace / (safeChildSizes.length - 1) : 0;
                    for (let i = 0; i < safeChildSizes.length; i++) {
                        positions.push(currentPosition);
                        currentPosition += safeChildSizes[i]! + spaceBetween;
                    }
                    return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
                }
                break;
            case MainAxisAlignment.SpaceAround:
                const spaceAround = safeChildSizes.length > 0 ? remainingSpace / safeChildSizes.length : 0;
                currentPosition = spaceAround / 2;
                for (let i = 0; i < safeChildSizes.length; i++) {
                    positions.push(currentPosition);
                    currentPosition += safeChildSizes[i]! + spaceAround;
                }
                return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
            case MainAxisAlignment.SpaceEvenly:
                const spaceEvenly = remainingSpace / (safeChildSizes.length + 1);
                currentPosition = spaceEvenly;
                for (let i = 0; i < safeChildSizes.length; i++) {
                    positions.push(currentPosition);
                    currentPosition += safeChildSizes[i]! + spaceEvenly;
                }
                return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
        }

        // For Start, End, Center alignments - position children sequentially
        // In Flutter coordinates: Y increases downward, so this is correct for vertical layout
        for (let i = 0; i < safeChildSizes.length; i++) {
            positions.push(currentPosition);
            currentPosition += safeChildSizes[i]! + safeSpacing;
        }

        return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
    },

    /**
     * Calculate cross axis position based on alignment
     */
    calculateCrossAxisPosition(
        childSize: number,
        containerSize: number,
        alignment: CrossAxisAlignment
    ): number {
        // Ensure all inputs are valid numbers
        const safeChildSize = typeof childSize === 'number' && !isNaN(childSize) ? childSize : 0;
        const safeContainerSize = typeof containerSize === 'number' && !isNaN(containerSize) ? containerSize : 0;

        let position = 0;

        switch (alignment) {
            case CrossAxisAlignment.Start:
                position = 0;
                break;
            case CrossAxisAlignment.End:
                position = safeContainerSize - safeChildSize;
                break;
            case CrossAxisAlignment.Center:
                position = (safeContainerSize - safeChildSize) / 2;
                break;
            case CrossAxisAlignment.Stretch:
                position = 0; // Child should be stretched to fill container
                break;
            case CrossAxisAlignment.Baseline:
                // TODO: Implement baseline alignment using widget baseline info
                position = 0;
                break;
            default:
                position = 0;
                break;
        }

        // Ensure the result is a valid number
        return typeof position === 'number' && !isNaN(position) ? position : 0;
    },

    /**
     * Determine if "start" means top-left for the given axis and directions
     * This is crucial for proper PDF coordinate system handling
     *
     * NOTE: PDF coordinates have Y=0 at bottom, Y increases upward
     * This is different from Flutter coordinates where Y=0 is at top
     */
    startIsTopLeft(
        axis: Axis,
        textDirection: TextDirection,
        verticalDirection: VerticalDirection = VerticalDirection.Down
    ): boolean {
        switch (axis) {
            case Axis.Horizontal:
                return textDirection === TextDirection.LeftToRight;
            case Axis.Vertical:
                // In PDF coordinates, Y=0 is at bottom and Y increases upward
                // VerticalDirection.Down means top-to-bottom layout, which in PDF coords
                // means going from higher Y to lower Y values (NOT start at top-left)
                return verticalDirection === VerticalDirection.Up;
        }
    },

    /**
     * Get the opposite axis
     */
    flipAxis(axis: Axis): Axis {
        return axis === Axis.Horizontal ? Axis.Vertical : Axis.Horizontal;
    },

    /**
     * Calculate main axis positions with PDF coordinate system
     * In PDF coordinates: Y=0 is at bottom, Y increases upward
     */
    calculateMainAxisPositionsFlutter(
        childSizes: number[],
        containerSize: number,
        alignment: MainAxisAlignment,
        spacing: number = 0,
        axis: Axis,
        textDirection: TextDirection,
        verticalDirection: VerticalDirection = VerticalDirection.Down
    ): number[] {
        if (childSizes.length === 0) return [];

        // Ensure all inputs are valid numbers
        const safeContainerSize = typeof containerSize === 'number' && !isNaN(containerSize) ? containerSize : 0;
        const safeSpacing = typeof spacing === 'number' && !isNaN(spacing) ? spacing : 0;
        const safeChildSizes = childSizes.map(size => typeof size === 'number' && !isNaN(size) ? size : 0);

        const totalChildSize = safeChildSizes.reduce((sum, size) => sum + size, 0);
        const totalSpacing = safeSpacing * Math.max(0, safeChildSizes.length - 1);
        const remainingSpace = Math.max(0, safeContainerSize - totalChildSize - totalSpacing);

        const positions: number[] = [];
        let currentPosition = 0;

        // For PDF coordinates, we need to match dart-pdf behavior:
        // - Y=0 is at bottom, Y increases upward
        // - VerticalDirection.Down means layout top-to-bottom, which in PDF coords means higher Y to lower Y
        // - VerticalDirection.Up means layout bottom-to-top, which in PDF coords means lower Y to higher Y
        // - Horizontal axis with TextDirection.LeftToRight: normal left-to-right
        // - Horizontal axis with TextDirection.RightToLeft: right-to-left

        const shouldReverseOrder =
            (axis === Axis.Vertical && verticalDirection === VerticalDirection.Down) ||
            (axis === Axis.Horizontal && textDirection === TextDirection.RightToLeft);

        // Calculate base position based on alignment
        // In PDF coordinates, for VerticalDirection.Down (top-to-bottom layout),
        // we start from the top of the container (higher Y value) and go down (lower Y values)
        switch (alignment) {
            case MainAxisAlignment.Start:
                currentPosition = shouldReverseOrder ? safeContainerSize : 0;
                break;
            case MainAxisAlignment.End:
                currentPosition = shouldReverseOrder ? totalChildSize + totalSpacing : remainingSpace;
                break;
            case MainAxisAlignment.Center:
                currentPosition = shouldReverseOrder
                    ? safeContainerSize - remainingSpace / 2
                    : remainingSpace / 2;
                break;
            case MainAxisAlignment.SpaceBetween:
                if (safeChildSizes.length === 1) {
                    currentPosition = shouldReverseOrder
                        ? safeContainerSize - remainingSpace / 2
                        : remainingSpace / 2;
                } else {
                    const spaceBetween = safeChildSizes.length > 1 ? remainingSpace / (safeChildSizes.length - 1) : 0;

                    if (shouldReverseOrder) {
                        // Start from container size and work downward
                        currentPosition = safeContainerSize;
                        for (let i = 0; i < safeChildSizes.length; i++) {
                            currentPosition -= safeChildSizes[i]!;
                            positions.push(currentPosition);
                            if (i < safeChildSizes.length - 1) {
                                currentPosition -= spaceBetween;
                            }
                        }
                    } else {
                        // Start from 0 and work upward
                        currentPosition = 0;
                        for (let i = 0; i < safeChildSizes.length; i++) {
                            positions.push(currentPosition);
                            currentPosition += safeChildSizes[i]! + spaceBetween;
                        }
                    }
                    return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
                }
                break;
            case MainAxisAlignment.SpaceAround:
                const spaceAround = safeChildSizes.length > 0 ? remainingSpace / safeChildSizes.length : 0;

                if (shouldReverseOrder) {
                    currentPosition = safeContainerSize - spaceAround / 2;
                    for (let i = 0; i < safeChildSizes.length; i++) {
                        currentPosition -= safeChildSizes[i]!;
                        positions.push(currentPosition);
                        currentPosition -= spaceAround;
                    }
                } else {
                    currentPosition = spaceAround / 2;
                    for (let i = 0; i < safeChildSizes.length; i++) {
                        positions.push(currentPosition);
                        currentPosition += safeChildSizes[i]! + spaceAround;
                    }
                }
                return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
            case MainAxisAlignment.SpaceEvenly:
                const spaceEvenly = remainingSpace / (safeChildSizes.length + 1);

                if (shouldReverseOrder) {
                    currentPosition = safeContainerSize - spaceEvenly;
                    for (let i = 0; i < safeChildSizes.length; i++) {
                        currentPosition -= safeChildSizes[i]!;
                        positions.push(currentPosition);
                        currentPosition -= spaceEvenly;
                    }
                } else {
                    currentPosition = spaceEvenly;
                    for (let i = 0; i < safeChildSizes.length; i++) {
                        positions.push(currentPosition);
                        currentPosition += safeChildSizes[i]! + spaceEvenly;
                    }
                }
                return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
        }

        // For Start, End, Center alignments - position children sequentially
        if (shouldReverseOrder) {
            // Position from top to bottom in PDF coordinates (higher Y to lower Y)
            for (let i = 0; i < safeChildSizes.length; i++) {
                currentPosition -= safeChildSizes[i]!;
                positions.push(currentPosition);
                currentPosition -= safeSpacing;
            }
        } else {
            // Position from bottom to top in PDF coordinates (lower Y to higher Y)
            for (let i = 0; i < safeChildSizes.length; i++) {
                positions.push(currentPosition);
                currentPosition += safeChildSizes[i]! + safeSpacing;
            }
        }

        return positions.map(pos => typeof pos === 'number' && !isNaN(pos) ? pos : 0);
    },
};