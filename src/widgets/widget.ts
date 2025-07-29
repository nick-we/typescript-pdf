/**
 * Base Widget interface and implementation
 * 
 * Implements the core Widget system based on composition-over-inheritance
 * principles with constraint-based layout.
 * 
 * @packageDocumentation
 */

import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
} from '../types/layout.js';
import { BoxConstraints } from '../types/layout.js';
import type { Size } from '../types/geometry.js';

/**
 * Base Widget interface
 * 
 * All widgets must implement layout() and paint() methods for the
 * constraint-based layout system.
 */
export interface Widget {
    /**
     * Compute the layout for this widget given constraints
     * 
     * @param context - Layout context containing constraints and theme
     * @returns Layout result with size and other layout information
     */
    layout(context: LayoutContext): LayoutResult;

    /**
     * Paint this widget to the graphics context
     * 
     * @param context - Paint context containing graphics and size information
     */
    paint(context: PaintContext): void;

    /**
     * Optional widget key for identification and debugging
     */
    readonly key?: string;

    /**
     * Optional debug label for development
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
 * Abstract base class for widgets that provides common functionality
 * 
 * This is optional - widgets can implement the Widget interface directly
 * for maximum flexibility with composition.
 */
export abstract class BaseWidget implements Widget {
    readonly key?: string;
    readonly debugLabel?: string;

    constructor(props: WidgetProps = {}) {
        if (props.key !== undefined) {
            (this as any).key = props.key;
        }
        if (props.debugLabel !== undefined) {
            (this as any).debugLabel = props.debugLabel;
        }
    }

    /**
     * Abstract layout method to be implemented by subclasses
     */
    abstract layout(context: LayoutContext): LayoutResult;

    /**
     * Abstract paint method to be implemented by subclasses
     */
    abstract paint(context: PaintContext): void;

    /**
     * Helper method to create a basic layout result
     */
    protected createLayoutResult(
        size: Size,
        options: {
            baseline?: number;
            needsRepaint?: boolean;
        } = {}
    ): LayoutResult {
        if (options.baseline !== undefined) {
            return {
                size,
                baseline: options.baseline,
                needsRepaint: options.needsRepaint ?? true,
            };
        }

        return {
            size,
            needsRepaint: options.needsRepaint ?? true,
        };
    }

    /**
     * Helper method to validate constraints
     */
    protected validateConstraints(constraints: BoxConstraints): void {
        if (!BoxConstraints.isValid(constraints)) {
            throw new Error(
                `Invalid constraints: ${JSON.stringify(constraints)} for widget ${this.debugLabel || this.constructor.name
                }`
            );
        }
    }

    /**
     * Helper method to constrain size to given constraints
     */
    protected constrainSize(constraints: BoxConstraints, size: Size): Size {
        return BoxConstraints.constrain(constraints, size);
    }
}

/**
 * Widget that renders nothing (useful for conditional rendering)
 */
export class EmptyWidget extends BaseWidget {
    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        return this.createLayoutResult(
            { width: 0, height: 0 },
            { needsRepaint: false }
        );
    }

    paint(context: PaintContext): void {
        // Empty widget renders nothing
    }
}

/**
 * Widget composition utilities following the composition-over-inheritance principle
 */
export const WidgetComposition = {
    /**
     * Compose multiple widget behaviors
     */
    compose<T extends Widget>(...behaviors: Array<(widget: T) => T>): (widget: T) => T {
        return (widget: T) => behaviors.reduce((w, behavior) => behavior(w), widget);
    },

    /**
     * Higher-order widget function that adds debugging information
     */
    withDebug<T extends Widget>(label: string): (widget: T) => T & { debugLabel: string } {
        return (widget: T) => ({
            ...widget,
            debugLabel: label,
        });
    },

    /**
     * Higher-order widget function that adds size constraints validation
     */
    withConstraintValidation<T extends Widget>(strictMode = true): (widget: T) => T {
        const originalLayout = (widget: T) => widget.layout.bind(widget);

        return (widget: T) => ({
            ...widget,
            layout: (context: LayoutContext): LayoutResult => {
                if (strictMode && !BoxConstraints.isValid(context.constraints)) {
                    throw new Error(
                        `Invalid constraints for widget ${widget.debugLabel || 'unknown'}: ${JSON.stringify(context.constraints)}`
                    );
                }

                const result = originalLayout(widget)(context);

                if (strictMode && !BoxConstraints.satisfies(context.constraints, result.size)) {
                    throw new Error(
                        `Widget ${widget.debugLabel || 'unknown'} violated constraints. ` +
                        `Expected: ${JSON.stringify(context.constraints)}, ` +
                        `Got: ${JSON.stringify(result.size)}`
                    );
                }

                return result;
            },
        });
    },

    /**
     * Higher-order widget function that adds performance monitoring
     */
    withPerformanceMonitoring<T extends Widget>(enableLogging = false): (widget: T) => T {
        const originalLayout = (widget: T) => widget.layout.bind(widget);
        const originalPaint = (widget: T) => widget.paint.bind(widget);

        return (widget: T) => ({
            ...widget,
            layout: (context: LayoutContext): LayoutResult => {
                const start = performance.now();
                const result = originalLayout(widget)(context);
                const duration = performance.now() - start;

                if (enableLogging) {
                    console.log(`Layout ${widget.debugLabel || 'unknown'}: ${duration.toFixed(2)}ms`);
                }

                return result;
            },
            paint: (context: PaintContext): void => {
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
 * Widget creation helper functions
 */
export const WidgetUtils = {
    /**
     * Create a widget that always has the same size
     */
    createSizedBox(size: Size, props: WidgetProps = {}): Widget {
        return new (class SizedBox extends BaseWidget {
            constructor() {
                super({ ...props, debugLabel: props.debugLabel || 'SizedBox' });
            }

            layout(context: LayoutContext): LayoutResult {
                this.validateConstraints(context.constraints);
                const constrainedSize = this.constrainSize(context.constraints, size);
                return this.createLayoutResult(constrainedSize);
            }

            paint(context: PaintContext): void {
                // SizedBox renders nothing, just reserves space
            }
        })();
    },

    /**
     * Create a spacer widget that expands to fill available space
     */
    createSpacer(props: WidgetProps = {}): Widget {
        return new (class Spacer extends BaseWidget {
            constructor() {
                super({ ...props, debugLabel: props.debugLabel || 'Spacer' });
            }

            layout(context: LayoutContext): LayoutResult {
                this.validateConstraints(context.constraints);
                const size: Size = {
                    width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                        ? context.constraints.minWidth
                        : context.constraints.maxWidth,
                    height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                        ? context.constraints.minHeight
                        : context.constraints.maxHeight,
                };
                return this.createLayoutResult(size, { needsRepaint: false });
            }

            paint(context: PaintContext): void {
                // Spacer renders nothing
            }
        })();
    },
};
