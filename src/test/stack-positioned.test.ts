/**
 * Tests for Stack and Positioned widgets
 */

import { describe, it, expect } from 'vitest';
import { Stack, StackHelpers, StackFit } from '../widgets/stack.js';
import { Positioned, PositionedHelpers } from '../widgets/positioned.js';
import { Text } from '../widgets/text.js';
import { Alignment, defaultTheme } from '../types/layout.js';
import type { LayoutContext } from '../types/layout.js';
import { TextDirection } from '@/core/text-layout.js';

describe('Positioned Widget', () => {
    const createMockContext = (width = 200, height = 200): LayoutContext => ({
        constraints: {
            minWidth: 0,
            maxWidth: width,
            minHeight: 0,
            maxHeight: height,
        },
        textDirection: TextDirection.LeftToRight,
        theme: defaultTheme,
    });

    describe('Basic Functionality', () => {
        it('should position child at specified coordinates', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                left: 10,
                top: 20,
            });

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle fixed width and height', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                left: 10,
                top: 10,
                width: 50,
                height: 30,
            });

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeLessThanOrEqual(200);
            expect(result.size.height).toBeLessThanOrEqual(200);
        });

        it('should handle right and bottom positioning', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                right: 15,
                bottom: 25,
            });

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should stretch between left and right', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                left: 20,
                right: 30,
                top: 10,
            });

            const context = createMockContext(200, 200);
            const result = positionedWidget.layout(context);

            // Should account for left + right constraints
            expect(result.size.width).toBeLessThanOrEqual(200);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should stretch between top and bottom', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                top: 15,
                bottom: 25,
                left: 10,
            });

            const context = createMockContext(200, 200);
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            // Should account for top + bottom constraints
            expect(result.size.height).toBeLessThanOrEqual(200);
        });
    });

    describe('Helper Functions', () => {
        it('should position at specific coordinates', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = PositionedHelpers.at(child, 30, 40);

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should position with fixed size', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = PositionedHelpers.sized(child, 10, 10, 80, 60);

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should fill entire container', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = PositionedHelpers.fill(child);

            const context = createMockContext();
            const result = positionedWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should position in corners with margin', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const context = createMockContext();

            const corners = [
                PositionedHelpers.topLeft,
                PositionedHelpers.topRight,
                PositionedHelpers.bottomLeft,
                PositionedHelpers.bottomRight,
            ];

            corners.forEach(cornerHelper => {
                const positionedWidget = cornerHelper(child, 5);
                expect(() => {
                    positionedWidget.layout(context);
                }).not.toThrow();
            });
        });

        it('should center horizontally and vertically', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const context = createMockContext();

            const horizontalWidget = PositionedHelpers.centerHorizontal(child, 20);
            const verticalWidget = PositionedHelpers.centerVertical(child, 30);

            expect(() => {
                horizontalWidget.layout(context);
                verticalWidget.layout(context);
            }).not.toThrow();
        });
    });

    describe('Position Calculation', () => {
        it('should calculate position correctly', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                left: 25,
                top: 35,
            });

            const containerSize = { width: 200, height: 150 };
            const position = positionedWidget.getPosition(containerSize);

            expect(position.x).toBe(25);
            expect(position.y).toBe(35);
        });

        it('should calculate size correctly', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const positionedWidget = new Positioned({
                child,
                left: 10,
                top: 10,
                width: 100,
                height: 80,
            });

            const containerSize = { width: 200, height: 150 };
            const size = positionedWidget.getCalculatedSize(containerSize);

            expect(size.width).toBeGreaterThan(0);
            expect(size.height).toBeGreaterThan(0);
        });
    });
});

