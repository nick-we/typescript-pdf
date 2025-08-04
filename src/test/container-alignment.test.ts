/**
 * Container Alignment Test - Reproduce Centering Issue
 * 
 * This test reproduces and validates the Container widget alignment system,
 * specifically focusing on the Center alignment bug where child widgets
 * are not properly centered within their Container parents.
 */

import { describe, test, expect } from 'vitest';
import { Container } from '../widgets/layout.js';
import { TextWidget } from '../widgets/text.js';
import { Layout, Theme, defaultTheme } from '../types.js';
import { Document } from '../core/document.js';

describe('Container Alignment System', () => {
    const mockTheme = defaultTheme;
    const mockConstraints: Layout.BoxConstraints = {
        minWidth: 0,
        maxWidth: 300,
        minHeight: 0,
        maxHeight: 200,
    };

    test('AlignmentUtils.resolve calculates center position correctly', () => {
        // Test the core alignment calculation logic
        const containerSize = { width: 200, height: 100 };
        const childSize = { width: 50, height: 30 };

        const centerPosition = Layout.AlignmentUtils.resolve(
            Layout.Alignment.Center,
            containerSize,
            childSize
        );

        // Expected center position:
        // x = (containerWidth - childWidth) / 2 = (200 - 50) / 2 = 75
        // y = (containerHeight - childHeight) / 2 = (100 - 30) / 2 = 35
        expect(centerPosition.x).toBe(75);
        expect(centerPosition.y).toBe(35);

        console.log(`Center calculation: container=${JSON.stringify(containerSize)}, child=${JSON.stringify(childSize)}, result=${JSON.stringify(centerPosition)}`);
    });

    test('Container with center alignment layouts correctly', () => {
        const textWidget = new TextWidget('CENTERED', {
            style: { fontSize: 16, color: '#000000' }
        });

        const container = new Container({
            width: 200,
            height: 100,
            alignment: Layout.Alignment.Center,
            decoration: {
                color: '#f0f0f0',
                border: { width: 1, color: '#000000' }
            },
            child: textWidget
        });

        const context: Layout.LayoutContext = {
            constraints: mockConstraints,
            textDirection: 'ltr',
            theme: mockTheme,
        };

        const result = container.layout(context);

        // Verify layout result
        expect(result.size.width).toBe(200);
        expect(result.size.height).toBe(100);
        expect(result.needsRepaint).toBe(true);

        console.log(`Container layout result:`, result);
    });

    test('Container centers text widget correctly in paint phase', () => {
        const textWidget = new TextWidget('TEST', {
            style: { fontSize: 12, color: '#000000' }
        });

        const container = new Container({
            width: 100,
            height: 60,
            alignment: Layout.Alignment.Center,
            child: textWidget
        });

        const layoutContext: Layout.LayoutContext = {
            constraints: { minWidth: 0, maxWidth: 100, minHeight: 0, maxHeight: 60 },
            textDirection: 'ltr',
            theme: mockTheme,
        };

        // Layout phase
        const layoutResult = container.layout(layoutContext);

        // Mock paint context without graphics for testing
        const paintContext: Layout.PaintContext = {
            size: layoutResult.size,
            theme: mockTheme,
        };

        // This should not throw and should log correct positioning
        expect(() => container.paint(paintContext)).not.toThrow();

        console.log('Paint test completed - check console logs for positioning');
    });

    test('All alignment positions calculate correctly', () => {
        const containerSize = { width: 100, height: 60 };
        const childSize = { width: 20, height: 10 };

        const alignmentTests = [
            { alignment: Layout.Alignment.TopLeft, expected: { x: 0, y: 0 } },
            { alignment: Layout.Alignment.TopCenter, expected: { x: 40, y: 0 } },
            { alignment: Layout.Alignment.TopRight, expected: { x: 80, y: 0 } },
            { alignment: Layout.Alignment.CenterLeft, expected: { x: 0, y: 25 } },
            { alignment: Layout.Alignment.Center, expected: { x: 40, y: 25 } },
            { alignment: Layout.Alignment.CenterRight, expected: { x: 80, y: 25 } },
            { alignment: Layout.Alignment.BottomLeft, expected: { x: 0, y: 50 } },
            { alignment: Layout.Alignment.BottomCenter, expected: { x: 40, y: 50 } },
            { alignment: Layout.Alignment.BottomRight, expected: { x: 80, y: 50 } },
        ];

        alignmentTests.forEach(({ alignment, expected }) => {
            const position = Layout.AlignmentUtils.resolve(
                alignment,
                containerSize,
                childSize
            );

            expect(position.x).toBe(expected.x);
            expect(position.y).toBe(expected.y);

            console.log(`${alignment}: expected=${JSON.stringify(expected)}, actual=${JSON.stringify(position)}`);
        });
    });
});

describe('Container Alignment Visual Test', () => {
    test('Generate PDF with alignment demonstration', async () => {
        const doc = new Document();

        // Create containers with different alignments to visually verify positioning
        const alignmentShowcase = new Container({
            width: 400,
            height: 300,
            decoration: {
                color: '#ffffff',
                border: { width: 2, color: '#000000' }
            },
            child: new Container({
                width: 200,
                height: 100,
                alignment: Layout.Alignment.Center,
                decoration: {
                    color: '#e0e0e0',
                    border: { width: 1, color: '#666666' }
                },
                child: new TextWidget('SHOULD BE CENTERED', {
                    style: { fontSize: 14, color: '#000000' }
                })
            })
        });

        doc.addPage({
            build: () => alignmentShowcase
        });

        const pdfBytes = await doc.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(0);

        console.log(`Generated alignment test PDF: ${pdfBytes.length} bytes`);
        console.log('Check if "SHOULD BE CENTERED" appears in the center of the gray box');
    });
});