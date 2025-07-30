/**
 * Positioned widget implementation
 * 
 * A widget that positions its child at a specific location within a Stack.
 * Provides absolute positioning capabilities within a layered layout.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { ThemeUtils } from '../types/theming.js';

/**
 * Positioned widget properties
 */
export interface PositionedProps extends WidgetProps {
    /** The child widget to position */
    child: Widget;
    /** Distance from the left edge */
    left?: number;
    /** Distance from the top edge */
    top?: number;
    /** Distance from the right edge */
    right?: number;
    /** Distance from the bottom edge */
    bottom?: number;
    /** Fixed width of the positioned widget */
    width?: number;
    /** Fixed height of the positioned widget */
    height?: number;
}

/**
 * A widget that positions its child at a specific location
 * 
 * The Positioned widget is designed to be used within a Stack widget.
 * It allows absolute positioning of children within the stack's bounds.
 * 
 * Position specification rules:
 * - If left is specified, positions child from left edge
 * - If right is specified, positions child from right edge
 * - If both left and right are specified, child stretches between them
 * - Same rules apply for top/bottom
 * - Width/height override the stretch behavior
 */
export class Positioned extends BaseWidget {
    private readonly child: Widget;
    private readonly left?: number;
    private readonly top?: number;
    private readonly right?: number;
    private readonly bottom?: number;
    private readonly width?: number;
    private readonly height?: number;

    constructor(props: PositionedProps) {
        super(props);
        this.child = props.child;

        if (props.left !== undefined) {
            this.left = props.left;
        }
        if (props.top !== undefined) {
            this.top = props.top;
        }
        if (props.right !== undefined) {
            this.right = props.right;
        }
        if (props.bottom !== undefined) {
            this.bottom = props.bottom;
        }
        if (props.width !== undefined) {
            this.width = props.width;
        }
        if (props.height !== undefined) {
            this.height = props.height;
        }

        // Validate positioning constraints
        if (this.left !== undefined && this.right !== undefined && this.width !== undefined) {
            console.warn('Positioned widget: Cannot specify left, right, and width simultaneously');
        }
        if (this.top !== undefined && this.bottom !== undefined && this.height !== undefined) {
            console.warn('Positioned widget: Cannot specify top, bottom, and height simultaneously');
        }
    }

