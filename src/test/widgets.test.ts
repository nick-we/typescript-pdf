/**
 * Widget Systems Test Suite - Consolidated
 *
 * Tests all widget functionality from the consolidated widget system.
 * Consolidates: widgets.test.ts, text-*.test.ts, rich-text.test.ts, flex.test.ts
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import consolidated widget system
import { PdfColor } from '@/core/pdf';
import { Layout, Theme as ThemeTypes, Flex as FlexTypes } from '@/types.js';
import {
    // Base widgets
    EmptyWidget,
    WidgetUtils,

    // Text widgets
    Txt,
    RichText,
    TextAlign,
    TextOverflow,
    TextUtils,
    TextStyles,

    // Layout widgets
    Container,
    Stack,
    Positioned,
    LayoutUtils,

    // Flex widgets
    Row,
    Column,
    Flexible,
    Expanded,
    FlexUtils,

    // Data widgets
    Table,
    Chart,
    BarChart,
    LineChart,
    DataUtils,

    // Theme widgets
    Theme,
    DefaultTextStyle,
    ThemeUtils,
    PrebuiltThemes,
} from '@/widgets/index.js';

describe('Widget Systems', () => {
    let mockTheme: ThemeTypes.ThemeData;
    let mockLayoutContext: Layout.LayoutContext;
    let mockPaintContext: Layout.PaintContext;

    beforeEach(() => {
        mockTheme = ThemeUtils.light();
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
        mockPaintContext = {
            size: { width: 600, height: 800 },
            theme: mockTheme,
        };
    });

    describe('Base Widget System', () => {
        it('should create EmptyWidget with zero size', () => {
            const empty = new EmptyWidget();
            const layout = empty.layout(mockLayoutContext);

            expect(layout.size.width).toBe(0);
            expect(layout.size.height).toBe(0);
            expect(layout.needsRepaint).toBe(false);
        });

        it('should create SizedBox with fixed dimensions', () => {
            const sizedBox = WidgetUtils.sizedBox(100, 50);
            const layout = sizedBox.layout(mockLayoutContext);

            expect(layout.size.width).toBe(100);
            expect(layout.size.height).toBe(50);
        });

        it('should create Spacer that fills available space', () => {
            const spacer = WidgetUtils.spacer();
            const layout = spacer.layout(mockLayoutContext);

            expect(layout.size.width).toBe(600); // max constraint
            expect(layout.size.height).toBe(800); // max constraint
        });

        it('should apply widget composition behaviors', () => {
            const empty = new EmptyWidget();
            const withDebug = WidgetUtils.withDebug('test-widget')(empty);

            expect(withDebug.debugLabel).toBe('test-widget');
        });

        it('should validate constraints properly', () => {
            const sizedBox = WidgetUtils.sizedBox(100, 50);
            const invalidConstraints = {
                minWidth: 200, // Greater than maxWidth
                maxWidth: 100,
                minHeight: 0,
                maxHeight: 100,
            };

            expect(() => {
                sizedBox.layout({
                    ...mockLayoutContext,
                    constraints: invalidConstraints,
                });
            }).toThrow();
        });
    });

    describe('Text Widget System', () => {
        it('should render basic text', () => {
            const text = new Txt('Hello World');
            const layout = text.layout(mockLayoutContext);

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
            expect(layout.baseline).toBeGreaterThan(0);
        });

        it('should handle text alignment', () => {
            const leftText = new Txt('Left', {
                textAlign: TextAlign.Left,
            });
            const centerText = new Txt('Center', {
                textAlign: TextAlign.Center,
            });
            const rightText = new Txt('Right', {
                textAlign: TextAlign.Right,
            });

            const leftLayout = leftText.layout(mockLayoutContext);
            const centerLayout = centerText.layout(mockLayoutContext);
            const rightLayout = rightText.layout(mockLayoutContext);

            expect(leftLayout.size).toBeDefined();
            expect(centerLayout.size).toBeDefined();
            expect(rightLayout.size).toBeDefined();
        });

        it('should handle text overflow', () => {
            const clipText = new Txt('Long text', {
                overflow: TextOverflow.Clip,
            });
            const ellipsisText = new Txt('Long text', {
                overflow: TextOverflow.Ellipsis,
            });

            const clipLayout = clipText.layout(mockLayoutContext);
            const ellipsisLayout = ellipsisText.layout(mockLayoutContext);

            expect(clipLayout.size).toBeDefined();
            expect(ellipsisLayout.size).toBeDefined();
        });

        it('should render rich text with multiple spans', () => {
            const richText = new RichText({
                spans: [
                    {
                        text: 'Bold ',
                        style: { fontWeight: ThemeTypes.FontWeight.Bold },
                    },
                    {
                        text: 'Italic ',
                        style: { fontStyle: ThemeTypes.FontStyle.Italic },
                    },
                    { text: 'Normal' },
                ],
            });

            const layout = richText.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should use text styles properly', () => {
            const h1Text = new Txt('Heading', { style: TextStyles.h1 });
            const bodyText = new Txt('Body', { style: TextStyles.body });
            const captionText = new Txt('Caption', {
                style: TextStyles.caption,
            });

            const h1Layout = h1Text.layout(mockLayoutContext);
            const bodyLayout = bodyText.layout(mockLayoutContext);
            const captionLayout = captionText.layout(mockLayoutContext);

            // H1 should be larger than body, body larger than caption
            expect(h1Layout.size.height).toBeGreaterThan(
                bodyLayout.size.height
            );
            expect(bodyLayout.size.height).toBeGreaterThan(
                captionLayout.size.height
            );
        });

        it('should provide text utility functions', () => {
            const width = TextUtils.estimateWidth('Test text', 12);
            expect(width).toBeGreaterThan(0);

            const height = TextUtils.estimateHeight(12, 1.2);
            expect(height).toBeCloseTo(14.4, 1); // 12 * 1.2 with tolerance

            const truncated = TextUtils.truncate(
                'Very long text that should be truncated',
                50,
                12
            );
            expect(truncated).toContain('...');

            const wrapped = TextUtils.wrap(
                'This is a long sentence that should wrap',
                80,
                12
            );
            expect(wrapped.length).toBeGreaterThan(1);
        });
    });

    describe('Layout Widget System', () => {
        it('should create containers with padding', () => {
            const child = new Txt('Child');
            const container = new Container({
                child,
                padding: Layout.EdgeInsets.all(16),
            });

            const layout = container.layout(mockLayoutContext);
            const childLayout = child.layout(mockLayoutContext);

            // Container should be larger than child due to padding
            expect(layout.size.width).toBeGreaterThan(childLayout.size.width);
            expect(layout.size.height).toBeGreaterThan(childLayout.size.height);
        });

        it('should create containers with margin', () => {
            const child = new Txt('Child');
            const container = new Container({
                child,
                margin: Layout.EdgeInsets.all(20),
            });

            const layout = container.layout(mockLayoutContext);
            const childLayout = child.layout(mockLayoutContext);

            // Container should be larger than child due to margin
            expect(layout.size.width).toBeGreaterThan(childLayout.size.width);
            expect(layout.size.height).toBeGreaterThan(childLayout.size.height);
        });

        it('should handle container alignment', () => {
            const child = new Txt('Child');
            const centered = new Container({
                child,
                alignment: Layout.Alignment.Center,
            });
            const topLeft = new Container({
                child,
                alignment: Layout.Alignment.TopLeft,
            });

            const centeredLayout = centered.layout(mockLayoutContext);
            const topLeftLayout = topLeft.layout(mockLayoutContext);

            expect(centeredLayout.size).toBeDefined();
            expect(topLeftLayout.size).toBeDefined();
        });

        it('should create stacks with positioned children', () => {
            const stack = new Stack({
                children: [
                    new Txt('Background'),
                    new Positioned({
                        child: new Txt('Positioned'),
                        top: 10,
                        left: 20,
                    }),
                ],
            });

            const layout = stack.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should use layout utility shortcuts', () => {
            const child = new Txt('Test');

            const padded = LayoutUtils.padded(child, 16);
            const centered = LayoutUtils.centered(child);
            const sized = LayoutUtils.sized(child, 200, 100);

            expect(padded).toBeInstanceOf(Container);
            expect(centered).toBeInstanceOf(Container);
            expect(sized).toBeInstanceOf(Container);

            const sizedLayout = sized.layout(mockLayoutContext);
            expect(sizedLayout.size.width).toBe(200);
            expect(sizedLayout.size.height).toBe(100);
        });
    });

    describe('Flex Widget System', () => {
        it('should create horizontal layouts (Row)', () => {
            const row = new Row({
                children: [
                    new Txt('Item 1'),
                    new Txt('Item 2'),
                    new Txt('Item 3'),
                ],
                mainAxisAlignment: FlexTypes.MainAxisAlignment.SpaceBetween,
            });

            const layout = row.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create vertical layouts (Column)', () => {
            const column = new Column({
                children: [
                    new Txt('Line 1'),
                    new Txt('Line 2'),
                    new Txt('Line 3'),
                ],
                crossAxisAlignment: FlexTypes.CrossAxisAlignment.Center,
            });

            const layout = column.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle flexible children', () => {
            const flexible = new Flexible({
                child: new Txt('Flexible'),
                flex: 2,
            });

            expect(flexible.flexData?.flex).toBe(2);
            expect(flexible.flexData?.fit).toBe(FlexTypes.FlexFit.Loose);

            const layout = flexible.layout(mockLayoutContext);
            expect(layout.size).toBeDefined();
        });

        it('should handle expanded children', () => {
            const expanded = new Expanded({
                child: new Txt('Expanded'),
                flex: 3,
            });

            expect(expanded.flexData?.flex).toBe(3);
            expect(expanded.flexData?.fit).toBe(FlexTypes.FlexFit.Tight);
        });

        it('should use flex utility functions', () => {
            const children = [new Txt('A'), new Txt('B'), new Txt('C')];

            const row = FlexUtils.row(children);
            const column = FlexUtils.column(children);
            const flexible = FlexUtils.flexible(new Txt('Flex'));
            const expanded = FlexUtils.expanded(new Txt('Expand'));

            expect(row).toBeInstanceOf(Row);
            expect(column).toBeInstanceOf(Column);
            expect(flexible).toBeInstanceOf(Flexible);
            expect(expanded).toBeInstanceOf(Expanded);
        });

        it('should handle complex flex layouts', () => {
            const complexRow = new Row({
                children: [
                    new Txt('Fixed'),
                    new Flexible({
                        child: new Txt('Flexible'),
                        flex: 1,
                    }),
                    new Expanded({
                        child: new Txt('Expanded'),
                        flex: 2,
                    }),
                ],
                mainAxisAlignment: FlexTypes.MainAxisAlignment.SpaceEvenly,
                crossAxisAlignment: FlexTypes.CrossAxisAlignment.Stretch,
            });

            const layout = complexRow.layout(mockLayoutContext);
            expect(layout.size.width).toBeLessThanOrEqual(
                mockLayoutContext.constraints.maxWidth
            );
            expect(layout.size.height).toBeGreaterThan(0);
        });
    });

    describe('Data Widget System', () => {
        it('should create tables with data', () => {
            const tableData = [
                ['Name', 'Age', 'City'],
                ['Alice', '25', 'New York'],
                ['Bob', '30', 'London'],
            ];

            const table = new Table({ data: tableData });
            const layout = table.layout(mockLayoutContext);

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create tables with custom column widths', () => {
            const table = new Table({
                data: [['A', 'B', 'C']],
                columnWidths: [
                    DataUtils.columnWidths.fixed(100),
                    DataUtils.columnWidths.flex(1),
                    DataUtils.columnWidths.fraction(0.3),
                ],
            });

            const layout = table.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
        });

        it('should create charts with data series', () => {
            const series = [
                DataUtils.createSeries('Sales', [
                    { x: 'Q1', y: 100 },
                    { x: 'Q2', y: 150 },
                    { x: 'Q3', y: 120 },
                ]),
            ];

            const chart = new Chart({
                title: 'Test Chart',
                series,
                width: 400,
                height: 300,
            });

            const layout = chart.layout(mockLayoutContext);
            expect(layout.size.width).toBe(400);
            expect(layout.size.height).toBe(300);
        });

        it('should create bar charts', () => {
            const series = [
                DataUtils.arrayToSeries('Values', [10, 20, 15, 25]),
            ];

            const barChart = new BarChart({
                title: 'Bar Chart',
                series,
                orientation: 'vertical' as any,
            });

            const layout = barChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create line charts', () => {
            const series = [
                DataUtils.arrayToSeries('Trend', [5, 10, 7, 15, 12]),
            ];

            const lineChart = new LineChart({
                title: 'Line Chart',
                series,
                fill: true,
                marker: 'circle' as any,
            });

            const layout = lineChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should provide data utility functions', () => {
            const colors = DataUtils.generateColors(5);
            expect(colors).toHaveLength(5);
            expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/i);

            const series = DataUtils.createSeries('Test', [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ]);
            expect(series.name).toBe('Test');
            expect(series.data).toHaveLength(2);

            const arraySeries = DataUtils.arrayToSeries('Array', [1, 2, 3]);
            expect(arraySeries.data).toHaveLength(3);
            expect(arraySeries.data[0]?.x).toBe(0);
            expect(arraySeries.data[0]?.y).toBe(1);
        });
    });

    describe('Theme Widget System', () => {
        it('should provide theme to descendants', () => {
            const customTheme = PrebuiltThemes.modern();
            const child = new Txt('Themed text');
            const theme = new Theme({
                child,
                data: customTheme,
            });

            const layout = theme.layout(mockLayoutContext);
            expect(layout.size).toBeDefined();
        });

        it('should provide default text styles', () => {
            const textStyle = ThemeUtils.textStyle({
                fontSize: 16,
                fontWeight: ThemeTypes.FontWeight.Bold,
            });

            const child = new Txt('Styled text');
            const defaultTextStyle = new DefaultTextStyle({
                child,
                style: textStyle,
            });

            const layout = defaultTextStyle.layout(mockLayoutContext);
            expect(layout.size).toBeDefined();
        });

        it('should use prebuilt themes', () => {
            const minimal = PrebuiltThemes.minimal();
            const corporate = PrebuiltThemes.corporate();
            const modern = PrebuiltThemes.modern();

            expect(minimal.colorScheme.primary).toStrictEqual(
                PdfColor.fromHex('#2c3e50')
            );
            expect(corporate.colorScheme.primary).toStrictEqual(
                PdfColor.fromHex('#1f4e79')
            );
            expect(modern.colorScheme.primary).toStrictEqual(
                PdfColor.fromHex('#6c5ce7')
            );
        });

        it('should merge text styles properly', () => {
            const baseStyle = ThemeUtils.textStyle({
                fontSize: 12,
                fontWeight: ThemeTypes.FontWeight.Normal,
                fontFamily: 'Helvetica', // Include fontFamily in base
            });

            const overrideStyle: ThemeTypes.TextStyle = {
                fontSize: 16,
                fontWeight: ThemeTypes.FontWeight.Bold,
            };

            const merged = ThemeUtils.mergeTextStyles(baseStyle, overrideStyle);
            expect(merged.fontSize).toBe(16);
            expect(merged.fontWeight).toBe(ThemeTypes.FontWeight.Bold);
            expect(merged.fontFamily).toBe('Helvetica'); // Should inherit from base
        });
    });

    describe('Widget Integration', () => {
        it('should support complex widget composition', () => {
            const complexWidget = new Container({
                padding: Layout.EdgeInsets.all(20),
                child: new Column({
                    children: [
                        new Txt('Title', { style: TextStyles.h1 }),
                        LayoutUtils.padded(
                            new Row({
                                children: [
                                    new Flexible({
                                        child: new Txt('Left'),
                                        flex: 1,
                                    }),
                                    new Expanded({
                                        child: new Txt('Right'),
                                        flex: 2,
                                    }),
                                ],
                            }),
                            16
                        ),
                        new Table({
                            data: [
                                ['A', 'B'],
                                ['1', '2'],
                            ],
                        }),
                    ],
                }),
            });

            const layout = complexWidget.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);

            // Should be able to paint without errors
            expect(() => {
                complexWidget.paint(mockPaintContext);
            }).not.toThrow();
        });

        it('should handle nested themed widgets', () => {
            const nestedTheme = new Theme({
                data: PrebuiltThemes.modern(),
                child: new Container({
                    child: new DefaultTextStyle({
                        style: ThemeUtils.textStyle({ fontSize: 14 }),
                        child: new Column({
                            children: [
                                new Txt('Themed text 1'),
                                new Txt('Themed text 2'),
                                new RichText({
                                    spans: [
                                        { text: 'Rich ' },
                                        {
                                            text: 'themed ',
                                            style: {
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                            },
                                        },
                                        { text: 'text' },
                                    ],
                                }),
                            ],
                        }),
                    }),
                }),
            });

            const layout = nestedTheme.layout(mockLayoutContext);
            expect(layout.size).toBeDefined();
        });

        it('should maintain proper widget lifecycle', () => {
            const widgets = [
                new EmptyWidget(),
                new Txt('Test'),
                new Container({ child: new Txt('Container') }),
                new Row({ children: [new Txt('Row')] }),
                new Table({ data: [['Table']] }),
            ];

            widgets.forEach(widget => {
                const layout = widget.layout(mockLayoutContext);
                expect(layout.size).toBeDefined();
                expect(layout.needsRepaint).toBeDefined();

                expect(() => {
                    widget.paint(mockPaintContext);
                }).not.toThrow();
            });
        });
    });
});
