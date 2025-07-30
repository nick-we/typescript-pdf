/**
 * Flex layout types and enums
 * 
 * Implements Flutter-style flex layout system with main-axis and cross-axis
 * alignment, flexible and expanded children, and spacing controls.
 * 
 * @packageDocumentation
 */

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

        const totalChildSize = childSizes.reduce((sum, size) => sum + size, 0);
        const totalSpacing = spacing ? spacing * (childSizes.length - 1) : 0;
        const remainingSpace = Math.max(0, containerSize - totalChildSize - totalSpacing);

        const positions: number[] = [];
        let currentPosition = 0;

        switch (alignment) {
            case MainAxisAlignment.Start:
                currentPosition = 0;
                break;
            case MainAxisAlignment.End:
                currentPosition = remainingSpace;
                break;
            case MainAxisAlignment.Center:
                currentPosition = remainingSpace / 2;
                break;
            case MainAxisAlignment.SpaceBetween:
                if (childSizes.length === 1) {
                    currentPosition = remainingSpace / 2;
                } else {
                    const spaceBetween = remainingSpace / (childSizes.length - 1);
                    for (let i = 0; i < childSizes.length; i++) {
                        positions.push(currentPosition);
                        currentPosition += (childSizes[i] || 0) + spaceBetween;
                    }
                    return positions;
                }
                break;
            case MainAxisAlignment.SpaceAround:
                const spaceAround = remainingSpace / childSizes.length;
                currentPosition = spaceAround / 2;
                for (let i = 0; i < childSizes.length; i++) {
                    positions.push(currentPosition);
                    currentPosition += (childSizes[i] || 0) + spaceAround;
                }
                return positions;
            case MainAxisAlignment.SpaceEvenly:
                const spaceEvenly = remainingSpace / (childSizes.length + 1);
                currentPosition = spaceEvenly;
                for (let i = 0; i < childSizes.length; i++) {
                    positions.push(currentPosition);
                    currentPosition += (childSizes[i] || 0) + spaceEvenly;
                }
                return positions;
        }

        // For Start, End, Center alignments
        for (let i = 0; i < childSizes.length; i++) {
            positions.push(currentPosition);
            currentPosition += (childSizes[i] || 0) + (spacing || 0);
        }

        return positions;
    },

    /**
     * Calculate cross axis position based on alignment
     */
    calculateCrossAxisPosition(
        childSize: number,
        containerSize: number,
        alignment: CrossAxisAlignment
    ): number {
        switch (alignment) {
            case CrossAxisAlignment.Start:
                return 0;
            case CrossAxisAlignment.End:
                return containerSize - childSize;
            case CrossAxisAlignment.Center:
                return (containerSize - childSize) / 2;
            case CrossAxisAlignment.Stretch:
                return 0; // Child should be stretched to fill container
            case CrossAxisAlignment.Baseline:
                // TODO: Implement baseline alignment using widget baseline info
                return 0;
            default:
                return 0;
        }
    },
};