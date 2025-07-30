/**
 * Unit tests for render pipeline system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    RenderPipeline,
    globalRenderPipeline,
    type RenderObject,
} from '../layout/render-pipeline.js';
import { ConstraintSolver } from '../layout/constraint-solver.js';
import { BaseWidget } from '../widgets/widget.js';
import { Matrix4 } from '../core/pdf/graphics.js';
import type { LayoutContext, LayoutResult, PaintContext } from '../types/layout.js';
import { TextDirection } from '../types/layout.js';
import type { Size, Point } from '../types/geometry.js';

// Mock graphics interface for testing
class MockGraphics {
    public transforms: Matrix4[] = [];
    public savedContexts: number = 0;

    saveContext(): void {
        this.savedContexts++;
    }

    restoreContext(): void {
        this.savedContexts = Math.max(0, this.savedContexts - 1);
    }

    setTransform(transform: Matrix4): void {
        this.transforms.push(transform);
    }

    // Mock other graphics methods
    setColor(): void { }
    drawRect(): void { }
    fillPath(): void { }
    strokePath(): void { }
    beginText(): void { }
    endText(): void { }
    moveTextPosition(): void { }
    showText(): void { }
    drawLine(): void { }
    setLineWidth(): void { }
}

// Mock simple widget for testing
class MockWidget extends BaseWidget {
    public layoutCallCount = 0;
    public paintCallCount = 0;

    constructor(
        public _children: MockWidget[] = [],
        public mockSize: Size = { width: 100, height: 50 },
        debugLabel?: string
    ) {
        super(debugLabel ? { debugLabel } : {});
    }

    get children() {
        return this._children;
    }

    layout(context: LayoutContext): LayoutResult {
        this.layoutCallCount++;
        return {
            size: this.mockSize,
            needsRepaint: this.layoutCallCount === 1,
        };
    }

    paint(context: PaintContext): void {
        this.paintCallCount++;
    }
}

// Mock container widget for testing
class MockContainerWidget extends MockWidget {

    constructor(
        _children: MockWidget[] = [],
        mockSize: Size = { width: 200, height: 100 },
        debugLabel?: string
    ) {
        super(_children, mockSize, debugLabel);
    }

    override layout(context: LayoutContext): LayoutResult {
        this.layoutCallCount++;
        return {
            size: this.mockSize,
            needsRepaint: true,
        };
    }
}

describe('RenderPipeline', () => {
    let pipeline: RenderPipeline;
    let mockContext: LayoutContext;
    let constraintSolver: ConstraintSolver;

    beforeEach(() => {
        constraintSolver = new ConstraintSolver();
        pipeline = new RenderPipeline(constraintSolver);
        mockContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 400,
                minHeight: 0,
                maxHeight: 300,
            },
            textDirection: TextDirection.LeftToRight,
            theme: {
                textStyle: {
                    fontSize: 12,
                    fontWeight: 'normal',
                    color: '#000000',
                },
                colors: {
                    primary: '#1976d2',
                    secondary: '#dc004e',
                    background: '#ffffff',
                    surface: '#ffffff',
                    text: '#000000',
                },
            },
        };
    });

    describe('constructor', () => {
        it('should create pipeline with default constraint solver', () => {
            const defaultPipeline = new RenderPipeline();
            expect(defaultPipeline).toBeInstanceOf(RenderPipeline);
        });

        it('should create pipeline with custom constraint solver', () => {
            const customSolver = new ConstraintSolver();
            const customPipeline = new RenderPipeline(customSolver);
            expect(customPipeline).toBeInstanceOf(RenderPipeline);
        });
    });

    describe('buildRenderTree', () => {
        it('should build render tree for simple widget', () => {
            const widget = new MockWidget([], { width: 100, height: 50 }, 'test-widget');
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            expect(renderTree).toBeDefined();
            expect(renderTree.widget).toBe(widget);
            expect(renderTree.size).toEqual({ width: 100, height: 50 });
            expect(renderTree.position).toEqual({ x: 0, y: 0 });
            expect(renderTree.children).toHaveLength(0);
            expect(renderTree.needsRepaint).toBe(true);
            expect(renderTree.transform).toBeInstanceOf(Matrix4);
        });

        it('should build render tree with children', () => {
            const child1 = new MockWidget([], { width: 50, height: 25 }, 'child1');
            const child2 = new MockWidget([], { width: 60, height: 30 }, 'child2');
            const container = new MockContainerWidget([child1, child2], { width: 200, height: 100 }, 'container');

            const renderTree = pipeline.buildRenderTree(container, mockContext);

            expect(renderTree.children).toHaveLength(2);
            expect(renderTree.children[0]!.widget).toBe(child1);
            expect(renderTree.children[1]!.widget).toBe(child2);
            expect(renderTree.children[0]!.parent).toBe(renderTree);
            expect(renderTree.children[1]!.parent).toBe(renderTree);
        });

        it('should handle widgets without children', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            expect(renderTree.children).toHaveLength(0);
        });

        it('should enable performance monitoring when requested', () => {
            const widget = new MockWidget([], { width: 100, height: 50 }, 'perf-test');

            pipeline.buildRenderTree(widget, mockContext, {
                enablePerformanceMonitoring: true,
            });

            const stats = pipeline.getPerformanceStats();
            expect(stats['perf-test']).toBeDefined();
        });

        it('should validate constraints when requested', () => {
            const widget = new MockWidget();
            const invalidContext = {
                ...mockContext,
                constraints: {
                    minWidth: -10,
                    maxWidth: 100,
                    minHeight: 0,
                    maxHeight: 50,
                },
            };

            expect(() => {
                pipeline.buildRenderTree(widget, invalidContext, {
                    validateConstraints: true,
                });
            }).toThrow();
        });
    });

    describe('layout', () => {
        it('should perform layout on render tree', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            pipeline.layout(renderTree);

            // Layout should complete without errors
            expect(renderTree.size).toEqual({ width: 100, height: 50 });
        });

        it('should recursively layout children', () => {
            const child1 = new MockWidget([], { width: 50, height: 25 }, 'child1');
            const child2 = new MockWidget([], { width: 60, height: 30 }, 'child2');
            const container = new MockContainerWidget([child1, child2], { width: 200, height: 100 });

            const renderTree = pipeline.buildRenderTree(container, mockContext);
            pipeline.layout(renderTree);

            // Should have positioned children
            expect(renderTree.children[0]!.position).toBeDefined();
            expect(renderTree.children[1]!.position).toBeDefined();
        });

        it('should handle empty render tree', () => {
            const widget = new MockWidget([], { width: 0, height: 0 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            expect(() => {
                pipeline.layout(renderTree);
            }).not.toThrow();
        });
    });

    describe('paint', () => {
        let mockGraphics: MockGraphics;

        beforeEach(() => {
            mockGraphics = new MockGraphics();
        });

        it('should paint simple widget', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            pipeline.paint(mockGraphics as any, renderTree);

            expect(mockGraphics.savedContexts).toBe(0); // Should restore after painting
            expect(widget.paintCallCount).toBe(1);
        });

        it('should save and restore graphics context', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            const saveContextSpy = vi.spyOn(mockGraphics, 'saveContext');
            const restoreContextSpy = vi.spyOn(mockGraphics, 'restoreContext');

            pipeline.paint(mockGraphics as any, renderTree);

            expect(saveContextSpy).toHaveBeenCalled();
            expect(restoreContextSpy).toHaveBeenCalled();
        });

        it('should apply transforms when needed', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            // Modify transform to be non-identity
            renderTree.transform = new Matrix4([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1]);

            pipeline.paint(mockGraphics as any, renderTree);

            expect(mockGraphics.transforms.length).toBeGreaterThan(0);
        });

        it('should paint children recursively', () => {
            const child1 = new MockWidget([], { width: 50, height: 25 }, 'child1');
            const child2 = new MockWidget([], { width: 60, height: 30 }, 'child2');
            const container = new MockContainerWidget([child1, child2]);

            const renderTree = pipeline.buildRenderTree(container, mockContext);
            pipeline.layout(renderTree);
            pipeline.paint(mockGraphics as any, renderTree);

            expect(container.paintCallCount).toBe(1);
            expect(child1.paintCallCount).toBe(1);
            expect(child2.paintCallCount).toBe(1);
        });

        it('should handle clipping rectangle', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            // Position widget outside clipping area
            renderTree.position = { x: 1000, y: 1000 };

            const clipRect = { x: 0, y: 0, width: 500, height: 400 };
            pipeline.paint(mockGraphics as any, renderTree, clipRect);

            // Widget should not be painted due to clipping
            expect(widget.paintCallCount).toBe(0);
        });

        it('should mark render object as painted', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);
            renderTree.needsRepaint = true;

            pipeline.paint(mockGraphics as any, renderTree);

            expect(renderTree.needsRepaint).toBe(false);
        });
    });

    describe('invalidate', () => {
        it('should mark render object for repaint', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);
            renderTree.needsRepaint = false;

            pipeline.invalidate(renderTree);

            expect(renderTree.needsRepaint).toBe(true);
        });

        it('should propagate invalidation up the tree', () => {
            const child = new MockWidget([], { width: 50, height: 25 });
            const container = new MockContainerWidget([child]);
            const renderTree = pipeline.buildRenderTree(container, mockContext);

            // Clear repaint flags
            renderTree.needsRepaint = false;
            renderTree.children[0]!.needsRepaint = false;

            pipeline.invalidate(renderTree.children[0]!);

            expect(renderTree.children[0]!.needsRepaint).toBe(true);
            expect(renderTree.needsRepaint).toBe(true);
        });

        it('should handle root level invalidation', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);
            renderTree.needsRepaint = false;

            pipeline.invalidate(renderTree);

            expect(renderTree.needsRepaint).toBe(true);
        });
    });

    describe('hitTest', () => {
        it('should find render object at specific point', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            const hit = pipeline.hitTest({ x: 25, y: 25 }, renderTree);

            expect(hit).toBe(renderTree);
        });

        it('should return null for point outside render object', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            const hit = pipeline.hitTest({ x: 200, y: 200 }, renderTree);

            expect(hit).toBeUndefined();
        });

        it('should test children before parent', () => {
            const child = new MockWidget([], { width: 50, height: 25 });
            const container = new MockContainerWidget([child], { width: 200, height: 100 });
            const renderTree = pipeline.buildRenderTree(container, mockContext);

            // Position child at origin
            renderTree.children[0]!.position = { x: 0, y: 0 };

            const hit = pipeline.hitTest({ x: 25, y: 12 }, renderTree);

            expect(hit).toBe(renderTree.children[0]);
        });

        it('should handle nested widgets correctly', () => {
            const grandchild = new MockWidget([], { width: 25, height: 12 });
            const child = new MockContainerWidget([grandchild], { width: 50, height: 25 });
            const container = new MockContainerWidget([child], { width: 200, height: 100 }, 'container');

            const renderTree = pipeline.buildRenderTree(container, mockContext);

            // Position widgets at origin
            renderTree.children[0]!.position = { x: 0, y: 0 };
            renderTree.children[0]!.children[0]!.position = { x: 0, y: 0 };

            const hit = pipeline.hitTest({ x: 12, y: 6 }, renderTree);

            expect(hit).toBe(renderTree.children[0]!.children[0]);
        });
    });

    describe('performance monitoring', () => {
        it('should track performance statistics', () => {
            const widget = new MockWidget([], { width: 100, height: 50 }, 'perf-widget');

            pipeline.buildRenderTree(widget, mockContext, {
                enablePerformanceMonitoring: true,
            });

            const stats = pipeline.getPerformanceStats();
            expect(stats['perf-widget']).toBeDefined();
            expect(stats['perf-widget'].count).toBeGreaterThan(0);
        });

        it('should clear performance statistics', () => {
            const widget = new MockWidget([], { width: 100, height: 50 }, 'clear-test');

            pipeline.buildRenderTree(widget, mockContext, {
                enablePerformanceMonitoring: true,
            });

            pipeline.clearPerformanceStats();

            const stats = pipeline.getPerformanceStats();
            expect(Object.keys(stats)).toHaveLength(0);
        });
    });

    describe('error handling', () => {
        it('should throw error when accessing render tree before building', () => {
            expect(() => {
                (pipeline as any).getRenderTree();
            }).toThrow('Render tree not built');
        });

        it('should handle invalid transform matrix', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            // Set an invalid transform (all zeros would be non-invertible)
            renderTree.transform = new Matrix4([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

            const mockGraphics = new MockGraphics();

            expect(() => {
                pipeline.paint(mockGraphics as any, renderTree);
            }).not.toThrow(); // Should handle gracefully
        });
    });

    describe('render tree structure', () => {
        it('should maintain parent-child relationships', () => {
            const child1 = new MockWidget([], { width: 50, height: 25 }, 'child1');
            const child2 = new MockWidget([], { width: 60, height: 30 }, 'child2');
            const container = new MockContainerWidget([child1, child2], { width: 200, height: 100 }, 'container');

            const renderTree = pipeline.buildRenderTree(container, mockContext);

            expect(renderTree.parent).toBeUndefined();
            expect(renderTree.children[0]!.parent).toBe(renderTree);
            expect(renderTree.children[1]!.parent).toBe(renderTree);
        });

        it('should assign unique transform matrices to each render object', () => {
            const child = new MockWidget([], { width: 50, height: 25 });
            const container = new MockContainerWidget([child]);
            const renderTree = pipeline.buildRenderTree(container, mockContext);

            expect(renderTree.transform).toBeInstanceOf(Matrix4);
            expect(renderTree.children[0]!.transform).toBeInstanceOf(Matrix4);
            expect(renderTree.transform).not.toBe(renderTree.children[0]!.transform);
        });

        it('should properly set initial positions', () => {
            const widget = new MockWidget([], { width: 100, height: 50 });
            const renderTree = pipeline.buildRenderTree(widget, mockContext);

            expect(renderTree.position).toEqual({ x: 0, y: 0 });
        });
    });
});

describe('globalRenderPipeline', () => {
    it('should export global render pipeline instance', () => {
        expect(globalRenderPipeline).toBeInstanceOf(RenderPipeline);
    });

    it('should maintain state between calls', () => {
        const widget = new MockWidget([], { width: 100, height: 50 }, 'global-test');
        const context: LayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 200,
                minHeight: 0,
                maxHeight: 100,
            },
            textDirection: TextDirection.LeftToRight,
            theme: {
                textStyle: { fontSize: 12, fontWeight: 'normal', color: '#000000' },
                colors: { primary: '#1976d2', secondary: '#dc004e', background: '#ffffff', surface: '#ffffff', text: '#000000' },
            },
        };

        const renderTree = globalRenderPipeline.buildRenderTree(widget, context);

        expect(renderTree).toBeDefined();
        expect(renderTree.widget).toBe(widget);
    });

    it('should use global constraint solver by default', () => {
        // The global render pipeline should work without throwing errors
        const widget = new MockWidget([], { width: 100, height: 50 });
        const context: LayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 200,
                minHeight: 0,
                maxHeight: 100,
            },
            textDirection: TextDirection.LeftToRight,
            theme: {
                textStyle: { fontSize: 12, fontWeight: 'normal', color: '#000000' },
                colors: { primary: '#1976d2', secondary: '#dc004e', background: '#ffffff', surface: '#ffffff', text: '#000000' },
            },
        };

        expect(() => {
            globalRenderPipeline.buildRenderTree(widget, context);
        }).not.toThrow();
    });
});

describe('RenderObject interface', () => {
    it('should have all required properties', () => {
        const widget = new MockWidget([], { width: 100, height: 50 });
        const pipeline = new RenderPipeline();
        const context: LayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 200,
                minHeight: 0,
                maxHeight: 100,
            },
            textDirection: TextDirection.LeftToRight,
            theme: {
                textStyle: { fontSize: 12, fontWeight: 'normal', color: '#000000' },
                colors: { primary: '#1976d2', secondary: '#dc004e', background: '#ffffff', surface: '#ffffff', text: '#000000' },
            },
        };

        const renderTree = pipeline.buildRenderTree(widget, context);

        // Check all RenderObject properties exist
        expect(renderTree.widget).toBeDefined();
        expect(renderTree.position).toBeDefined();
        expect(renderTree.size).toBeDefined();
        expect(renderTree.layoutResult).toBeDefined();
        expect(renderTree.children).toBeDefined();
        expect(renderTree.transform).toBeDefined();
        expect(typeof renderTree.needsRepaint).toBe('boolean');

        // Check types
        expect(typeof renderTree.position.x).toBe('number');
        expect(typeof renderTree.position.y).toBe('number');
        expect(typeof renderTree.size.width).toBe('number');
        expect(typeof renderTree.size.height).toBe('number');
        expect(Array.isArray(renderTree.children)).toBe(true);
        expect(renderTree.transform).toBeInstanceOf(Matrix4);
    });
});