describe('Stack Widget', () => {
    const createMockContext = (width = 200, height = 200): LayoutContext => ({
        constraints: {
            minWidth: 0,
            maxWidth: width,
            minHeight: 0,
            maxHeight: height,
        },
        textDirection: TextDirection.LeftToRight,
        theme: defaultTheme,
    });

    describe('Basic Functionality', () => {
        it('should handle empty children array', () => {
            const stackWidget = new Stack({ children: [] });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBe(0);
            expect(result.size.height).toBe(0);
        });

        it('should handle single child', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const stackWidget = new Stack({ children: [child] });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle multiple children', () => {
            const child1 = new Text('Hello', { style: { fontSize: 12 } });
            const child2 = new Text('World', { style: { fontSize: 14 } });
            const stackWidget = new Stack({ children: [child1, child2] });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle positioned children', () => {
            const child1 = new Text('Hello', { style: { fontSize: 12 } });
            const positionedChild = new Positioned({
                child: new Text('World', { style: { fontSize: 14 } }),
                left: 50,
                top: 30,
            });
            const stackWidget = new Stack({ children: [child1, positionedChild] });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Stack Fit Behavior', () => {
        it('should handle loose fit', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const stackWidget = new Stack({
                children: [child],
                fit: StackFit.Loose,
            });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle expand fit', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const stackWidget = new Stack({
                children: [child],
                fit: StackFit.Expand,
            });

            const context = createMockContext(150, 100);
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeLessThanOrEqual(150);
            expect(result.size.height).toBeLessThanOrEqual(100);
        });

        it('should handle passthrough fit', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const stackWidget = new Stack({
                children: [child],
                fit: StackFit.PassThrough,
            });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Alignment', () => {
        it('should handle different alignments', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignments = [
                Alignment.TopLeft,
                Alignment.Center,
                Alignment.BottomRight,
            ];

            const context = createMockContext();

            alignments.forEach(alignment => {
                const stackWidget = new Stack({
                    children: [child],
                    alignment,
                });

                expect(() => {
                    stackWidget.layout(context);
                }).not.toThrow();
            });
        });
    });

    describe('Helper Functions', () => {
        it('should create simple stack', () => {
            const child1 = new Text('Hello', { style: { fontSize: 12 } });
            const child2 = new Text('World', { style: { fontSize: 14 } });
            const stackWidget = StackHelpers.simple([child1, child2]);

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create centered stack', () => {
            const children = [new Text('Hello', { style: { fontSize: 12 } })];
            const stackWidget = StackHelpers.centered(children);

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create expanded stack', () => {
            const children = [new Text('Hello', { style: { fontSize: 12 } })];
            const stackWidget = StackHelpers.expanded(children);

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create aligned stack', () => {
            const children = [new Text('Hello', { style: { fontSize: 12 } })];
            const stackWidget = StackHelpers.aligned(children, Alignment.BottomCenter);

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create stack with positioned children', () => {
            const positionedChild = new Positioned({
                child: new Text('Hello', { style: { fontSize: 12 } }),
                left: 20,
                top: 30,
            });
            const stackWidget = StackHelpers.withPositioned([positionedChild]);

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create layered stack', () => {
            const children = [new Text('Hello', { style: { fontSize: 12 } })];
            const stackWidget = StackHelpers.layered(children, {
                alignment: Alignment.Center,
                fit: StackFit.Expand,
            });

            const context = createMockContext();
            const result = stackWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Paint Behavior', () => {
        it('should not throw during paint operation', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const stackWidget = new Stack({ children: [child] });

            const mockGraphics = {
                saveContext: () => { },
                restoreContext: () => { },
                setTransform: () => { },
                drawRect: () => { },
                setColor: () => { },
                setFillColor: () => { },
                setStrokeColor: () => { },
                clipPath: () => { },
                setFont: () => { },
                beginText: () => { },
                moveTextPosition: () => { },
                showText: () => { },
                drawString: (font: any, fontSize: number, text: string, x: number, y: number, options: any) => { },
                endText: () => { },
                drawLine: () => { },
                strokePath: () => { },
                fillPath: () => { },
                setLineWidth: () => { },
            };

            const paintContext = {
                graphics: mockGraphics,
                size: { width: 100, height: 50 },
                theme: defaultTheme,
            };

            expect(() => {
                stackWidget.paint(paintContext as any);
            }).not.toThrow();
        });

        it('should handle empty children during paint', () => {
            const stackWidget = new Stack({ children: [] });

            const mockGraphics = {
                saveContext: () => { },
                restoreContext: () => { },
                setTransform: () => { },
            };

            const paintContext = {
                graphics: mockGraphics,
                size: { width: 100, height: 50 },
                theme: defaultTheme,
            };

            expect(() => {
                stackWidget.paint(paintContext as any);
            }).not.toThrow();
        });
    });
});