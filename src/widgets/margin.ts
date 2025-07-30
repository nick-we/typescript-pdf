/**
 * Margin widget implementation
 * 
 * A widget that adds margin space around its child.
 * This is a dedicated margin widget following the composition principle.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
    EdgeInsets,
} from '../types/layout.js';
import { EdgeInsets as EdgeInsetsUtils } from '../types/layout.js';
import type { Size } from '../types/geometry.js';

/**
 * Margin widget properties
 */
export interface MarginProps extends WidgetProps {
    /** The child widget to add margin around */
    child: Widget;
    /** Margin to apply around the child */
    margin: EdgeInsets;
}

/**
 * A widget that adds margin space around its child
 * 
 * The Margin widget is a single-purpose widget that adds space around its child.
 * Unlike Container, it only handles margins and doesn't support decoration or other features.
 */
export class Margin extends BaseWidget {
    private readonly child: Widget;
    private readonly margin: EdgeInsets;

    constructor(props: MarginProps) {
        super(props);
        this.child = props.child;
        this.margin = props.margin;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Deflate available constraints by margin amount
        const availableConstraints = EdgeInsetsUtils.deflateConstraints(
            this.margin,
            context.constraints
        );

        const childContext: LayoutContext = {
            ...context,
            constraints: availableConstraints,
        };

        // Layout child with available constraints
        const childLayout = this.child.layout(childContext);

        // Add margin to child size to get total size
        const totalSize: Size = EdgeInsetsUtils.inflateSize(this.margin, childLayout.size);

        // Constrain final size to parent constraints
        const constrainedSize = this.constrainSize(context.constraints, totalSize);

        // Adjust baseline if child has one
        const layoutOptions: { needsRepaint: boolean; baseline?: number } = {
            needsRepaint: childLayout.needsRepaint,
        };

        if (childLayout.baseline !== undefined) {
            layoutOptions.baseline = childLayout.baseline + this.margin.top;
        }

        return this.createLayoutResult(constrainedSize, layoutOptions);
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Calculate child area (excluding margin)
        const childSize: Size = EdgeInsetsUtils.deflateSize(this.margin, size);

        // Save graphics state and translate by margin offset
        graphics.saveContext();
        graphics.setTransform({
            storage: [1, 0, 0, 1, this.margin.left, this.margin.top],
        } as any);

        // Paint child in translated context
        const childContext: PaintContext = {
            ...context,
            size: childSize,
        };

        this.child.paint(childContext);

        graphics.restoreContext();
    }
}

/**
 * Convenience function to create a Margin widget
 */
export function createMargin(child: Widget, margin: EdgeInsets): Margin {
    return new Margin({ child, margin });
}

/**
 * Convenience functions for common margin patterns
 */
export const MarginHelpers = {
    /**
     * Add equal margin on all sides
     */
    all(child: Widget, value: number): Margin {
        return new Margin({
            child,
            margin: EdgeInsetsUtils.all(value),
        });
    },

    /**
     * Add symmetric margin (horizontal/vertical)
     */
    symmetric(
        child: Widget,
        options: { horizontal?: number; vertical?: number }
    ): Margin {
        return new Margin({
            child,
            margin: EdgeInsetsUtils.symmetric(options),
        });
    },

    /**
     * Add margin to specific sides only
     */
    only(
        child: Widget,
        options: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        }
    ): Margin {
        return new Margin({
            child,
            margin: EdgeInsetsUtils.only(options),
        });
    },
};