/**
 * Unit tests for ConstraintSolver and LayoutPerformanceMonitor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConstraintSolver, LayoutPerformanceMonitor, globalConstraintSolver, globalPerformanceMonitor } from '../layout/constraint-solver.js';
import { BaseWidget } from '../widgets/widget.js';
import type { LayoutContext, LayoutResult, BoxConstraints, ThemeData } from '../types/layout.js';
import { TextDirection } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { FontWeight, ThemeUtils } from '../types/theming.js';

// Mock widget for testing
class MockWidget extends BaseWidget {
    constructor(
        private mockSize: Size = { width: 100, height: 50 },
        debugLabel?: string
    ) {
        super(debugLabel ? { debugLabel } : {});
    }

    layout(context: LayoutContext): LayoutResult {
        return {
            size: this.mockSize,
            needsRepaint: false,
        };
    }

    paint(): void {
        // Mock paint implementation
    }
}

// Mock widget that violates constraints
class ConstraintViolatingWidget extends BaseWidget {
    layout(context: LayoutContext): LayoutResult {
        return {
            size: { width: context.constraints.maxWidth + 100, height: context.constraints.maxHeight + 100 },
            needsRepaint: false,
        };
    }

    paint(): void {
        // Mock paint implementation  
    }
}

describe('ConstraintSolver', () => {
    let solver: ConstraintSolver;
    let mockWidget: MockWidget;
    let mockContext: LayoutContext;

    beforeEach(() => {
        solver = new ConstraintSolver();
        mockWidget = new MockWidget();
        mockContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 200,
                minHeight: 0,
                maxHeight: 100,
            },
            textDirection: TextDirection.LeftToRight,
            theme: ThemeUtils.light(),
        };
    });

    describe('solveLayout', () => {
        it('should solve layout for valid widget and cache result', () => {
            const result = solver.solveLayout(mockWidget, mockContext);

            expect(result).toEqual({
                size: { width: 100, height: 50 },
                needsRepaint: false,
            });
        });

        it('should return cached result on subsequent calls', () => {
            const layoutSpy = vi.spyOn(mockWidget, 'layout');

            // First call should invoke layout
            const result1 = solver.solveLayout(mockWidget, mockContext);
            expect(layoutSpy).toHaveBeenCalledTimes(1);

            // Second call should use cache
            const result2 = solver.solveLayout(mockWidget, mockContext);
            expect(layoutSpy).toHaveBeenCalledTimes(1);
            expect(result1).toEqual(result2);
        });

        it('should bypass cache when useCache is false', () => {
            const layoutSpy = vi.spyOn(mockWidget, 'layout');

            solver.solveLayout(mockWidget, mockContext, { useCache: false });
            solver.solveLayout(mockWidget, mockContext, { useCache: false });

            expect(layoutSpy).toHaveBeenCalledTimes(2);
        });

        it('should validate constraints when enabled', () => {
            const invalidConstraints = {
                ...mockContext,
                constraints: {
                    minWidth: -10,
                    maxWidth: 200,
                    minHeight: 0,
                    maxHeight: 100,
                },
            };

            expect(() => {
                solver.solveLayout(mockWidget, invalidConstraints, { validateConstraints: true });
            }).toThrow('Invalid constraints');
        });

        it('should throw error when widget violates constraints', () => {
            const violatingWidget = new ConstraintViolatingWidget();

            expect(() => {
                solver.solveLayout(violatingWidget, mockContext, { validateConstraints: true });
            }).toThrow('violated constraints');
        });

        it('should handle infinite constraints', () => {
            const infiniteContext = {
                ...mockContext,
                constraints: {
                    minWidth: 0,
                    maxWidth: Number.POSITIVE_INFINITY,
                    minHeight: 0,
                    maxHeight: Number.POSITIVE_INFINITY,
                },
            };

            const result = solver.solveLayout(mockWidget, infiniteContext);
            expect(result.size).toEqual({ width: 100, height: 50 });
        });
    });

    describe('propagateConstraints', () => {
        const parentConstraints: BoxConstraints = {
            minWidth: 10,
            maxWidth: 200,
            minHeight: 5,
            maxHeight: 100,
        };

        it('should create tight constraints when width and height are specified', () => {
            const result = solver.propagateConstraints(parentConstraints, {
                width: 150,
                height: 75,
            });

            expect(result).toEqual({
                minWidth: 150,
                maxWidth: 150,
                minHeight: 75,
                maxHeight: 75,
            });
        });

        it('should create loose constraints when only min/max are specified', () => {
            const result = solver.propagateConstraints(parentConstraints, {
                minWidth: 20,
                maxWidth: 180,
                minHeight: 10,
                maxHeight: 90,
            });

            expect(result).toEqual({
                minWidth: 20,
                maxWidth: 180,
                minHeight: 10,
                maxHeight: 90,
            });
        });

        it('should respect parent constraint limits', () => {
            const result = solver.propagateConstraints(parentConstraints, {
                minWidth: 5, // Less than parent min
                maxWidth: 300, // More than parent max
                minHeight: 0, // Less than parent min
                maxHeight: 150, // More than parent max
            });

            expect(result).toEqual({
                minWidth: 10, // Clamped to parent min
                maxWidth: 200, // Clamped to parent max
                minHeight: 5, // Clamped to parent min
                maxHeight: 100, // Clamped to parent max
            });
        });

        it('should handle partial specifications', () => {
            const result = solver.propagateConstraints(parentConstraints, {
                width: 150,
                minHeight: 20,
            });

            expect(result).toEqual({
                minWidth: 10, // Math.max(0, parentConstraints.minWidth)
                maxWidth: 150, // width specified
                minHeight: 20, // specified minHeight
                maxHeight: 100, // from parent constraints
            });
        });
    });

    describe('negotiateSize', () => {
        const parentConstraints: BoxConstraints = {
            minWidth: 50,
            maxWidth: 300,
            minHeight: 25,
            maxHeight: 150,
        };

        const childResults: LayoutResult[] = [
            { size: { width: 100, height: 50 }, needsRepaint: false },
            { size: { width: 80, height: 60 }, needsRepaint: false },
            { size: { width: 120, height: 40 }, needsRepaint: false },
        ];

        it('should wrap around children by default', () => {
            const result = solver.negotiateSize(childResults, parentConstraints);

            // Should sum widths and take max height
            expect(result).toEqual({
                width: 300, // min(100+80+120, 300) = 300
                height: 60, // max(50, 60, 40) = 60
            });
        });

        it('should fit children within constraints', () => {
            const result = solver.negotiateSize(childResults, parentConstraints, 'fit');

            // Should take max width and height, constrained by parent
            expect(result).toEqual({
                width: 120, // min(max(100, 80, 120), 300) = 120
                height: 60,  // min(max(50, 60, 40), 150) = 60
            });
        });

        it('should expand to fill parent constraints', () => {
            const result = solver.negotiateSize(childResults, parentConstraints, 'expand');

            expect(result).toEqual({
                width: 300, // maxWidth
                height: 150, // maxHeight
            });
        });

        it('should handle empty children array', () => {
            const result = solver.negotiateSize([], parentConstraints);

            expect(result).toEqual({
                width: 50, // minWidth
                height: 25, // minHeight
            });
        });

        it('should handle infinite parent constraints', () => {
            const infiniteConstraints: BoxConstraints = {
                minWidth: 0,
                maxWidth: Number.POSITIVE_INFINITY,
                minHeight: 0,
                maxHeight: Number.POSITIVE_INFINITY,
            };

            const result = solver.negotiateSize(childResults, infiniteConstraints, 'expand');

            expect(result).toEqual({
                width: 0, // Falls back to minWidth
                height: 0, // Falls back to minHeight
            });
        });
    });

    describe('calculateIntrinsicDimensions', () => {
        it('should calculate intrinsic width', () => {
            const result = solver.calculateIntrinsicDimensions(mockWidget, mockContext, 'width');

            expect(result).toEqual({
                min: 100,
                max: 100,
            });
        });

        it('should calculate intrinsic height', () => {
            const result = solver.calculateIntrinsicDimensions(mockWidget, mockContext, 'height');

            expect(result).toEqual({
                min: 50,
                max: 50,
            });
        });
    });

    describe('cache management', () => {
        it('should clear all cache', () => {
            // Populate cache
            solver.solveLayout(mockWidget, mockContext);

            // Clear cache
            solver.clearCache();

            // Should call layout again after clearing
            const layoutSpy = vi.spyOn(mockWidget, 'layout');
            solver.solveLayout(mockWidget, mockContext);
            expect(layoutSpy).toHaveBeenCalledTimes(1);
        });

        it('should clear cache for specific widget', () => {
            const widget1 = new MockWidget({ width: 100, height: 50 }, 'widget1');
            const widget2 = new MockWidget({ width: 200, height: 100 }, 'widget2');

            // Populate cache for both widgets
            solver.solveLayout(widget1, mockContext);
            solver.solveLayout(widget2, mockContext);

            // Clear cache for widget1 only
            solver.clearCacheForWidget(widget1);

            // widget1 should call layout again, widget2 should use cache
            const layout1Spy = vi.spyOn(widget1, 'layout');
            const layout2Spy = vi.spyOn(widget2, 'layout');

            solver.solveLayout(widget1, mockContext);
            solver.solveLayout(widget2, mockContext);

            expect(layout1Spy).toHaveBeenCalledTimes(1);
            expect(layout2Spy).toHaveBeenCalledTimes(0);
        });
    });

    describe('constraint validation', () => {
        it('should identify valid constraints', () => {
            const validConstraints: BoxConstraints = {
                minWidth: 0,
                maxWidth: 100,
                minHeight: 0,
                maxHeight: 50,
            };

            // Access private method through any cast for testing
            const isValid = (solver as any).isValidConstraints(validConstraints);
            expect(isValid).toBe(true);
        });

        it('should identify invalid constraints', () => {
            const invalidConstraints: BoxConstraints = {
                minWidth: 100,
                maxWidth: 50, // max < min
                minHeight: 0,
                maxHeight: 50,
            };

            const isValid = (solver as any).isValidConstraints(invalidConstraints);
            expect(isValid).toBe(false);
        });

        it('should identify constraints with negative values', () => {
            const negativeConstraints: BoxConstraints = {
                minWidth: -10,
                maxWidth: 100,
                minHeight: 0,
                maxHeight: 50,
            };

            const isValid = (solver as any).isValidConstraints(negativeConstraints);
            expect(isValid).toBe(false);
        });
    });
});

describe('LayoutPerformanceMonitor', () => {
    let monitor: LayoutPerformanceMonitor;

    beforeEach(() => {
        monitor = new LayoutPerformanceMonitor();
    });

    describe('measure', () => {
        it('should measure operation performance', () => {
            const result = monitor.measure('testWidget', () => {
                // Simulate some work
                let sum = 0;
                for (let i = 0; i < 1000; i++) {
                    sum += i;
                }
                return sum;
            });

            expect(result).toBe(499500); // Sum of 0-999

            const stats = monitor.getStats();
            expect(stats['testWidget']).toBeDefined();
            expect(stats['testWidget']!.count).toBe(1);
            expect(stats['testWidget']!.totalTime).toBeGreaterThan(0);
            expect(stats['testWidget']!.averageTime).toBeGreaterThan(0);
        });

        it('should track multiple measurements', () => {
            monitor.measure('testWidget', () => 'result1');
            monitor.measure('testWidget', () => 'result2');
            monitor.measure('testWidget', () => 'result3');

            const stats = monitor.getStats();
            expect(stats['testWidget']!.count).toBe(3);
            expect(stats['testWidget']!.averageTime).toBe(stats['testWidget']!.totalTime / 3);
        });

        it('should track min and max times', () => {
            // Fast operation
            monitor.measure('testWidget', () => 1);

            // Slow operation  
            monitor.measure('testWidget', () => {
                let sum = 0;
                for (let i = 0; i < 10000; i++) {
                    sum += i;
                }
                return sum;
            });

            const stats = monitor.getStats();
            expect(stats['testWidget']!.minTime).toBeLessThan(stats['testWidget']!.maxTime);
        });

        it('should track different widgets separately', () => {
            monitor.measure('widget1', () => 'result1');
            monitor.measure('widget2', () => 'result2');

            const stats = monitor.getStats();
            expect(stats['widget1']).toBeDefined();
            expect(stats['widget2']).toBeDefined();
            expect(stats['widget1']!.count).toBe(1);
            expect(stats['widget2']!.count).toBe(1);
        });
    });

    describe('getStats', () => {
        it('should return empty stats initially', () => {
            const stats = monitor.getStats();
            expect(Object.keys(stats)).toHaveLength(0);
        });

        it('should return complete statistics', () => {
            monitor.measure('testWidget', () => 'result');

            const stats = monitor.getStats();
            expect(stats['testWidget']).toEqual({
                count: 1,
                totalTime: expect.any(Number),
                averageTime: expect.any(Number),
                maxTime: expect.any(Number),
                minTime: expect.any(Number),
            });
        });
    });

    describe('clear', () => {
        it('should clear all measurements', () => {
            monitor.measure('widget1', () => 'result1');
            monitor.measure('widget2', () => 'result2');

            monitor.clear();

            const stats = monitor.getStats();
            expect(Object.keys(stats)).toHaveLength(0);
        });
    });
});

describe('global instances', () => {
    it('should export global constraint solver', () => {
        expect(globalConstraintSolver).toBeInstanceOf(ConstraintSolver);
    });

    it('should export global performance monitor', () => {
        expect(globalPerformanceMonitor).toBeInstanceOf(LayoutPerformanceMonitor);
    });

    it('should maintain separate state from new instances', () => {
        const localSolver = new ConstraintSolver();
        const widget = new MockWidget();

        const context: LayoutContext = {
            constraints: { minWidth: 0, maxWidth: 100, minHeight: 0, maxHeight: 50 },
            textDirection: TextDirection.LeftToRight,
            theme: ThemeUtils.light(),
        };

        // Populate global cache
        globalConstraintSolver.solveLayout(widget, context);

        // Local solver should not have cache
        const layoutSpy = vi.spyOn(widget, 'layout');
        localSolver.solveLayout(widget, context);
        expect(layoutSpy).toHaveBeenCalledTimes(1);
    });
});