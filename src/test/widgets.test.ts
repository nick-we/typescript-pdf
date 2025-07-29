/**
 * Widget System Tests
 * 
 * Comprehensive tests for the widget system including base widgets,
 * text widgets, containers, and layout functionality.
 * 
 * @packageDocumentation
 */

import {
    BaseWidget,
    EmptyWidget,
    WidgetComposition,
    WidgetUtils,
    type Widget,
    type WidgetProps,
} from '../widgets/widget.js';
import { Text, TextAlign, TextOverflow, TextStyles } from '../widgets/text.js';
import {
    Container,
    BorderStyle,
    BorderRadiusUtils,
    ContainerDecorations,
} from '../widgets/container.js';
import {
    BoxConstraints,
    EdgeInsets,
    Alignment,
    AlignmentUtils,
    TextDirection,
    defaultTheme,
    type LayoutContext,
    type PaintContext,
} from '../types/layout.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { PdfGraphics, PdfColorRgb } from '../core/pdf/graphics.js';

// Mock PdfGraphics for testing
class MockPdfGraphics {
    private operations: string[] = [];

    setColor(color: PdfColorRgb): void {
        this.operations.push(`setColor(${color.red}, ${color.green}, ${color.blue})`);
    }

    setLineWidth(width: number): void {
        this.operations.push(`setLineWidth(${width})`);
    }

    drawRect(x: number, y: number, width: number, height: number): void {
        this.operations.push(`drawRect(${x}, ${y}, ${width}, ${height})`);
    }

    fillPath(): void {
        this.operations.push('fillPath()');
    }

    strokePath(): void {
        this.operations.push('strokePath()');
    }

    beginText(): void {
        this.operations.push('beginText()');
    }

    endText(): void {
        this.operations.push('endText()');
    }

    moveTextPosition(x: number, y: number): void {
        this.operations.push(`moveTextPosition(${x}, ${y})`);
    }

    showText(text: string): void {
        this.operations.push(`showText('${text}')`);
    }

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.operations.push(`drawLine(${x1}, ${y1}, ${x2}, ${y2})`);
    }

    saveContext(): void {
        this.operations.push('saveContext()');
    }

    restoreContext(): void {
        this.operations.push('restoreContext()');
    }

    setTransform(matrix: any): void {
        this.operations.push(`setTransform(${matrix.storage.join(', ')})`);
    }

    getOperations(): string[] {
        return [...this.operations];
    }

    clearOperations(): void {
        this.operations = [];
    }
}

