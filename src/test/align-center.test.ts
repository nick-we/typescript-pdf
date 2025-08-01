/**
 * Tests for Align and Center widgets
 */

import { describe, it, expect } from 'vitest';
import { Align, AlignHelpers, type AlignmentGeometry } from '../widgets/align.js';
import { Center, CenterHelpers } from '../widgets/center.js';
import { Text } from '../widgets/text.js';
import { Alignment, TextDirection, defaultTheme } from '../types/layout.js';
import type { LayoutContext } from '../types/layout.js';

describe('Align Widget', () => {
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
        it('should align child widget according to alignment', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignWidget = new Align({
                child,
                alignment: Alignment.Center,
            });

            const context = createMockContext();
            const result = alignWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle custom alignment geometry', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const customAlignment: AlignmentGeometry = { x: 0.5, y: -1.0 }; // center-top
            const alignWidget = new Align({
                child,
                alignment: customAlignment,
            });

            const context = createMockContext();
            const result = alignWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should respect width and height factors', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignWidget = new Align({
                child,
                alignment: Alignment.Center,
                widthFactor: 0.5,
                heightFactor: 0.8,
            });

            const context = createMockContext(200, 200);
            const result = alignWidget.layout(context);

            // Size should be constrained by factors
            expect(result.size.width).toBeLessThanOrEqual(100); // 200 * 0.5
            expect(result.size.height).toBeLessThanOrEqual(160); // 200 * 0.8
        });

        it('should validate factor ranges', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });

            expect(() => {
                new Align({
                    child,
                    alignment: Alignment.Center,
                    widthFactor: 1.5, // Invalid: > 1.0
                });
            }).toThrow('widthFactor must be between 0.0 and 1.0');

            expect(() => {
                new Align({
                    child,
                    alignment: Alignment.Center,
                    heightFactor: -0.1, // Invalid: < 0.0
                });
            }).toThrow('heightFactor must be between 0.0 and 1.0');
        });
    });

    describe('Alignment Conversion', () => {
        it('should convert alignment enums to geometry correctly', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignments = [
                Alignment.TopLeft,
                Alignment.TopCenter,
                Alignment.TopRight,
                Alignment.CenterLeft,
                Alignment.Center,
                Alignment.CenterRight,
                Alignment.BottomLeft,
                Alignment.BottomCenter,
                Alignment.BottomRight,
            ];

            alignments.forEach(alignment => {
                const alignWidget = new Align({ child, alignment });
                const context = createMockContext();

                expect(() => {
                    alignWidget.layout(context);
                }).not.toThrow();
            });
        });
    });

    describe('Helper Functions', () => {
        it('should create aligned widgets with predefined alignments', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const context = createMockContext();

            const helpers = [
                AlignHelpers.topLeft,
                AlignHelpers.topCenter,
                AlignHelpers.topRight,
                AlignHelpers.centerLeft,
                AlignHelpers.center,
                AlignHelpers.centerRight,
                AlignHelpers.bottomLeft,
                AlignHelpers.bottomCenter,
                AlignHelpers.bottomRight,
            ];

            helpers.forEach(helper => {
                const alignWidget = helper(child);
                expect(() => {
                    alignWidget.layout(context);
                }).not.toThrow();
            });
        });

        it('should create aligned widget with custom alignment', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignWidget = AlignHelpers.withAlignment(child, Alignment.BottomRight);

            const context = createMockContext();
            const result = alignWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create aligned widget with geometry', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignWidget = AlignHelpers.withGeometry(child, 0.25, -0.5);

            const context = createMockContext();
            const result = alignWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Paint Behavior', () => {
        it('should not throw during paint operation', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const alignWidget = new Align({
                child,
                alignment: Alignment.Center,
            });

            const mockGraphics = {
                saveContext: () => { },
                restoreContext: () => { },
                setTransform: () => { },
                setColor: () => { },
                beginText: () => { },
                moveTextPosition: () => { },
                showText: () => { },
                drawString: (font: any, fontSize: number, text: string, x: number, y: number, options: any) => { },
                endText: () => { },
                drawLine: () => { },
                strokePath: () => { },
                fillPath: () => { },
                drawRect: () => { },
                setLineWidth: () => { },
            };

            const paintContext = {
                graphics: mockGraphics,
                size: { width: 100, height: 50 },
                theme: defaultTheme,
            };

            expect(() => {
                alignWidget.paint(paintContext as any);
            }).not.toThrow();
        });
    });
});

describe('Center Widget', () => {
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
        it('should center child widget', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = new Center({ child });

            const context = createMockContext();
            const result = centerWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should respect width and height factors', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = new Center({
                child,
                widthFactor: 0.6,
                heightFactor: 0.4,
            });

            const context = createMockContext(200, 200);
            const result = centerWidget.layout(context);

            // Size should be constrained by factors
            expect(result.size.width).toBeLessThanOrEqual(120); // 200 * 0.6
            expect(result.size.height).toBeLessThanOrEqual(80); // 200 * 0.4
        });
    });

    describe('Helper Functions', () => {
        it('should create simple centered widget', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = CenterHelpers.simple(child);

            const context = createMockContext();
            const result = centerWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create centered widget with width factor', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = CenterHelpers.withWidthFactor(child, 0.5);

            const context = createMockContext();
            const result = centerWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create centered widget with height factor', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = CenterHelpers.withHeightFactor(child, 0.75);

            const context = createMockContext();
            const result = centerWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should create centered widget with both factors', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = CenterHelpers.withFactors(child, 0.8, 0.6);

            const context = createMockContext();
            const result = centerWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Paint Behavior', () => {
        it('should not throw during paint operation', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const centerWidget = new Center({ child });

            const mockGraphics = {
                saveContext: () => { },
                restoreContext: () => { },
                setTransform: () => { },
                setColor: () => { },
                beginText: () => { },
                moveTextPosition: () => { },
                showText: () => { },
                drawString: (font: any, fontSize: number, text: string, x: number, y: number, options: any) => { },
                endText: () => { },
                drawLine: () => { },
                strokePath: () => { },
                fillPath: () => { },
                drawRect: () => { },
                setLineWidth: () => { },
            };

            const paintContext = {
                graphics: mockGraphics,
                size: { width: 100, height: 50 },
                theme: defaultTheme,
            };

            expect(() => {
                centerWidget.paint(paintContext as any);
            }).not.toThrow();
        });
    });
});