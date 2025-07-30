/**
 * Align widget implementation
 * 
 * A widget that aligns its child within itself.
 * Provides flexible alignment options for positioning a child widget.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import { Alignment, AlignmentUtils } from '../types/layout.js';
import type { Size } from '../types/geometry.js';

/**
 * Alignment factor interface for more precise control
 * Values range from -1.0 to 1.0:
 * - -1.0 aligns to the start (left/top)
 * - 0.0 centers
 * - 1.0 aligns to the end (right/bottom)
 */
export interface AlignmentGeometry {
    /** Horizontal alignment factor (-1.0 to 1.0) */
    x: number;
    /** Vertical alignment factor (-1.0 to 1.0) */
    y: number;
}

/**
 * Align widget properties
 */
export interface AlignProps extends WidgetProps {
    /** The child widget to align */
    child: Widget;
    /** Alignment specification */
    alignment: Alignment | AlignmentGeometry;
    /** Width factor (0.0 to 1.0) - proportion of available width to use */
    widthFactor?: number;
    /** Height factor (0.0 to 1.0) - proportion of available height to use */
    heightFactor?: number;
}

/**
 * A widget that aligns its child within itself
 * 
 * The Align widget allows precise positioning of a child widget within available space.
 * It can use predefined alignment constants or custom geometry values.
 */
export class Align extends BaseWidget {
    private readonly child: Widget;
    private readonly alignment: Alignment | AlignmentGeometry;
    private readonly widthFactor?: number;
    private readonly heightFactor?: number;

    constructor(props: AlignProps) {
        super(props);
        this.child = props.child;
        this.alignment = props.alignment;
        if (props.widthFactor !== undefined) {
            this.widthFactor = props.widthFactor;
        }
        if (props.heightFactor !== undefined) {
            this.heightFactor = props.heightFactor;
        }

        // Validate factors
        if (this.widthFactor !== undefined && (this.widthFactor < 0 || this.widthFactor > 1)) {
            throw new Error('widthFactor must be between 0.0 and 1.0');
        }
        if (this.heightFactor !== undefined && (this.heightFactor < 0 || this.heightFactor > 1)) {
            throw new Error('heightFactor must be between 0.0 and 1.0');
        }
    }

    /**
     * Convert alignment to geometry if needed
     */
    private resolveAlignment(): AlignmentGeometry {
        if (typeof this.alignment === 'string') {
            return this.alignmentToGeometry(this.alignment);
        }
        return this.alignment;
    }

    /**
     * Convert Alignment enum to AlignmentGeometry
     */
    private alignmentToGeometry(alignment: Alignment): AlignmentGeometry {
        switch (alignment) {
            case Alignment.TopLeft:
                return { x: -1.0, y: -1.0 };
            case Alignment.TopCenter:
                return { x: 0.0, y: -1.0 };
            case Alignment.TopRight:
                return { x: 1.0, y: -1.0 };
            case Alignment.CenterLeft:
                return { x: -1.0, y: 0.0 };
            case Alignment.Center:
                return { x: 0.0, y: 0.0 };
            case Alignment.CenterRight:
                return { x: 1.0, y: 0.0 };
            case Alignment.BottomLeft:
                return { x: -1.0, y: 1.0 };
            case Alignment.BottomCenter:
                return { x: 0.0, y: 1.0 };
            case Alignment.BottomRight:
                return { x: 1.0, y: 1.0 };
            default:
                return { x: 0.0, y: 0.0 };
        }
    }

