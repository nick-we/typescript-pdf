/**
 * Constraint-Based Layout System
 * 
 * Implements Flutter-style constraint propagation and size negotiation
 * for the typescript-pdf widget system.
 * 
 * @packageDocumentation
 */

import type { Size } from '../types/geometry.js';
import type { BoxConstraints, LayoutContext, LayoutResult } from '../types/layout.js';
import type { Widget } from '../widgets/widget.js';

/**
 * Layout constraint solver that handles constraint propagation
 * and size negotiation between parent and child widgets.
 */
export class ConstraintSolver {
    private readonly constraintCache = new Map<string, BoxConstraints>();
    private readonly layoutCache = new Map<string, LayoutResult>();

    /**
     * Generate a cache key for a widget and constraints combination
     */
    private getCacheKey(widget: Widget, constraints: BoxConstraints): string {
        const widgetId = widget.key || widget.debugLabel || widget.constructor.name;
        return `${widgetId}:${constraints.minWidth}:${constraints.maxWidth}:${constraints.minHeight}:${constraints.maxHeight}`;
    }

    /**
     * Solve layout for a widget tree with constraint propagation
     */
    solveLayout(
        widget: Widget,
        context: LayoutContext,
        options: {
            useCache?: boolean;
            validateConstraints?: boolean;
        } = {}
    ): LayoutResult {
        const { useCache = true, validateConstraints = true } = options;
        const cacheKey = this.getCacheKey(widget, context.constraints);

        // Check cache first
        if (useCache) {
            const cached = this.layoutCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Validate constraints if requested
        if (validateConstraints && !this.isValidConstraints(context.constraints)) {
            throw new Error(
                `Invalid constraints for widget ${widget.debugLabel || widget.constructor.name}: ` +
                `min(${context.constraints.minWidth}, ${context.constraints.minHeight}) ` +
                `max(${context.constraints.maxWidth}, ${context.constraints.maxHeight})`
            );
        }

        // Perform layout
        const result = widget.layout(context);

        // Validate result against constraints
        if (validateConstraints && !this.satisfiesConstraints(context.constraints, result.size)) {
            throw new Error(
                `Widget ${widget.debugLabel || widget.constructor.name} violated constraints. ` +
                `Expected: min(${context.constraints.minWidth}, ${context.constraints.minHeight}) ` +
                `max(${context.constraints.maxWidth}, ${context.constraints.maxHeight}), ` +
                `Got: (${result.size.width}, ${result.size.height})`
            );
        }

        // Cache result
        if (useCache) {
            this.layoutCache.set(cacheKey, result);
        }

        return result;
    }

    /**
     * Propagate constraints down to child widgets
     */
    propagateConstraints(
        parentConstraints: BoxConstraints,
        childRequirements: {
            width?: number;
            height?: number;
            minWidth?: number;
            minHeight?: number;
            maxWidth?: number;
            maxHeight?: number;
            flex?: number;
        } = {}
    ): BoxConstraints {
        const {
            width,
            height,
            minWidth = 0,
            minHeight = 0,
            maxWidth = parentConstraints.maxWidth,
            maxHeight = parentConstraints.maxHeight,
        } = childRequirements;

        // If width/height are specified, create tight constraints
        if (width !== undefined && height !== undefined) {
            return {
                minWidth: width,
                maxWidth: width,
                minHeight: height,
                maxHeight: height,
            };
        }

        // Create loose constraints with parent limits
        return {
            minWidth: Math.max(minWidth, parentConstraints.minWidth),
            maxWidth: width !== undefined ? width : Math.min(maxWidth, parentConstraints.maxWidth),
            minHeight: Math.max(minHeight, parentConstraints.minHeight),
            maxHeight: height !== undefined ? height : Math.min(maxHeight, parentConstraints.maxHeight),
        };
    }

    /**
     * Negotiate size between parent and child widgets
     */
    negotiateSize(
        childResults: LayoutResult[],
        parentConstraints: BoxConstraints,
        strategy: 'fit' | 'expand' | 'wrap' = 'wrap'
    ): Size {
        if (childResults.length === 0) {
            return { width: parentConstraints.minWidth, height: parentConstraints.minHeight };
        }

        switch (strategy) {
            case 'fit':
                // Fit all children within parent constraints
                return this.fitChildren(childResults, parentConstraints);

            case 'expand':
                // Expand to fill parent constraints
                return {
                    width: parentConstraints.maxWidth === Number.POSITIVE_INFINITY
                        ? parentConstraints.minWidth
                        : parentConstraints.maxWidth,
                    height: parentConstraints.maxHeight === Number.POSITIVE_INFINITY
                        ? parentConstraints.minHeight
                        : parentConstraints.maxHeight,
                };

            case 'wrap':
            default:
                // Wrap around children
                return this.wrapChildren(childResults, parentConstraints);
        }
    }

    /**
     * Calculate intrinsic dimensions for a widget
     */
    calculateIntrinsicDimensions(
        widget: Widget,
        context: LayoutContext,
        dimension: 'width' | 'height'
    ): { min: number; max: number } {
        // Create test constraints for measuring intrinsic dimensions
        const testConstraints = dimension === 'width'
            ? { ...context.constraints, minWidth: 0, maxWidth: Number.POSITIVE_INFINITY }
            : { ...context.constraints, minHeight: 0, maxHeight: Number.POSITIVE_INFINITY };

        const testContext = { ...context, constraints: testConstraints };
        const result = widget.layout(testContext);

        const size = dimension === 'width' ? result.size.width : result.size.height;
        return { min: size, max: size };
    }

    /**
     * Clear layout cache
     */
    clearCache(): void {
        this.constraintCache.clear();
        this.layoutCache.clear();
    }

    /**
     * Clear cache for specific widget
     */
    clearCacheForWidget(widget: Widget): void {
        const widgetId = widget.key || widget.debugLabel || widget.constructor.name;

        for (const key of this.layoutCache.keys()) {
            if (key.startsWith(`${widgetId}:`)) {
                this.layoutCache.delete(key);
            }
        }

        for (const key of this.constraintCache.keys()) {
            if (key.startsWith(`${widgetId}:`)) {
                this.constraintCache.delete(key);
            }
        }
    }

    /**
     * Validate that constraints are valid
     */
    private isValidConstraints(constraints: BoxConstraints): boolean {
        return (
            constraints.minWidth >= 0 &&
            constraints.maxWidth >= constraints.minWidth &&
            constraints.minHeight >= 0 &&
            constraints.maxHeight >= constraints.minHeight &&
            isFinite(constraints.minWidth) &&
            isFinite(constraints.minHeight)
        );
    }

    /**
     * Check if a size satisfies constraints
     */
    private satisfiesConstraints(constraints: BoxConstraints, size: Size): boolean {
        return (
            size.width >= constraints.minWidth &&
            size.width <= constraints.maxWidth &&
            size.height >= constraints.minHeight &&
            size.height <= constraints.maxHeight
        );
    }

    /**
     * Fit all children within parent constraints
     */
    private fitChildren(childResults: LayoutResult[], parentConstraints: BoxConstraints): Size {
        let maxWidth = 0;
        let maxHeight = 0;

        for (const result of childResults) {
            maxWidth = Math.max(maxWidth, result.size.width);
            maxHeight = Math.max(maxHeight, result.size.height);
        }

        return {
            width: Math.min(maxWidth, parentConstraints.maxWidth),
            height: Math.min(maxHeight, parentConstraints.maxHeight),
        };
    }

    /**
     * Wrap around children sizes
     */
    private wrapChildren(childResults: LayoutResult[], parentConstraints: BoxConstraints): Size {
        let totalWidth = 0;
        let totalHeight = 0;

        for (const result of childResults) {
            totalWidth += result.size.width;
            totalHeight = Math.max(totalHeight, result.size.height);
        }

        return {
            width: Math.max(parentConstraints.minWidth, Math.min(totalWidth, parentConstraints.maxWidth)),
            height: Math.max(parentConstraints.minHeight, Math.min(totalHeight, parentConstraints.maxHeight)),
        };
    }
}

/**
 * Global constraint solver instance
 */
export const globalConstraintSolver = new ConstraintSolver();

/**
 * Layout performance monitor for debugging
 */
export class LayoutPerformanceMonitor {
    private readonly measurements = new Map<string, {
        count: number;
        totalTime: number;
        averageTime: number;
        maxTime: number;
        minTime: number;
    }>();

    /**
     * Measure layout performance for a widget
     */
    measure<T>(
        widgetName: string,
        operation: () => T
    ): T {
        const start = performance.now();
        const result = operation();
        const duration = performance.now() - start;

        this.recordMeasurement(widgetName, duration);
        return result;
    }

    /**
     * Get performance statistics
     */
    getStats(): Record<string, {
        count: number;
        totalTime: number;
        averageTime: number;
        maxTime: number;
        minTime: number;
    }> {
        return Object.fromEntries(this.measurements);
    }

    /**
     * Clear performance measurements
     */
    clear(): void {
        this.measurements.clear();
    }

    /**
     * Record a measurement
     */
    private recordMeasurement(widgetName: string, duration: number): void {
        const existing = this.measurements.get(widgetName);

        if (existing) {
            existing.count++;
            existing.totalTime += duration;
            existing.averageTime = existing.totalTime / existing.count;
            existing.maxTime = Math.max(existing.maxTime, duration);
            existing.minTime = Math.min(existing.minTime, duration);
        } else {
            this.measurements.set(widgetName, {
                count: 1,
                totalTime: duration,
                averageTime: duration,
                maxTime: duration,
                minTime: duration,
            });
        }
    }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new LayoutPerformanceMonitor();