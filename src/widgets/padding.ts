/**
 * Padding widget implementation
 * 
 * A widget that insets its child by the given padding.
 * This is a dedicated padding widget following the composition principle.
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
 * Padding widget properties
 */
export interface PaddingProps extends WidgetProps {
    /** The child widget to add padding around */
    child: Widget;
    /** Padding to apply around the child */
    padding: EdgeInsets;
}

/**
 * A widget that insets its child by the given padding
 * 
 * The Padding widget is a single-purpose widget that adds space around its child.
 * Unlike Container, it only handles padding and doesn't support decoration or other features.
 */
export class Padding extends BaseWidget {
    private readonly child: Widget;
    private readonly padding: EdgeInsets;

    constructor(props: PaddingProps) {
        super(props);
        this.child = props.child;
        this.padding = props.padding;
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Deflate constraints by padding amount
        const childConstraints = EdgeInsetsUtils.deflateConstraints(
            this.padding,
            context.constraints
        );

        const childContext: LayoutContext = {
            ...context,
            constraints: childConstraints,
        };

        // Layout child with deflated constraints
        const childLayout = this.child.layout(childContext);

        // Add padding to child size
        const paddedSize: Size = EdgeInsetsUtils.inflateSize(this.padding, childLayout.size);

        // Constrain final size to parent constraints
        const constrainedSize = this.constrainSize(context.constraints, paddedSize);

        // Adjust baseline if child has one
        const layoutOptions: { needsRepaint: boolean; baseline?: number } = {
            needsRepaint: childLayout.needsRepaint,
        };

        if (childLayout.baseline !== undefined) {
            layoutOptions.baseline = childLayout.baseline + this.padding.top;
        }

        return this.createLayoutResult(constrainedSize, layoutOptions);
    }

    paint(context: PaintContext): void {
        const { graphics, size } = context;

        // Calculate child area (excluding padding)
        const childSize: Size = EdgeInsetsUtils.deflateSize(this.padding, size);

        // Save graphics state and translate by padding offset
        graphics.saveContext();
        graphics.setTransform({
            storage: [1, 0, 0, 1, this.padding.left, this.padding.top],
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
 * Convenience function to create a Padding widget
 */
export function createPadding(child: Widget, padding: EdgeInsets): Padding {
    return new Padding({ child, padding });
}

/**
 * Convenience functions for common padding patterns
 */
export const PaddingHelpers = {
    /**
     * Add equal padding on all sides
     */
    all(child: Widget, value: number): Padding {
        return new Padding({
            child,
            padding: EdgeInsetsUtils.all(value),
        });
    },

    /**
     * Add symmetric padding (horizontal/vertical)
     */
    symmetric(
        child: Widget,
        options: { horizontal?: number; vertical?: number }
    ): Padding {
        return new Padding({
            child,
            padding: EdgeInsetsUtils.symmetric(options),
        });
    },

    /**
     * Add padding to specific sides only
     */
    only(
        child: Widget,
        options: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        }
    ): Padding {
        return new Padding({
            child,
            padding: EdgeInsetsUtils.only(options),
        });
    },
};