    /**
     * Calculate position based on alignment geometry
     */
    private calculatePosition(
        containerSize: Size,
        childSize: Size,
        alignment: AlignmentGeometry
    ): { x: number; y: number } {
        const xSpace = containerSize.width - childSize.width;
        const ySpace = containerSize.height - childSize.height;

        const x = (alignment.x + 1.0) * xSpace / 2.0;
        const y = (alignment.y + 1.0) * ySpace / 2.0;

        return { x, y };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Calculate container size based on factors or use available space
        let containerWidth = context.constraints.maxWidth;
        let containerHeight = context.constraints.maxHeight;

        if (this.widthFactor !== undefined) {
            containerWidth = context.constraints.maxWidth * this.widthFactor;
        }
        if (this.heightFactor !== undefined) {
            containerHeight = context.constraints.maxHeight * this.heightFactor;
        }

        // If container size is infinite, we need to measure the child first
        if (containerWidth === Number.POSITIVE_INFINITY || containerHeight === Number.POSITIVE_INFINITY) {
            // Give child loose constraints to measure its preferred size
            const childContext: LayoutContext = {
                ...context,
                constraints: {
                    minWidth: 0,
                    maxWidth: containerWidth === Number.POSITIVE_INFINITY
                        ? Number.POSITIVE_INFINITY
                        : containerWidth,
                    minHeight: 0,
                    maxHeight: containerHeight === Number.POSITIVE_INFINITY
                        ? Number.POSITIVE_INFINITY
                        : containerHeight,
                },
            };

            const childLayout = this.child.layout(childContext);

            // If no factors specified, use child's preferred size
            if (containerWidth === Number.POSITIVE_INFINITY) {
                containerWidth = childLayout.size.width;
            }
            if (containerHeight === Number.POSITIVE_INFINITY) {
                containerHeight = childLayout.size.height;
            }
        } else {
            // Layout child with container constraints
            const childContext: LayoutContext = {
                ...context,
                constraints: {
                    minWidth: 0,
                    maxWidth: containerWidth,
                    minHeight: 0,
                    maxHeight: containerHeight,
                },
            };

            this.child.layout(childContext);
        }

        const containerSize: Size = {
            width: containerWidth,
            height: containerHeight,
        };

        // Constrain container size to our constraints
        const finalSize = this.constrainSize(context.constraints, containerSize);

        return this.createLayoutResult(finalSize, {
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Layout child again to get its size (in a real implementation, this would be cached)
        const childContext: LayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: size.width,
                minHeight: 0,
                maxHeight: size.height,
            },
            textDirection: context.theme ? context.theme.textStyle ? 'ltr' as any : 'ltr' as any : 'ltr' as any,
            theme: context.theme,
        };

        const childLayout = this.child.layout(childContext);
        const childSize = childLayout.size;

        // Calculate child position based on alignment
        const alignment = this.resolveAlignment();
        const position = this.calculatePosition(size, childSize, alignment);

        // Save graphics state and translate to child position
        graphics.saveContext();
        graphics.setTransform({
            storage: [1, 0, 0, 1, position.x, position.y],
        } as any);

        // Paint child
        const childPaintContext: PaintContext = {
            ...context,
            size: childSize,
        };

        this.child.paint(childPaintContext);

        graphics.restoreContext();
    }
}

/**
 * Convenience function to create an Align widget
 */
export function createAlign(child: Widget, alignment: Alignment | AlignmentGeometry): Align {
    return new Align({ child, alignment });
}

/**
 * Convenience functions for common alignment patterns
 */
export const AlignHelpers = {
    /**
     * Create an aligned widget with predefined alignment
     */
    withAlignment(child: Widget, alignment: Alignment): Align {
        return new Align({ child, alignment });
    },

    /**
     * Create an aligned widget with custom geometry
     */
    withGeometry(child: Widget, x: number, y: number): Align {
        return new Align({ child, alignment: { x, y } });
    },

    /**
     * Create an aligned widget that takes a fraction of available space
     */
    withFactor(
        child: Widget,
        alignment: Alignment,
        options: { widthFactor?: number; heightFactor?: number }
    ): Align {
        const props: AlignProps = { child, alignment };
        if (options.widthFactor !== undefined) {
            props.widthFactor = options.widthFactor;
        }
        if (options.heightFactor !== undefined) {
            props.heightFactor = options.heightFactor;
        }
        return new Align(props);
    },

    /**
     * Align child to top-left
     */
    topLeft(child: Widget): Align {
        return new Align({ child, alignment: Alignment.TopLeft });
    },

    /**
     * Align child to top-center
     */
    topCenter(child: Widget): Align {
        return new Align({ child, alignment: Alignment.TopCenter });
    },

    /**
     * Align child to top-right
     */
    topRight(child: Widget): Align {
        return new Align({ child, alignment: Alignment.TopRight });
    },

    /**
     * Align child to center-left
     */
    centerLeft(child: Widget): Align {
        return new Align({ child, alignment: Alignment.CenterLeft });
    },

    /**
     * Align child to center
     */
    center(child: Widget): Align {
        return new Align({ child, alignment: Alignment.Center });
    },

    /**
     * Align child to center-right
     */
    centerRight(child: Widget): Align {
        return new Align({ child, alignment: Alignment.CenterRight });
    },

    /**
     * Align child to bottom-left
     */
    bottomLeft(child: Widget): Align {
        return new Align({ child, alignment: Alignment.BottomLeft });
    },

    /**
     * Align child to bottom-center
     */
    bottomCenter(child: Widget): Align {
        return new Align({ child, alignment: Alignment.BottomCenter });
    },

    /**
     * Align child to bottom-right
     */
    bottomRight(child: Widget): Align {
        return new Align({ child, alignment: Alignment.BottomRight });
    },
};