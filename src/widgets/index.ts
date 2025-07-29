/**
 * Widget system exports
 * 
 * Main entry point for the typescript-pdf widget system.
 * Exports all widgets, layout utilities, and convenience functions.
 * 
 * @packageDocumentation
 */

// Base widget system
export {
    BaseWidget,
    EmptyWidget,
    WidgetComposition,
    WidgetUtils,
    type Widget,
    type WidgetProps,
} from './widget.js';

// Text widget and related types
export {
    Text,
    createText,
    TextStyles,
    TextAlign,
    TextOverflow,
    type TextProps,
    type TextStyle,
    type TextDecoration,
} from './text.js';

// Container widget and related types
export {
    Container,
    createContainer,
    ContainerDecorations,
    BorderRadiusUtils,
    BorderStyle,
    type ContainerProps,
    type BoxDecoration,
    type Border,
    type BorderRadius,
    type BoxShadow,
} from './container.js';

// Layout system exports
export {
    BoxConstraints,
    EdgeInsets,
    AlignmentUtils,
    Alignment,
    TextDirection,
    defaultTheme,
    type LayoutContext,
    type LayoutResult,
    type PaintContext,
    type ThemeData,
} from '../types/layout.js';

// Geometry types
export {
    type Point,
    type Size,
    type Rect,
    type Matrix,
} from '../types/geometry.js';

// Import types for internal use
import type { Widget } from './widget.js';
import type { LayoutContext, LayoutResult, PaintContext, ThemeData } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import {
    BoxConstraints,
    EdgeInsets,
    Alignment,
    TextDirection,
    defaultTheme
} from '../types/layout.js';
import { Text, TextAlign, TextStyles } from './text.js';
import { Container, ContainerDecorations } from './container.js';

/**
 * Widget builder function type for creating page content
 */
export type WidgetBuilder = () => Widget;

/**
 * Simple layout system for single widgets
 * 
 * Provides utilities for laying out and rendering single widgets
 * within a document page context.
 */
export class SingleWidgetLayout {
    private readonly widget: Widget;
    private readonly context: LayoutContext;
    private layoutResult?: LayoutResult;

    constructor(widget: Widget, context: LayoutContext) {
        this.widget = widget;
        this.context = context;
    }

    /**
     * Perform layout calculation
     */
    layout(): LayoutResult {
        if (!this.layoutResult) {
            this.layoutResult = this.widget.layout(this.context);
        }
        return this.layoutResult;
    }

    /**
     * Paint the widget to the given context
     */
    paint(paintContext: PaintContext): void {
        // Ensure layout has been calculated
        this.layout();

        // Paint the widget
        this.widget.paint(paintContext);
    }

    /**
     * Get the computed size after layout
     */
    getSize(): Size {
        const layout = this.layout();
        return layout.size;
    }

    /**
     * Get the baseline if available
     */
    getBaseline(): number | undefined {
        const layout = this.layout();
        return layout.baseline;
    }

    /**
     * Check if repaint is needed
     */
    needsRepaint(): boolean {
        const layout = this.layout();
        return layout.needsRepaint;
    }
}

/**
 * Convenience functions for common widget patterns
 */
export const WidgetHelpers = {
    /**
     * Create a simple text widget with default styling
     */
    text(content: string, options: {
        fontSize?: number;
        color?: string;
        align?: TextAlign;
    } = {}): Text {
        const style: any = {};
        if (options.fontSize !== undefined) {
            style.fontSize = options.fontSize;
        }
        if (options.color !== undefined) {
            style.color = options.color;
        }

        const textProps: any = { style };
        if (options.align !== undefined) {
            textProps.textAlign = options.align;
        }

        return new Text(content, textProps);
    },

    /**
     * Create a padded container
     */
    padded(child: Widget, padding: number): Container {
        return new Container({
            child,
            padding: EdgeInsets.all(padding),
        });
    },

    /**
     * Create a centered widget
     */
    center(child: Widget): Container {
        return new Container({
            child,
            alignment: Alignment.Center,
        });
    },

    /**
     * Create a sized box with fixed dimensions
     */
    sizedBox(width: number, height: number, child?: Widget): Container {
        const props: any = { width, height };
        if (child !== undefined) {
            props.child = child;
        }
        return new Container(props);
    },

    /**
     * Create a card-style container
     */
    card(child: Widget, options: {
        padding?: number;
        margin?: number;
    } = {}): Container {
        const props: any = {
            child,
            padding: EdgeInsets.all(options.padding ?? 16),
            decoration: ContainerDecorations.card,
        };

        if (options.margin !== undefined) {
            props.margin = EdgeInsets.all(options.margin);
        }

        return new Container(props);
    },

    /**
     * Create a simple page layout with title and content
     */
    simplePage(title: string, content: Widget): Container {
        return new Container({
            padding: EdgeInsets.all(20),
            child: new Container({
                child: new Text(title, {
                    style: TextStyles.h1,
                    textAlign: TextAlign.Center,
                }),
                // In a real implementation, this would be a Column widget
                // For now, just show the title
            }),
        });
    },
};

/**
 * Widget composition utilities for building complex layouts
 */
export const LayoutHelpers = {
    /**
     * Create a layout for a single widget within page constraints
     */
    createSingleWidgetLayout(
        widget: Widget,
        pageSize: Size,
        margin: number = 20
    ): SingleWidgetLayout {
        const marginInsets = EdgeInsets.all(margin);
        const availableConstraints = EdgeInsets.deflateConstraints(
            marginInsets,
            BoxConstraints.loose(pageSize)
        );

        const context: LayoutContext = {
            constraints: availableConstraints,
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        return new SingleWidgetLayout(widget, context);
    },

    /**
     * Calculate optimal font size for text to fit within given constraints
     */
    calculateOptimalFontSize(
        text: string,
        maxWidth: number,
        maxHeight: number,
        minFontSize: number = 8,
        maxFontSize: number = 72
    ): number {
        // Simple binary search for optimal font size
        // In a real implementation, this would use actual font metrics
        let low = minFontSize;
        let high = maxFontSize;
        let bestSize = minFontSize;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);

            // Estimate text dimensions (simplified calculation)
            const estimatedWidth = text.length * mid * 0.6;
            const estimatedHeight = mid * 1.2;

            if (estimatedWidth <= maxWidth && estimatedHeight <= maxHeight) {
                bestSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return bestSize;
    },
};

/**
 * Default page configurations
 */
export const PageDefaults = {
    /** A4 page size in points (72 DPI) */
    A4: { width: 595, height: 842 } as Size,

    /** Letter page size in points */
    Letter: { width: 612, height: 792 } as Size,

    /** Default margins */
    margins: EdgeInsets.all(72), // 1 inch margins

    /** Default theme */
    theme: defaultTheme,
};