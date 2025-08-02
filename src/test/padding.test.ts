/**
 * Tests for Padding widget
 */

import { describe, it, expect } from 'vitest';
import { Padding, PaddingHelpers } from '../widgets/padding.js';
import { Text } from '../widgets/text.js';
import { EdgeInsets, BoxConstraints, defaultTheme } from '../types/layout.js';
import type { LayoutContext } from '../types/layout.js';
import { TextDirection } from '@/core/text-layout.js';

describe('Padding Widget', () => {
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
        it('should add padding around child widget', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const padding = EdgeInsets.all(10);
            const paddingWidget = new Padding({ child, padding });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            // The result should include padding in the size
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should constrain child with deflated constraints', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const padding = EdgeInsets.all(20);
            const paddingWidget = new Padding({ child, padding });

            const context = createMockContext(100, 100);
            const result = paddingWidget.layout(context);

            // Result should respect parent constraints
            expect(result.size.width).toBeLessThanOrEqual(100);
            expect(result.size.height).toBeLessThanOrEqual(100);
        });

        it('should preserve child baseline with padding offset', () => {
            // Create a mock child that returns a baseline
            const child = {
                layout: () => ({
                    size: { width: 50, height: 20 },
                    baseline: 15,
                    needsRepaint: true,
                }),
                paint: () => { },
            };

            const padding = EdgeInsets.only({ top: 10 });
            const paddingWidget = new Padding({ child, padding });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            expect(result.baseline).toBe(25); // 15 + 10 (top padding)
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero padding', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const padding = EdgeInsets.zero;
            const paddingWidget = new Padding({ child, padding });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        it('should handle asymmetric padding', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const padding = EdgeInsets.only({
                left: 5,
                right: 15,
                top: 10,
                bottom: 20,
            });
            const paddingWidget = new Padding({ child, padding });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            // Size should include all padding
            expect(result.size.width).toBeGreaterThan(20); // at least left + right padding
            expect(result.size.height).toBeGreaterThan(30); // at least top + bottom padding
        });
    });

    describe('Helper Functions', () => {
        it('should create padding with all sides equal', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const paddingWidget = PaddingHelpers.all(child, 16);

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(32); // at least 16 * 2
            expect(result.size.height).toBeGreaterThan(32); // at least 16 * 2
        });

        it('should create symmetric padding', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const paddingWidget = PaddingHelpers.symmetric(child, {
                horizontal: 20,
                vertical: 10,
            });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(40); // at least 20 * 2
            expect(result.size.height).toBeGreaterThan(20); // at least 10 * 2
        });

        it('should create padding for specific sides only', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const paddingWidget = PaddingHelpers.only(child, {
                left: 10,
                top: 5,
            });

            const context = createMockContext();
            const result = paddingWidget.layout(context);

            expect(result.size.width).toBeGreaterThan(10); // at least left padding
            expect(result.size.height).toBeGreaterThan(5); // at least top padding
        });
    });

    describe('Paint Behavior', () => {
        it('should not throw during paint operation', () => {
            const child = new Text('Hello', { style: { fontSize: 12 } });
            const padding = EdgeInsets.all(10);
            const paddingWidget = new Padding({ child, padding });

            // Mock graphics context
            const mockGraphics = {
                saveContext: () => { },
                restoreContext: () => { },
                setTransform: () => { },
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
                drawRect: () => { },
                setLineWidth: () => { },
            };

            const paintContext = {
                graphics: mockGraphics,
                size: { width: 100, height: 50 },
                theme: defaultTheme,
            };

            expect(() => {
                paddingWidget.paint(paintContext as any);
            }).not.toThrow();
        });
    });
});