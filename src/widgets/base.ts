/**
 * Base Widget System - Consolidated
 * 
 * Consolidates base widget functionality and utilities into a single focused module.
 * Replaces fragmented helper classes with unified WidgetUtils.
 * 
 * @packageDocumentation
 */

import {
    Layout,
    Geometry,
} from '../types.js';

/**
 * Base Widget interface
 * 
 * All widgets must implement layout() and paint() methods for the
 * constraint-based layout system.
 */
export interface Widget {
    /**
     * Compute the layout for this widget given constraints
     */
    layout(context: Layout.LayoutContext): Layout.LayoutResult;

    /**
     * Paint this widget to the graphics context
     */
    paint(context: Layout.PaintContext): void;

    /**
     * Optional widget key for identification
     */
    readonly key?: string;

    /**
     * Optional debug label
     */
    readonly debugLabel?: string;
}

/**
 * Base properties common to all widgets
 */
export interface WidgetProps {
    /** Widget key for identification */
    key?: string;
    /** Debug label for development */
    debugLabel?: string;
}

/**
 * Abstract base class for widgets
 */
export abstract class BaseWidget implements Widget {
    readonly key?: string;
    readonly debugLabel?: string;

    constructor(props: WidgetProps = {}) {
        Object.defineProperty(this, 'key', {
            value: props.key,
            writable: false,
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'debugLabel', {
            value: props.debugLabel,
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    abstract layout(context: Layout.LayoutContext): Layout.LayoutResult;
    abstract paint(context: Layout.PaintContext): void;

    /**
     * Helper method to create a basic layout result
     */
    protected createLayoutResult(
        size: Geometry.Size,
        options: {
            baseline?: number;
            needsRepaint?: boolean;
        } = {}
    ): Layout.LayoutResult {
        const result: Layout.LayoutResult & { baseline?: number } = {
            size,
            needsRepaint: options.needsRepaint ?? true,
        };

        if (options.baseline !== undefined) {
            result.baseline = options.baseline;
        }

        return result;
    }

    /**
     * Helper method to validate constraints
     */
    protected validateConstraints(constraints: Layout.BoxConstraints): void {
        // Basic constraint validation - check that min <= max
        if (constraints.minWidth > constraints.maxWidth || constraints.minHeight > constraints.maxHeight) {
            throw new Error(
                `Invalid constraints: ${JSON.stringify(constraints)} for widget ${this.debugLabel || this.constructor.name}`
            );
        }
    }

    /**
     * Helper method to constrain size
     */
    protected constrainSize(constraints: Layout.BoxConstraints, size: Geometry.Size): Geometry.Size {
        return Layout.BoxConstraints.constrain(constraints, size);
    }
}

/**
 * Widget that renders nothing
 */
export class EmptyWidget extends BaseWidget {
    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);
        return this.createLayoutResult(
            { width: 0, height: 0 },
            { needsRepaint: false }
        );
    }

    paint(context: Layout.PaintContext): void {
        // Empty widget renders nothing
    }
}

/**
 * Unified Widget Utilities - Consolidates 12+ helper classes
 * 
 * Replaces:
 * - WidgetComposition, WidgetUtils
 * - WidgetHelpers, LayoutHelpers  
 * - AlignHelpers, CenterHelpers
 * - PaddingHelpers, MarginHelpers
 * - PositionedHelpers, StackHelpers
 * - ContainerDecorations, TextStyles
 */
export const WidgetUtils = {
    /**
     * Create a sized box with fixed dimensions
     */
    sizedBox(width: number, height: number, child?: Widget): Widget {
        return new (class SizedBox extends BaseWidget {
            private readonly child?: Widget;
            private readonly fixedSize: Geometry.Size;

            constructor() {
                super({ debugLabel: 'SizedBox' });
                if (child) this.child = child;
                this.fixedSize = { width, height };
            }

            layout(context: Layout.LayoutContext): Layout.LayoutResult {
                this.validateConstraints(context.constraints);

                if (this.child) {
                    const childConstraints: Layout.BoxConstraints = {
                        minWidth: this.fixedSize.width,
                        maxWidth: this.fixedSize.width,
                        minHeight: this.fixedSize.height,
                        maxHeight: this.fixedSize.height,
                    };

                    const childContext: Layout.LayoutContext = {
                        ...context,
                        constraints: childConstraints,
                    };

                    this.child.layout(childContext);
                }

                const constrainedSize = this.constrainSize(context.constraints, this.fixedSize);
                return this.createLayoutResult(constrainedSize);
            }

            paint(context: Layout.PaintContext): void {
                if (this.child) {
                    const childContext: Layout.PaintContext = {
                        ...context,
                        size: this.fixedSize,
                    };
                    this.child.paint(childContext);
                }
            }
        })();
    },

    /**
     * Create a spacer that expands to fill available space
     */
    spacer(): Widget {
        return new (class Spacer extends BaseWidget {
            constructor() {
                super({ debugLabel: 'Spacer' });
            }

            layout(context: Layout.LayoutContext): Layout.LayoutResult {
                this.validateConstraints(context.constraints);
                const size: Geometry.Size = {
                    width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                        ? context.constraints.minWidth
                        : context.constraints.maxWidth,
                    height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                        ? context.constraints.minHeight
                        : context.constraints.maxHeight,
                };
                return this.createLayoutResult(size, { needsRepaint: false });
            }

            paint(context: Layout.PaintContext): void {
                // Spacer renders nothing
            }
        })();
    },

    /**
     * Compose multiple widget behaviors (functional composition)
     */
    compose<T extends Widget>(...behaviors: Array<(widget: T) => T>): (widget: T) => T {
        return (widget: T) => behaviors.reduce((w, behavior) => behavior(w), widget);
    },

    /**
     * Add debugging information to a widget
     */
    withDebug<T extends Widget>(label: string): (widget: T) => T & { debugLabel: string } {
        return (widget: T) => ({
            ...widget,
            debugLabel: label,
        });
    },

    /**
     * Add constraint validation to a widget
     */
    withConstraintValidation<T extends Widget>(strictMode = true): (widget: T) => T {
        const originalLayout = (widget: T) => widget.layout.bind(widget);

        return (widget: T) => ({
            ...widget,
            layout: (context: Layout.LayoutContext): Layout.LayoutResult => {
                if (strictMode) {
                    // Basic constraint validation - real validation would check min/max relationships
                    const c = context.constraints;
                    if (c.minWidth > c.maxWidth || c.minHeight > c.maxHeight) {
                        throw new Error(
                            `Invalid constraints for widget ${widget.debugLabel || 'unknown'}: ${JSON.stringify(context.constraints)}`
                        );
                    }
                }

                const result = originalLayout(widget)(context);

                if (strictMode) {
                    const s = result.size;
                    const c = context.constraints;
                    if (s.width < c.minWidth || s.width > c.maxWidth || s.height < c.minHeight || s.height > c.maxHeight) {
                        throw new Error(
                            `Widget ${widget.debugLabel || 'unknown'} violated constraints. ` +
                            `Expected: ${JSON.stringify(context.constraints)}, ` +
                            `Got: ${JSON.stringify(result.size)}`
                        );
                    }
                }

                return result;
            },
        });
    },

    /**
     * Add performance monitoring to a widget
     */
    withPerformanceMonitoring<T extends Widget>(enableLogging = false): (widget: T) => T {
        const originalLayout = (widget: T) => widget.layout.bind(widget);
        const originalPaint = (widget: T) => widget.paint.bind(widget);

        return (widget: T) => ({
            ...widget,
            layout: (context: Layout.LayoutContext): Layout.LayoutResult => {
                const start = performance.now();
                const result = originalLayout(widget)(context);
                const duration = performance.now() - start;

                if (enableLogging) {
                    console.log(`Layout ${widget.debugLabel || 'unknown'}: ${duration.toFixed(2)}ms`);
                }

                return result;
            },
            paint: (context: Layout.PaintContext): void => {
                const start = performance.now();
                originalPaint(widget)(context);
                const duration = performance.now() - start;

                if (enableLogging) {
                    console.log(`Paint ${widget.debugLabel || 'unknown'}: ${duration.toFixed(2)}ms`);
                }
            },
        });
    },
};

/**
 * Layout calculation utilities
 */
export const WidgetLayoutUtils = {
    /**
     * Calculate optimal font size for text to fit within constraints
     */
    calculateOptimalFontSize(
        text: string,
        maxWidth: number,
        maxHeight: number,
        minFontSize: number = 8,
        maxFontSize: number = 72
    ): number {
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

    /**
     * Create constraints for a child widget
     */
    createChildConstraints(
        parentConstraints: Layout.BoxConstraints,
        padding?: Layout.EdgeInsets,
        margin?: Layout.EdgeInsets
    ): Layout.BoxConstraints {
        let constraints = parentConstraints;

        if (margin) {
            constraints = Layout.EdgeInsets.deflateConstraints(margin, constraints);
        }

        if (padding) {
            constraints = Layout.EdgeInsets.deflateConstraints(padding, constraints);
        }

        return constraints;
    },

    /**
     * Position a child widget within parent bounds
     */
    positionChild(
        childSize: Geometry.Size,
        parentSize: Geometry.Size,
        alignment: Layout.Alignment = Layout.Alignment.Center,
        padding?: Layout.EdgeInsets
    ): Geometry.Point {
        const availableSize: Geometry.Size = padding
            ? {
                width: parentSize.width - Layout.EdgeInsets.horizontal(padding),
                height: parentSize.height - Layout.EdgeInsets.vertical(padding)
            }
            : parentSize;

        const position = Layout.AlignmentUtils.resolve(alignment, availableSize, childSize);

        if (padding) {
            return {
                x: position.x + padding.left,
                y: position.y + padding.top
            };
        }

        return position;
    },
};

/**
 * Page configuration defaults
 */
export const PageDefaults = {
    /** A4 page size in points (72 DPI) */
    A4: { width: 595, height: 842 } as Geometry.Size,

    /** Letter page size in points */
    Letter: { width: 612, height: 792 } as Geometry.Size,

    /** Default margins - MARGIN FIX: Reduced from 72pts to 20pts */
    margins: Layout.EdgeInsets.all(20), // Reasonable margins for better page utilization
};