describe('Widget System Tests', () => {
    let mockGraphics: MockPdfGraphics;
    let testContext: LayoutContext;
    let testPaintContext: PaintContext;

    beforeEach(() => {
        mockGraphics = new MockPdfGraphics();
        testContext = {
            constraints: BoxConstraints.loose({ width: 500, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };
        testPaintContext = {
            graphics: mockGraphics as any,
            size: { width: 100, height: 50 },
            theme: defaultTheme,
        };
    });

    describe('BaseWidget', () => {
        class TestWidget extends BaseWidget {
            layout(context: LayoutContext) {
                this.validateConstraints(context.constraints);
                return this.createLayoutResult({ width: 100, height: 50 });
            }

            paint(context: PaintContext): void {
                // Test implementation
            }
        }

        test('should create widget with props', () => {
            const widget = new TestWidget({
                key: 'test-key',
                debugLabel: 'TestWidget',
            });

            expect(widget.key).toBe('test-key');
            expect(widget.debugLabel).toBe('TestWidget');
        });

        test('should create layout result', () => {
            const widget = new TestWidget();
            const result = widget.layout(testContext);

            expect(result.size).toEqual({ width: 100, height: 50 });
            expect(result.needsRepaint).toBe(true);
        });

        test('should create layout result with baseline', () => {
            class TestWidgetWithBaseline extends BaseWidget {
                layout(context: LayoutContext) {
                    return this.createLayoutResult(
                        { width: 100, height: 50 },
                        { baseline: 40 }
                    );
                }
                paint(): void { }
            }

            const widget = new TestWidgetWithBaseline();
            const result = widget.layout(testContext);

            expect(result.baseline).toBe(40);
        });

        test('should validate constraints', () => {
            const widget = new TestWidget();
            const invalidConstraints = {
                minWidth: 100,
                maxWidth: 50, // Invalid: max < min
                minHeight: 0,
                maxHeight: 100,
            };

            expect(() => {
                widget.layout({
                    ...testContext,
                    constraints: invalidConstraints,
                });
            }).toThrow('Invalid constraints');
        });

        test('should constrain size to constraints', () => {
            class ConstrainTestWidget extends BaseWidget {
                layout(context: LayoutContext) {
                    const size = { width: 1000, height: 1000 }; // Too large
                    const constrainedSize = this.constrainSize(context.constraints, size);
                    return this.createLayoutResult(constrainedSize);
                }
                paint(): void { }
            }

            const widget = new ConstrainTestWidget();
            const result = widget.layout(testContext);

            expect(result.size.width).toBeLessThanOrEqual(testContext.constraints.maxWidth);
            expect(result.size.height).toBeLessThanOrEqual(testContext.constraints.maxHeight);
        });
    });

    describe('EmptyWidget', () => {
        test('should create empty widget with zero size', () => {
            const widget = new EmptyWidget();
            const result = widget.layout(testContext);

            expect(result.size).toEqual({ width: 0, height: 0 });
            expect(result.needsRepaint).toBe(false);
        });

        test('should paint nothing', () => {
            const widget = new EmptyWidget();
            widget.paint(testPaintContext);

            expect(mockGraphics.getOperations()).toEqual([]);
        });
    });

    describe('WidgetComposition', () => {
        test('should compose multiple behaviors', () => {
            const addKey = <T extends Widget>(widget: T): T => ({
                ...widget,
                key: 'composed-key',
            });

            const addDebugLabel = <T extends Widget>(widget: T): T => ({
                ...widget,
                debugLabel: 'composed-widget',
            });

            const composed = WidgetComposition.compose(addKey, addDebugLabel);
            const widget = new EmptyWidget();
            const result = composed(widget);

            expect(result.key).toBe('composed-key');
            expect(result.debugLabel).toBe('composed-widget');
        });

        test('should add debug information', () => {
            const widget = new EmptyWidget();
            const debugWidget = WidgetComposition.withDebug('debug-label')(widget);

            expect(debugWidget.debugLabel).toBe('debug-label');
        });

        test('should add constraint validation', () => {
            const widget = new EmptyWidget();
            const validatedWidget = WidgetComposition.withConstraintValidation(true)(widget);

            const invalidConstraints = {
                minWidth: 100,
                maxWidth: 50,
                minHeight: 0,
                maxHeight: 100,
            };

            expect(() => {
                validatedWidget.layout({
                    ...testContext,
                    constraints: invalidConstraints,
                });
            }).toThrow('Invalid constraints');
        });

        test('should add performance monitoring', () => {
            const widget = new EmptyWidget();
            const monitoredWidget = WidgetComposition.withPerformanceMonitoring(false)(widget);

            // Should not throw and should work normally
            const result = monitoredWidget.layout(testContext);
            expect(result.size).toEqual({ width: 0, height: 0 });

            monitoredWidget.paint(testPaintContext);
            expect(mockGraphics.getOperations()).toEqual([]);
        });
    });

    describe('WidgetUtils', () => {
        test('should create sized box', () => {
            const sizedBox = WidgetUtils.createSizedBox(
                { width: 200, height: 100 },
                { debugLabel: 'TestSizedBox' }
            );

            const result = sizedBox.layout(testContext);
            expect(result.size).toEqual({ width: 200, height: 100 });

            sizedBox.paint(testPaintContext);
            expect(mockGraphics.getOperations()).toEqual([]);
        });

        test('should create spacer', () => {
            const spacer = WidgetUtils.createSpacer({ debugLabel: 'TestSpacer' });
            const result = spacer.layout(testContext);

            expect(result.size.width).toBe(testContext.constraints.maxWidth);
            expect(result.size.height).toBe(testContext.constraints.maxHeight);
            expect(result.needsRepaint).toBe(false);
        });

        test('should handle infinite constraints in spacer', () => {
            const spacer = WidgetUtils.createSpacer();
            const infiniteContext = {
                ...testContext,
                constraints: BoxConstraints.expand(),
            };

            const result = spacer.layout(infiniteContext);
            expect(result.size.width).toBe(0);
            expect(result.size.height).toBe(0);
        });
    });

    describe('Text Widget', () => {
        test('should create text widget with default props', () => {
            const text = new Text('Hello World');
            const result = text.layout(testContext);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.baseline).toBeDefined();
        });

        test('should create text widget with custom style', () => {
            const text = new Text('Styled Text', {
                style: {
                    fontSize: 16,
                    fontFamily: PdfStandardFont.TimesRoman,
                    color: '#ff0000',
                    fontWeight: 'bold',
                },
                textAlign: TextAlign.Center,
            });

            const result = text.layout(testContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.baseline).toBeDefined();
        });

        test('should handle empty text', () => {
            const text = new Text('');
            text.paint(testPaintContext);

            // Should not paint anything for empty text
            expect(mockGraphics.getOperations()).toEqual([]);
        });

        test('should paint text with alignment', () => {
            const text = new Text('Test', {
                textAlign: TextAlign.Center,
            });

            text.paint(testPaintContext);

            const operations = mockGraphics.getOperations();
            expect(operations).toContain('beginText()');
            expect(operations).toContain("showText('Test')");
            expect(operations).toContain('endText()');
        });

        test('should handle text decorations', () => {
            const text = new Text('Underlined', {
                style: {
                    decoration: {
                        underline: true,
                        color: '#000000',
                    },
                },
            });

            text.paint(testPaintContext);

            const operations = mockGraphics.getOperations();
            expect(operations).toContain('beginText()');
            expect(operations).toContain('strokePath()'); // For underline
        });

        test('should handle different font variations', () => {
            const combinations = [
                { fontFamily: PdfStandardFont.Helvetica, fontWeight: 'bold' as const, fontStyle: 'italic' as const },
                { fontFamily: PdfStandardFont.TimesRoman, fontWeight: 'bold' as const },
                { fontFamily: PdfStandardFont.Courier, fontStyle: 'italic' as const },
            ];

            combinations.forEach(style => {
                const text = new Text('Test', { style });
                const result = text.layout(testContext);
                expect(result.size.width).toBeGreaterThan(0);
            });
        });

        test('should handle text wrapping', () => {
            const longText = 'This is a very long text that should wrap to multiple lines when the available width is limited';
            const text = new Text(longText, {
                softWrap: true,
            });

            const narrowConstraints = {
                ...testContext,
                constraints: BoxConstraints.loose({ width: 100, height: 300 }),
            };

            const result = text.layout(narrowConstraints);
            expect(result.size.width).toBeLessThanOrEqual(100);
        });
    });

    describe('Container Widget', () => {
        test('should create container with child', () => {
            const child = new Text('Child');
            const container = new Container({
                child,
                padding: EdgeInsets.all(10),
            });

            const result = container.layout(testContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle container without child', () => {
            const container = new Container({
                width: 100,
                height: 50,
            });

            const result = container.layout(testContext);
            expect(result.size.width).toBe(100);
            expect(result.size.height).toBe(50);
        });

        test('should apply padding and margin', () => {
            const child = new Text('Child');
            const container = new Container({
                child,
                padding: EdgeInsets.all(10),
                margin: EdgeInsets.all(5),
            });

            const result = container.layout(testContext);
            // Size should include padding and margin
            expect(result.size.width).toBeGreaterThan(30); // child + padding + margin
        });

        test('should paint background and border', () => {
            const container = new Container({
                width: 100,
                height: 50,
                decoration: {
                    color: '#ff0000',
                    border: {
                        width: 2,
                        color: '#000000',
                        style: BorderStyle.Solid,
                    },
                },
            });

            container.paint({
                ...testPaintContext,
                size: { width: 100, height: 50 },
            });

            const operations = mockGraphics.getOperations();
            expect(operations).toContain('saveContext()');
            expect(operations).toContain('fillPath()'); // Background
            expect(operations).toContain('strokePath()'); // Border
            expect(operations).toContain('restoreContext()');
        });

        test('should paint child with alignment', () => {
            const child = new Text('Child');
            const container = new Container({
                child,
                width: 200,
                height: 100,
                alignment: Alignment.Center,
            });

            container.paint({
                ...testPaintContext,
                size: { width: 200, height: 100 },
            });

            const operations = mockGraphics.getOperations();
            expect(operations).toContain('saveContext()');
            expect(operations).toContain('restoreContext()');
        });

        test('should handle size constraints', () => {
            const container = new Container({
                minWidth: 200,
                maxWidth: 300,
                minHeight: 100,
                maxHeight: 150,
            });

            const result = container.layout(testContext);
            expect(result.size.width).toBeGreaterThanOrEqual(200);
            expect(result.size.width).toBeLessThanOrEqual(300);
            expect(result.size.height).toBeGreaterThanOrEqual(100);
            expect(result.size.height).toBeLessThanOrEqual(150);
        });
    });

    describe('Layout System Types', () => {
        test('BoxConstraints should work correctly', () => {
            const tight = BoxConstraints.tight({ width: 100, height: 50 });
            expect(tight.minWidth).toBe(100);
            expect(tight.maxWidth).toBe(100);

            const loose = BoxConstraints.loose({ width: 200, height: 100 });
            expect(loose.minWidth).toBe(0);
            expect(loose.maxWidth).toBe(200);

            const expanded = BoxConstraints.expand();
            expect(expanded.maxWidth).toBe(Number.POSITIVE_INFINITY);
        });

        test('BoxConstraints validation should work', () => {
            const valid = BoxConstraints.tight({ width: 100, height: 50 });
            expect(BoxConstraints.isValid(valid)).toBe(true);

            const invalid = {
                minWidth: 100,
                maxWidth: 50,
                minHeight: 0,
                maxHeight: 100,
            };
            expect(BoxConstraints.isValid(invalid)).toBe(false);
        });

        test('EdgeInsets should work correctly', () => {
            const all = EdgeInsets.all(10);
            expect(EdgeInsets.horizontal(all)).toBe(20);
            expect(EdgeInsets.vertical(all)).toBe(20);

            const symmetric = EdgeInsets.symmetric({ horizontal: 5, vertical: 10 });
            expect(symmetric.left).toBe(5);
            expect(symmetric.top).toBe(10);

            const deflated = EdgeInsets.deflateSize(all, { width: 100, height: 50 });
            expect(deflated.width).toBe(80);
            expect(deflated.height).toBe(30);
        });

        test('AlignmentUtils should calculate positions correctly', () => {
            const containerSize = { width: 100, height: 50 };
            const childSize = { width: 20, height: 10 };

            const topLeft = AlignmentUtils.resolve(Alignment.TopLeft, containerSize, childSize);
            expect(topLeft).toEqual({ x: 0, y: 0 });

            const center = AlignmentUtils.resolve(Alignment.Center, containerSize, childSize);
            expect(center).toEqual({ x: 40, y: 20 });

            const bottomRight = AlignmentUtils.resolve(Alignment.BottomRight, containerSize, childSize);
            expect(bottomRight).toEqual({ x: 80, y: 40 });
        });
    });

    describe('BorderRadiusUtils', () => {
        test('should create uniform border radius', () => {
            const radius = BorderRadiusUtils.all(10);
            expect(radius.topLeft).toBe(10);
            expect(radius.topRight).toBe(10);
            expect(radius.bottomLeft).toBe(10);
            expect(radius.bottomRight).toBe(10);
        });

        test('should create specific corner radius', () => {
            const radius = BorderRadiusUtils.only({
                topLeft: 5,
                bottomRight: 15,
            });
            expect(radius.topLeft).toBe(5);
            expect(radius.topRight).toBe(0);
            expect(radius.bottomLeft).toBe(0);
            expect(radius.bottomRight).toBe(15);
        });
    });

    describe('Text Styles and Container Decorations', () => {
        test('should provide predefined text styles', () => {
            expect(TextStyles.h1.fontSize).toBe(24);
            expect(TextStyles.h1.fontWeight).toBe('bold');
            expect(TextStyles.body.fontSize).toBe(12);
            expect(TextStyles.code.fontFamily).toBe(PdfStandardFont.Courier);
        });

        test('should provide predefined container decorations', () => {
            expect(ContainerDecorations.card.color).toBe('#ffffff');
            expect(ContainerDecorations.outlined.border?.style).toBe(BorderStyle.Solid);
            expect(ContainerDecorations.elevated.boxShadow).toBeDefined();
        });
    });
});