/**
 * Center widget implementation
 * 
 * A widget that centers its child within itself.
 * This is a specialized version of the Align widget.
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import { Align, type AlignProps } from './align.js';
import { Alignment } from '../types/layout.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';

/**
 * Center widget properties
 */
export interface CenterProps extends WidgetProps {
    /** The child widget to center */
    child: Widget;
    /** Width factor (0.0 to 1.0) - proportion of available width to use */
    widthFactor?: number;
    /** Height factor (0.0 to 1.0) - proportion of available height to use */
    heightFactor?: number;
}

/**
 * A widget that centers its child within itself
 * 
 * The Center widget is a convenience widget that always centers its child.
 * It's implemented as a specialized Align widget with Alignment.Center.
 */
export class Center extends BaseWidget {
    private readonly alignWidget: Align;

    constructor(props: CenterProps) {
        super(props);

        const alignProps: AlignProps = {
            child: props.child,
            alignment: Alignment.Center,
        };

        if (props.widthFactor !== undefined) {
            alignProps.widthFactor = props.widthFactor;
        }
        if (props.heightFactor !== undefined) {
            alignProps.heightFactor = props.heightFactor;
        }

        this.alignWidget = new Align(alignProps);
    }

    layout(context: LayoutContext): LayoutResult {
        return this.alignWidget.layout(context);
    }

    paint(context: PaintContext): void {
        this.alignWidget.paint(context);
    }
}

/**
 * Convenience function to create a Center widget
 */
export function createCenter(child: Widget): Center {
    return new Center({ child });
}

/**
 * Convenience functions for creating centered widgets
 */
export const CenterHelpers = {
    /**
     * Create a simple centered widget
     */
    simple(child: Widget): Center {
        return new Center({ child });
    },

    /**
     * Create a centered widget with width factor
     */
    withWidthFactor(child: Widget, widthFactor: number): Center {
        return new Center({ child, widthFactor });
    },

    /**
     * Create a centered widget with height factor
     */
    withHeightFactor(child: Widget, heightFactor: number): Center {
        return new Center({ child, heightFactor });
    },

    /**
     * Create a centered widget with both width and height factors
     */
    withFactors(child: Widget, widthFactor: number, heightFactor: number): Center {
        return new Center({ child, widthFactor, heightFactor });
    },
};