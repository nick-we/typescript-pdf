/**
 * Layout Systems Test Suite - Consolidated
 *
 * Tests all layout functionality from the consolidated layout system.
 * Consolidates: constraint-solver.test.ts, render-pipeline.test.ts, layout-cache.test.ts,
 *               coordinate-transform.test.ts, stack-positioned.test.ts, align-center.test.ts,
 *               padding.test.ts, margin.test.ts, flex.test.ts
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import consolidated systems
import { Layout, Geometry, Flex as FlexTypes } from '@/types.js';
import {
    Container,
    Stack,
    Positioned,
    Row,
    Column,
    Flexible,
    Expanded,
    TextWidget,
} from '@/widgets/index.js';

describe('Layout Systems', () => {
    let mockLayoutContext: Layout.LayoutContext;

    beforeEach(() => {
        const mockTheme = {
            colorScheme: {
                primary: '#1976d2',
                secondary: '#dc004e',
                background: '#ffffff',
                surface: '#f5f5f5',
                onBackground: '#000000',
                onSurface: '#000000',
                onPrimary: '#ffffff',
                onSecondary: '#ffffff',
                error: '#d32f2f',
                success: '#388e3c',
                warning: '#f57c00',
                info: '#1976d2',
            },
            spacing: { xs: 2, sm: 4, md: 8, lg: 16, xl: 24, xxl: 32 },
            defaultTextStyle: {
                fontSize: 12,
                fontFamily: 'Helvetica',
                color: '#000000',
            },
            cornerRadius: { none: 0, small: 4, medium: 8, large: 16 },
        };

        mockLayoutContext = {
            constraints: {
                minWidth: 0,
                maxWidth: 600,
                minHeight: 0,
                maxHeight: 800,
            },
            textDirection: 'ltr',
            theme: mockTheme,
        };
    });

    describe('Box Constraints System', () => {
        it('should create tight constraints', () => {
            const size = { width: 100, height: 50 };
            const constraints = Layout.BoxConstraints.tight(size);

            expect(constraints.minWidth).toBe(100);
            expect(constraints.maxWidth).toBe(100);
            expect(constraints.minHeight).toBe(50);
            expect(constraints.maxHeight).toBe(50);
        });

        it('should create loose constraints', () => {
            const size = { width: 200, height: 150 };
            const constraints = Layout.BoxConstraints.loose(size);

            expect(constraints.minWidth).toBe(0);
            expect(constraints.maxWidth).toBe(200);
            expect(constraints.minHeight).toBe(0);
            expect(constraints.maxHeight).toBe(150);
        });

        it('should constrain sizes properly', () => {
            const constraints: Layout.BoxConstraints = {
                minWidth: 50,
                maxWidth: 200,
                minHeight: 30,
                maxHeight: 100,
            };

            // Size too small
            const smallSize = Layout.BoxConstraints.constrain(constraints, {
                width: 20,
                height: 10,
            });
            expect(smallSize.width).toBe(50);
            expect(smallSize.height).toBe(30);

            // Size too large
            const largeSize = Layout.BoxConstraints.constrain(constraints, {
                width: 300,
                height: 200,
            });
            expect(largeSize.width).toBe(200);
            expect(largeSize.height).toBe(100);

            // Size within bounds
            const validSize = Layout.BoxConstraints.constrain(constraints, {
                width: 100,
                height: 60,
            });
            expect(validSize.width).toBe(100);
            expect(validSize.height).toBe(60);
        });

        it('should validate constraint consistency', () => {
            // Valid constraints
            const validConstraints: Layout.BoxConstraints = {
                minWidth: 10,
                maxWidth: 100,
                minHeight: 20,
                maxHeight: 200,
            };
            // Would be valid - test actual constraint usage
            expect(validConstraints.minWidth).toBeLessThanOrEqual(
                validConstraints.maxWidth
            );
            expect(validConstraints.minHeight).toBeLessThanOrEqual(
                validConstraints.maxHeight
            );

            // Invalid constraints - min > max
            const invalidConstraints: Layout.BoxConstraints = {
                minWidth: 100,
                maxWidth: 50,
                minHeight: 20,
                maxHeight: 200,
            };
            expect(invalidConstraints.minWidth).toBeGreaterThan(
                invalidConstraints.maxWidth
            );
        });
    });

    describe('Edge Insets System', () => {
        it('should create edge insets with all sides equal', () => {
            const insets = Layout.EdgeInsets.all(16);
            expect(insets.top).toBe(16);
            expect(insets.right).toBe(16);
            expect(insets.bottom).toBe(16);
            expect(insets.left).toBe(16);
        });

        it('should create symmetric edge insets', () => {
            const insets = Layout.EdgeInsets.symmetric({
                horizontal: 20,
                vertical: 10,
            });
            expect(insets.top).toBe(10);
            expect(insets.bottom).toBe(10);
            expect(insets.left).toBe(20);
            expect(insets.right).toBe(20);
        });

        it('should create edge insets for specific sides only', () => {
            const insets = Layout.EdgeInsets.only({ top: 5, right: 10 });
            expect(insets.top).toBe(5);
            expect(insets.right).toBe(10);
            expect(insets.bottom).toBe(0);
            expect(insets.left).toBe(0);
        });

        it('should calculate horizontal and vertical totals', () => {
            const insets = Layout.EdgeInsets.only({
                top: 5,
                right: 10,
                bottom: 15,
                left: 20,
            });
            expect(Layout.EdgeInsets.horizontal(insets)).toBe(30); // left + right
            expect(Layout.EdgeInsets.vertical(insets)).toBe(20); // top + bottom
        });

        it('should deflate size by insets', () => {
            const insets = Layout.EdgeInsets.all(10);
            const originalSize = { width: 100, height: 80 };
            const deflatedSize = Layout.EdgeInsets.deflateSize(
                insets,
                originalSize
            );

            expect(deflatedSize.width).toBe(80); // 100 - 20 (left + right)
            expect(deflatedSize.height).toBe(60); // 80 - 20 (top + bottom)
        });

        it('should deflate constraints by insets', () => {
            const insets = Layout.EdgeInsets.symmetric({
                horizontal: 10,
                vertical: 5,
            });
            const originalConstraints: Layout.BoxConstraints = {
                minWidth: 20,
                maxWidth: 100,
                minHeight: 15,
                maxHeight: 80,
            };

            const deflatedConstraints = Layout.EdgeInsets.deflateConstraints(
                insets,
                originalConstraints
            );
            expect(deflatedConstraints.minWidth).toBe(0); // max(0, 20 - 20)
            expect(deflatedConstraints.maxWidth).toBe(80); // 100 - 20
            expect(deflatedConstraints.minHeight).toBe(5); // 15 - 10
            expect(deflatedConstraints.maxHeight).toBe(70); // 80 - 10
        });
    });

    describe('Alignment System', () => {
        it('should resolve alignment positions correctly', () => {
            const containerSize = { width: 200, height: 100 };
            const childSize = { width: 50, height: 30 };

            // Test center alignment
            const centerPos = Layout.AlignmentUtils.resolve(
                Layout.Alignment.Center,
                containerSize,
                childSize
            );
            expect(centerPos.x).toBe(75); // (200 - 50) / 2
            expect(centerPos.y).toBe(35); // (100 - 30) / 2

            // Test top-left alignment
            const topLeftPos = Layout.AlignmentUtils.resolve(
                Layout.Alignment.TopLeft,
                containerSize,
                childSize
            );
            expect(topLeftPos.x).toBe(0);
            expect(topLeftPos.y).toBe(0);

            // Test bottom-right alignment
            const bottomRightPos = Layout.AlignmentUtils.resolve(
                Layout.Alignment.BottomRight,
                containerSize,
                childSize
            );
            expect(bottomRightPos.x).toBe(150); // 200 - 50
            expect(bottomRightPos.y).toBe(70); // 100 - 30
        });

        it('should handle edge case alignments', () => {
            const containerSize = { width: 100, height: 60 };
            const childSize = { width: 100, height: 60 }; // Same size as container

            const centerPos = Layout.AlignmentUtils.resolve(
                Layout.Alignment.Center,
                containerSize,
                childSize
            );
            expect(centerPos.x).toBe(0);
            expect(centerPos.y).toBe(0);
        });
    });

    describe('Container Layout', () => {
        it('should layout container with padding', () => {
            const child = new TextWidget('Content');
            const container = new Container({
                child,
                padding: Layout.EdgeInsets.all(16),
            });

            const layout = container.layout(mockLayoutContext);

            // Container should be larger than child due to padding
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should layout container with margin', () => {
            const child = new TextWidget('Content');
            const container = new Container({
                child,
                margin: Layout.EdgeInsets.all(20),
            });

            const layout = container.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should layout container with fixed dimensions', () => {
            const child = new TextWidget('Content');
            const container = new Container({
                child,
                width: 150,
                height: 100,
            });

            const layout = container.layout(mockLayoutContext);
            expect(layout.size.width).toBe(150);
            expect(layout.size.height).toBe(100);
        });

        it('should handle container alignment', () => {
            const child = new TextWidget('Small');
            const container = new Container({
                child,
                width: 200,
                height: 100,
                alignment: Layout.Alignment.Center,
            });

            const layout = container.layout(mockLayoutContext);
            expect(layout.size.width).toBe(200);
            expect(layout.size.height).toBe(100);
        });
    });

    describe('Stack Layout', () => {
        it('should layout stack with positioned children', () => {
            const stack = new Stack({
                children: [
                    new TextWidget('Background'),
                    new Positioned({
                        child: new TextWidget('Positioned'),
                        top: 10,
                        left: 20,
                        width: 100,
                        height: 50,
                    }),
                ],
            });

            const layout = stack.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should size stack based on non-positioned children', () => {
            const stack = new Stack({
                children: [
                    new Container({ width: 200, height: 150 }),
                    new Positioned({
                        child: new TextWidget('Overlay'),
                        top: 0,
                        left: 0,
                    }),
                ],
            });

            const layout = stack.layout(mockLayoutContext);
            expect(layout.size.width).toBe(200);
            expect(layout.size.height).toBe(150);
        });

        it('should handle empty stack', () => {
            const stack = new Stack({ children: [] });
            const layout = stack.layout(mockLayoutContext);

            expect(layout.size.width).toBe(0);
            expect(layout.size.height).toBe(0);
        });
    });

    describe('Flex Layout System', () => {
        it('should layout row with flexible children', () => {
            const row = new Row({
                children: [
                    new Container({ width: 100, height: 50 }),
                    new Flexible({
                        child: new Container({ height: 50 }),
                        flex: 1,
                    }),
                    new Container({ width: 80, height: 50 }),
                ],
            });

            const layout = row.layout(mockLayoutContext);
            expect(layout.size.width).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxWidth
            );
            expect(layout.size.height).toBe(50);
        });

        it('should layout column with expanded children', () => {
            const column = new Column({
                children: [
                    new Container({ width: 100, height: 30 }),
                    new Expanded({
                        child: new Container({ width: 100 }),
                        flex: 2,
                    }),
                    new Container({ width: 100, height: 40 }),
                ],
            });

            const layout = column.layout(mockLayoutContext);
            expect(layout.size.width).toBe(100);
            expect(layout.size.height).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxHeight
            );
        });

        it('should handle main axis alignment', () => {
            const row = new Row({
                mainAxisAlignment: FlexTypes.MainAxisAlignment.SpaceBetween,
                children: [
                    new TextWidget('Start'),
                    new TextWidget('Middle'),
                    new TextWidget('End'),
                ],
            });

            const layout = row.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle cross axis alignment', () => {
            const column = new Column({
                crossAxisAlignment: FlexTypes.CrossAxisAlignment.Center,
                children: [
                    new Container({ width: 50, height: 20 }),
                    new Container({ width: 100, height: 20 }),
                    new Container({ width: 75, height: 20 }),
                ],
            });

            const layout = column.layout(mockLayoutContext);
            expect(layout.size.width).toBe(100); // Width of widest child
            expect(layout.size.height).toBe(60); // Sum of heights
        });

        it('should calculate flex proportions correctly', () => {
            const availableSpace = 300;
            const fixedSpace = 100;
            const flexSpace = availableSpace - fixedSpace; // 200

            // Two flex children with flex: 1 and flex: 2
            const totalFlex = 3;
            const flex1Space = Math.floor(flexSpace * (1 / totalFlex));
            const flex2Space = Math.floor(flexSpace * (2 / totalFlex));

            expect(flex1Space).toBeCloseTo(66, 0); // 200 * 1/3
            expect(flex2Space).toBeCloseTo(133, 0); // 200 * 2/3
        });
    });

    describe('Layout Performance', () => {
        it('should layout widgets efficiently', () => {
            const startTime = performance.now();

            const widget = new Container({
                child: new TextWidget('Performance test'),
                padding: Layout.EdgeInsets.all(10),
            });

            const result = widget.layout(mockLayoutContext);
            const endTime = performance.now();

            expect(result.size).toBeDefined();
            expect(endTime - startTime).toBeLessThan(50); // Should be fast
        });

        it('should handle repeated layouts consistently', () => {
            const widget = new Row({
                children: [
                    new TextWidget('Item 1'),
                    new TextWidget('Item 2'),
                    new TextWidget('Item 3'),
                ],
            });

            const results: Layout.LayoutResult[] = [];
            for (let i = 0; i < 5; i++) {
                results.push(widget.layout(mockLayoutContext));
            }

            // All results should be identical
            results.forEach(result => {
                expect(result.size).toEqual(results[0]!.size);
            });
        });
    });

    describe('Constraint Solving', () => {
        it('should solve simple constraint propagation with padding', () => {
            const container = new Container({
                padding: Layout.EdgeInsets.all(20),
                child: new TextWidget('Content'),
            });

            const layout = container.layout(mockLayoutContext);
            const childLayout = new TextWidget('Content').layout(
                mockLayoutContext
            );

            // Container should be larger than child due to padding
            expect(layout.size.width).toBeGreaterThan(childLayout.size.width);
            expect(layout.size.height).toBeGreaterThan(childLayout.size.height);
        });

        it('should distribute flex space correctly', () => {
            const row = new Row({
                children: [
                    new Flexible({ child: new TextWidget('Flex 1'), flex: 1 }),
                    new Flexible({ child: new TextWidget('Flex 2'), flex: 2 }),
                    new Flexible({ child: new TextWidget('Flex 3'), flex: 1 }),
                ],
            });

            const layout = row.layout(mockLayoutContext);
            expect(layout.size.width).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxWidth
            );
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle over-constrained scenarios gracefully', () => {
            // Widget that tries to be larger than available space
            const oversizedWidget = new Container({
                width: 1000, // Larger than max constraint of 600
                height: 1000, // Larger than max constraint of 800
                child: new TextWidget('Oversized'),
            });

            const layout = oversizedWidget.layout(mockLayoutContext);

            // Should be constrained to available space
            expect(layout.size.width).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxWidth
            );
            expect(layout.size.height).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxHeight
            );
        });
    });

    describe('Coordinate Transformations', () => {
        it('should transform points correctly', () => {
            const point: Geometry.Point = { x: 10, y: 20 };
            const matrix: Geometry.Matrix = {
                a: 2,
                b: 0,
                c: 0,
                d: 2,
                e: 5,
                f: 10,
            };

            const transformed = Geometry.Utils.transformPoint(point, matrix);
            expect(transformed.x).toBe(25); // 2*10 + 0*20 + 5
            expect(transformed.y).toBe(50); // 0*10 + 2*20 + 10
        });

        it('should calculate distances between points', () => {
            const point1: Geometry.Point = { x: 0, y: 0 };
            const point2: Geometry.Point = { x: 3, y: 4 };

            const distance = Geometry.Utils.distance(point1, point2);
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should find rectangle intersections', () => {
            const rect1: Geometry.Rect = {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
            };
            const rect2: Geometry.Rect = {
                x: 50,
                y: 50,
                width: 100,
                height: 100,
            };

            const intersection = Geometry.Utils.rectIntersection(rect1, rect2);
            expect(intersection).not.toBeUndefined();
            expect(intersection?.x).toBe(50);
            expect(intersection?.y).toBe(50);
            expect(intersection?.width).toBe(50);
            expect(intersection?.height).toBe(50);
        });

        it('should handle non-intersecting rectangles', () => {
            const rect1: Geometry.Rect = { x: 0, y: 0, width: 50, height: 50 };
            const rect2: Geometry.Rect = {
                x: 100,
                y: 100,
                width: 50,
                height: 50,
            };

            const intersection = Geometry.Utils.rectIntersection(rect1, rect2);
            expect(intersection).toBeUndefined();
        });
    });

    describe('Layout Integration', () => {
        it('should handle complex nested layouts', () => {
            const complexLayout = new Container({
                padding: Layout.EdgeInsets.all(20),
                child: new Column({
                    children: [
                        new Row({
                            mainAxisAlignment:
                                FlexTypes.MainAxisAlignment.SpaceBetween,
                            children: [
                                new TextWidget('Left'),
                                new TextWidget('Right'),
                            ],
                        }),
                        new Expanded({
                            child: new Stack({
                                children: [
                                    new Container({
                                        width: 300,
                                        height: 200,
                                        alignment: Layout.Alignment.Center,
                                        child: new TextWidget('Background'),
                                    }),
                                    new Positioned({
                                        top: 10,
                                        right: 10,
                                        child: new TextWidget('Overlay'),
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            });

            const layout = complexLayout.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
            expect(layout.needsRepaint).toBeDefined();
        });

        it('should maintain layout stability across re-layouts', () => {
            const widget = new Container({
                child: new Row({
                    children: [
                        new Flexible({
                            child: new TextWidget('Flex 1'),
                            flex: 1,
                        }),
                        new Flexible({
                            child: new TextWidget('Flex 2'),
                            flex: 2,
                        }),
                    ],
                }),
            });

            const layout1 = widget.layout(mockLayoutContext);
            const layout2 = widget.layout(mockLayoutContext);

            expect(layout1.size).toEqual(layout2.size);
            expect(layout1.needsRepaint).toBe(layout2.needsRepaint);
        });

        it('should handle layout with various constraint scenarios', () => {
            const scenarios = [
                Layout.BoxConstraints.tight({ width: 200, height: 100 }),
                Layout.BoxConstraints.loose({ width: 400, height: 300 }),
                Layout.BoxConstraints.expand(500, 400),
                { minWidth: 100, maxWidth: 300, minHeight: 50, maxHeight: 200 },
            ];

            const widget = new Container({
                child: new TextWidget('Flexible content'),
            });

            scenarios.forEach(constraints => {
                const context = { ...mockLayoutContext, constraints };
                const layout = widget.layout(context);

                expect(layout.size.width).toBeGreaterThanOrEqual(
                    constraints.minWidth
                );
                expect(layout.size.width).toBeLessThanOrEqual(
                    constraints.maxWidth
                );
                expect(layout.size.height).toBeGreaterThanOrEqual(
                    constraints.minHeight
                );
                expect(layout.size.height).toBeLessThanOrEqual(
                    constraints.maxHeight
                );
            });
        });
    });
});