    /**
     * Calculate the child's constraints based on positioning
     */
    private calculateChildConstraints(containerSize: Size): {
        constraints: any;
        position: { x: number; y: number };
        size: { width: number; height: number };
    } {
        let childWidth: number;
        let childHeight: number;
        let x: number;
        let y: number;

        // Calculate width and x position
        if (this.width !== undefined) {
            childWidth = this.width;
            if (this.left !== undefined) {
                x = this.left;
            } else if (this.right !== undefined) {
                x = containerSize.width - this.right - childWidth;
            } else {
                x = 0; // Default to left edge
            }
        } else if (this.left !== undefined && this.right !== undefined) {
            x = this.left;
            childWidth = containerSize.width - this.left - this.right;
        } else if (this.left !== undefined) {
            x = this.left;
            childWidth = containerSize.width - this.left;
        } else if (this.right !== undefined) {
            childWidth = containerSize.width - this.right;
            x = 0;
        } else {
            x = 0;
            childWidth = containerSize.width;
        }

        // Calculate height and y position
        if (this.height !== undefined) {
            childHeight = this.height;
            if (this.top !== undefined) {
                y = this.top;
            } else if (this.bottom !== undefined) {
                y = containerSize.height - this.bottom - childHeight;
            } else {
                y = 0; // Default to top edge
            }
        } else if (this.top !== undefined && this.bottom !== undefined) {
            y = this.top;
            childHeight = containerSize.height - this.top - this.bottom;
        } else if (this.top !== undefined) {
            y = this.top;
            childHeight = containerSize.height - this.top;
        } else if (this.bottom !== undefined) {
            childHeight = containerSize.height - this.bottom;
            y = 0;
        } else {
            y = 0;
            childHeight = containerSize.height;
        }

        // Ensure non-negative dimensions
        childWidth = Math.max(0, childWidth);
        childHeight = Math.max(0, childHeight);

        return {
            constraints: {
                minWidth: this.width !== undefined ? this.width : 0,
                maxWidth: childWidth,
                minHeight: this.height !== undefined ? this.height : 0,
                maxHeight: childHeight,
            },
            position: { x, y },
            size: { width: childWidth, height: childHeight },
        };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // For positioned widgets, we need the container size to calculate positioning
        // In a real Stack widget, this would be provided by the Stack
        // For now, we'll use the maximum available size as the container
        const containerSize: Size = {
            width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                ? 400 // Default container width
                : context.constraints.maxWidth,
            height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                ? 400 // Default container height
                : context.constraints.maxHeight,
        };

        const childInfo = this.calculateChildConstraints(containerSize);

        // Layout child with calculated constraints
        const childContext: LayoutContext = {
            ...context,
            constraints: childInfo.constraints,
        };

        const childLayout = this.child.layout(childContext);

        // The positioned widget itself takes no space in the layout
        // Its size is determined by its position and the child size
        const finalSize: Size = {
            width: Math.min(childInfo.position.x + childLayout.size.width, containerSize.width),
            height: Math.min(childInfo.position.y + childLayout.size.height, containerSize.height),
        };

        return this.createLayoutResult(finalSize, {
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Calculate positioning again (in a real implementation, this would be cached)
        const containerSize = size;
        const childInfo = this.calculateChildConstraints(containerSize);

        // Layout child to get its actual size
        const childContext: LayoutContext = {
            constraints: childInfo.constraints,
            textDirection: context.theme ? 'ltr' as any : 'ltr' as any,
            theme: context.theme,
        };

        const childLayout = this.child.layout(childContext);

        // Save graphics state and translate to child position
        graphics.saveContext();
        graphics.setTransform({
            storage: [1, 0, 0, 1, childInfo.position.x, childInfo.position.y],
        } as any);

        // Paint child
        const childPaintContext: PaintContext = {
            ...context,
            size: childLayout.size,
        };

        this.child.paint(childPaintContext);

        graphics.restoreContext();
    }

    /**
     * Get the calculated position of this widget (used by Stack)
     */
    getPosition(containerSize: Size): { x: number; y: number } {
        return this.calculateChildConstraints(containerSize).position;
    }

    /**
     * Get the calculated size of this widget (used by Stack)
     */
    getCalculatedSize(containerSize: Size): Size {
        const childInfo = this.calculateChildConstraints(containerSize);

        // Create a mock context for layout
        const mockContext: LayoutContext = {
            constraints: childInfo.constraints,
            textDirection: 'ltr' as any,
            theme: ThemeUtils.light(),
        };

        const childLayout = this.child.layout(mockContext);
        return childLayout.size;
    }
}

/**
 * Convenience function to create a Positioned widget
 */
export function createPositioned(child: Widget, position: Omit<PositionedProps, 'child'>): Positioned {
    return new Positioned({ child, ...position });
}

/**
 * Convenience functions for common positioning patterns
 */
export const PositionedHelpers = {
    /**
     * Position widget at specific coordinates
     */
    at(child: Widget, left: number, top: number): Positioned {
        return new Positioned({ child, left, top });
    },

    /**
     * Position widget with fixed size at coordinates
     */
    sized(child: Widget, left: number, top: number, width: number, height: number): Positioned {
        return new Positioned({ child, left, top, width, height });
    },

    /**
     * Fill the entire container
     */
    fill(child: Widget): Positioned {
        return new Positioned({ child, left: 0, top: 0, right: 0, bottom: 0 });
    },

    /**
     * Position in top-left corner
     */
    topLeft(child: Widget, margin: number = 0): Positioned {
        return new Positioned({ child, left: margin, top: margin });
    },

    /**
     * Position in top-right corner
     */
    topRight(child: Widget, margin: number = 0): Positioned {
        return new Positioned({ child, top: margin, right: margin });
    },

    /**
     * Position in bottom-left corner
     */
    bottomLeft(child: Widget, margin: number = 0): Positioned {
        return new Positioned({ child, left: margin, bottom: margin });
    },

    /**
     * Position in bottom-right corner
     */
    bottomRight(child: Widget, margin: number = 0): Positioned {
        return new Positioned({ child, right: margin, bottom: margin });
    },

    /**
     * Center horizontally with fixed top position
     */
    centerHorizontal(child: Widget, top: number): Positioned {
        return new Positioned({ child, left: 0, right: 0, top });
    },

    /**
     * Center vertically with fixed left position
     */
    centerVertical(child: Widget, left: number): Positioned {
        return new Positioned({ child, left, top: 0, bottom: 0 });
    },
};