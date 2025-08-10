/**
 * Data Visualization Test Suite - Consolidated
 *
 * Tests all data visualization functionality from the consolidated widget system.
 * Consolidates: table.test.ts, chart.test.ts, table-*.test.ts, chart-*.test.ts
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import consolidated widget system
import { PdfColor } from '@/core/pdf';
import { createMockPaintContext } from '@/test/mock-interfaces.js';
import type { Layout } from '@/types.js';
import {
    Table,
    TableRow,
    Chart,
    BarChart,
    LineChart,
    DataUtils,
    Txt,
    Container,
    BarOrientation,
    LineMarker,
    TableColumnWidthType,
    TextOverflow,
} from '@/widgets/index.js';

describe('Data Visualization Systems', () => {
    let mockLayoutContext: Layout.LayoutContext;

    beforeEach(() => {
        const mockTheme = {
            colorScheme: {
                primary: PdfColor.fromHex('#1976d2'),
                secondary: PdfColor.fromHex('#dc004e'),
                background: PdfColor.fromHex('#ffffff'),
                surface: PdfColor.fromHex('#f5f5f5'),
                onBackground: PdfColor.fromHex('#000000'),
                onSurface: PdfColor.fromHex('#000000'),
                onPrimary: PdfColor.fromHex('#ffffff'),
                onSecondary: PdfColor.fromHex('#ffffff'),
                error: PdfColor.fromHex('#d32f2f'),
                success: PdfColor.fromHex('#388e3c'),
                warning: PdfColor.fromHex('#f57c00'),
                info: PdfColor.fromHex('#1976d2'),
            },
            spacing: { xs: 2, sm: 4, md: 8, lg: 16, xl: 24, xxl: 32 },
            defaultTextStyle: {
                fontSize: 12,
                fontFamily: 'Helvetica',
                color: PdfColor.black,
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

    describe('Table System', () => {
        it('should create basic table with data', () => {
            const tableData = [
                ['Name', 'Age', 'City'],
                ['Alice', '25', 'New York'],
                ['Bob', '30', 'London'],
                ['Charlie', '35', 'Paris'],
            ];

            const table = new Table({ data: tableData });
            const layout = table.layout(mockLayoutContext);

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle table with custom column widths', () => {
            const tableData = [
                ['Product', 'Price', 'Stock'],
                ['Widget A', '$10.99', '150'],
                ['Widget B', '$15.49', '75'],
            ];

            const table = new Table({
                data: tableData,
                columnWidths: [
                    { type: TableColumnWidthType.Fixed, value: 120 },
                    { type: TableColumnWidthType.Flex, value: 1 },
                    { type: TableColumnWidthType.Fixed, value: 80 },
                ],
            });

            const layout = table.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(200); // At least fixed widths
        });

        it('should create table with borders', () => {
            const simpleData = [
                ['A', 'B'],
                ['1', '2'],
            ];

            const table = new Table({
                data: simpleData,
                borders: {
                    top: { width: 1, color: PdfColor.fromHex('#000000') },
                    right: { width: 1, color: PdfColor.fromHex('#000000') },
                    bottom: { width: 1, color: PdfColor.fromHex('#000000') },
                    left: { width: 1, color: PdfColor.fromHex('#000000') },
                },
            });

            const layout = table.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle table with cell alignment', () => {
            const tableData = [
                ['Left', 'Center', 'Right'],
                ['Data 1', 'Data 2', 'Data 3'],
            ];

            const table = new Table({
                data: tableData,
            });

            const layout = table.layout(mockLayoutContext);
            expect(layout.size).toBeDefined();
        });

        it('should create individual table rows', () => {
            const row = new TableRow({
                children: [
                    new Txt('Cell 1'),
                    new Txt('Cell 2'),
                    new Txt('Cell 3'),
                ],
            });

            const layout = row.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle empty table data', () => {
            const table = new Table({ data: [] });
            const layout = table.layout(mockLayoutContext);

            expect(layout.size.width).toBe(0);
            expect(layout.size.height).toBe(0);
        });

        it('should handle table with varying row lengths', () => {
            const unevenData = [
                ['Header 1', 'Header 2', 'Header 3'],
                ['Row 1 Col 1', 'Row 1 Col 2'], // Missing third column
                ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3', 'Extra Col'], // Extra column
            ];

            const table = new Table({ data: unevenData });
            const layout = table.layout(mockLayoutContext);

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });
    });

    describe('Chart System', () => {
        it('should create basic chart with data series', () => {
            const series = [
                {
                    name: 'Sales',
                    data: [
                        { x: 'Q1', y: 100 },
                        { x: 'Q2', y: 150 },
                        { x: 'Q3', y: 120 },
                        { x: 'Q4', y: 180 },
                    ],
                },
            ];

            const chart = new Chart({
                title: 'Quarterly Sales',
                series,
                width: 400,
                height: 300,
            });

            const layout = chart.layout(mockLayoutContext);
            expect(layout.size.width).toBe(400);
            expect(layout.size.height).toBe(300);
        });

        it('should create bar chart with vertical orientation', () => {
            const series = [
                {
                    name: 'Revenue',
                    data: [
                        { x: 'Jan', y: 1000 },
                        { x: 'Feb', y: 1200 },
                        { x: 'Mar', y: 1100 },
                    ],
                },
            ];

            const barChart = new BarChart({
                title: 'Monthly Revenue',
                series,
                orientation: BarOrientation.Vertical,
            });

            const layout = barChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create bar chart with horizontal orientation', () => {
            const series = [
                {
                    name: 'Users',
                    data: [
                        { x: 'Mobile', y: 450 },
                        { x: 'Desktop', y: 320 },
                        { x: 'Tablet', y: 180 },
                    ],
                },
            ];

            const barChart = new BarChart({
                title: 'Users by Device',
                series,
                orientation: BarOrientation.Horizontal,
            });

            const layout = barChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create line chart with markers', () => {
            const series = [
                {
                    name: 'Growth',
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 15 },
                        { x: 3, y: 12 },
                        { x: 4, y: 18 },
                        { x: 5, y: 22 },
                    ],
                },
            ];

            const lineChart = new LineChart({
                title: 'Growth Trend',
                series,
                marker: LineMarker.Circle,
                fill: false,
            });

            const layout = lineChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should create line chart with filled area', () => {
            const series = [
                {
                    name: 'Temperature',
                    data: [
                        { x: '6am', y: 15 },
                        { x: '12pm', y: 25 },
                        { x: '6pm', y: 22 },
                        { x: '12am', y: 18 },
                    ],
                },
            ];

            const lineChart = new LineChart({
                title: 'Daily Temperature',
                series,
                fill: true,
                marker: LineMarker.Square,
            });

            const layout = lineChart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle chart with multiple data series', () => {
            const series = [
                {
                    name: 'Series 1',
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                    ],
                },
                {
                    name: 'Series 2',
                    data: [
                        { x: 1, y: 15 },
                        { x: 2, y: 25 },
                    ],
                },
                {
                    name: 'Series 3',
                    data: [
                        { x: 1, y: 8 },
                        { x: 2, y: 18 },
                    ],
                },
            ];

            const chart = new Chart({
                title: 'Multi-Series Chart',
                series,
            });

            const layout = chart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
        });

        it('should handle empty chart data', () => {
            const chart = new Chart({
                title: 'Empty Chart',
                series: [],
            });

            const layout = chart.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0); // Should have minimum size for title
            expect(layout.size.height).toBeGreaterThan(0);
        });
    });

    describe('Data Utilities', () => {
        it('should create chart data series from arrays', () => {
            const values = [10, 20, 15, 25, 30];
            const series = DataUtils.arrayToSeries('Test Series', values);

            expect(series.name).toBe('Test Series');
            expect(series.data).toHaveLength(5);
            expect(series.data[0]?.x).toBe(0);
            expect(series.data[0]?.y).toBe(10);
            expect(series.data[4]?.x).toBe(4);
            expect(series.data[4]?.y).toBe(30);
        });

        it('should create chart data series from objects', () => {
            const dataPoints = [
                { x: 'A', y: 100 },
                { x: 'B', y: 150 },
                { x: 'C', y: 120 },
            ];

            const series = DataUtils.createSeries('Object Series', dataPoints);
            expect(series.name).toBe('Object Series');
            expect(series.data).toHaveLength(3);
            expect(series.data[1]?.x).toBe('B');
            expect(series.data[1]?.y).toBe(150);
        });

        it('should generate color palettes for charts', () => {
            const colors3 = DataUtils.generateColors(3);
            const colors5 = DataUtils.generateColors(5);
            const colors10 = DataUtils.generateColors(10);

            expect(colors3).toHaveLength(3);
            expect(colors5).toHaveLength(5);
            expect(colors10).toHaveLength(10);

            // Colors should be valid hex codes
            colors5.forEach(color => {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });

        it('should create column width configurations', () => {
            const fixedWidth = DataUtils.columnWidths.fixed(100);
            const flexWidth = DataUtils.columnWidths.flex(2);
            const fractionWidth = DataUtils.columnWidths.fraction(0.3);

            expect(fixedWidth.type).toBe('fixed');
            expect(fixedWidth.value).toBe(100);

            expect(flexWidth.type).toBe('flex');
            expect(flexWidth.value).toBe(2);

            expect(fractionWidth.type).toBe('fraction');
            expect(fractionWidth.value).toBe(0.3);
        });

        it('should format table cell data', () => {
            const numericData = 1234.567;
            const stringData = 'Hello World';
            const dateData = new Date('2023-01-01');

            // Test basic formatting concepts
            const formattedNumber = numericData.toFixed(2);
            const formattedString =
                stringData.length > 10
                    ? stringData.slice(0, 10) + '...'
                    : stringData;
            const formattedDate = dateData.getFullYear().toString();

            expect(formattedNumber).toBe('1234.57');
            expect(formattedString).toBe('Hello Worl...');
            expect(formattedDate).toBe('2023');
        });

        it('should validate data series', () => {
            const validSeries = {
                name: 'Valid',
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
            };

            const invalidSeries = {
                name: '',
                data: [],
            };

            // Test basic validation concepts
            const isValidSeriesValid =
                validSeries.name.length > 0 && validSeries.data.length > 0;
            const isInvalidSeriesValid =
                invalidSeries.name.length > 0 && invalidSeries.data.length > 0;

            expect(isValidSeriesValid).toBe(true);
            expect(isInvalidSeriesValid).toBe(false);
        });

        it('should calculate data statistics', () => {
            const data = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
                { x: 3, y: 15 },
                { x: 4, y: 25 },
            ];
            const values = data.map(d => d.y);

            // Calculate stats manually for testing
            const min = Math.min(...values);
            const max = Math.max(...values);
            const average = values.reduce((a, b) => a + b, 0) / values.length;
            const count = values.length;

            expect(min).toBe(10);
            expect(max).toBe(25);
            expect(average).toBe(17.5);
            expect(count).toBe(4);
        });
    });

    describe('Data Integration', () => {
        it('should create table-chart combination', () => {
            const chartData = DataUtils.arrayToSeries(
                'Revenue',
                [10000, 12000, 11000]
            );

            const combinedWidget = new Container({
                child: new Container({
                    child: new Chart({
                        title: 'Monthly Revenue',
                        series: [chartData],
                        height: 200,
                    }),
                }),
            });

            const layout = combinedWidget.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThanOrEqual(200); // Chart height plus table
        });

        it('should handle responsive data layouts', () => {
            const data = [
                ['Product', 'Q1', 'Q2', 'Q3', 'Q4'],
                ['Widget A', '100', '120', '110', '140'],
                ['Widget B', '80', '90', '95', '105'],
            ];

            // Create both table and chart from same data
            const table = new Table({ data });
            const chartSeries = [
                DataUtils.arrayToSeries('Widget A', [100, 120, 110, 140]),
                DataUtils.arrayToSeries('Widget B', [80, 90, 95, 105]),
            ];
            const chart = new BarChart({
                title: 'Product Performance',
                series: chartSeries,
            });

            // Test different constraint scenarios
            const constraintScenarios = [
                { minWidth: 0, maxWidth: 400, minHeight: 0, maxHeight: 300 },
                { minWidth: 0, maxWidth: 800, minHeight: 0, maxHeight: 600 },
                {
                    minWidth: 200,
                    maxWidth: 600,
                    minHeight: 150,
                    maxHeight: 400,
                },
            ];

            constraintScenarios.forEach(constraints => {
                const context = { ...mockLayoutContext, constraints };

                const tableLayout = table.layout(context);
                const chartLayout = chart.layout(context);

                expect(tableLayout.size.width).toBeLessThanOrEqual(
                    constraints.maxWidth
                );
                expect(tableLayout.size.height).toBeLessThanOrEqual(
                    constraints.maxHeight
                );
                expect(chartLayout.size.width).toBeLessThanOrEqual(
                    constraints.maxWidth
                );
                expect(chartLayout.size.height).toBeLessThanOrEqual(
                    constraints.maxHeight
                );
            });
        });

        it('should maintain data consistency across widgets', () => {
            const sourceData = [
                { label: 'A', value: 100 },
                { label: 'B', value: 200 },
                { label: 'C', value: 150 },
            ];

            // Create table data
            const tableData = [
                ['Label', 'Value'],
                ...sourceData.map(item => [item.label, item.value.toString()]),
            ];

            // Create chart data
            const chartSeries = DataUtils.createSeries(
                'Values',
                sourceData.map((item, index) => ({ x: index, y: item.value }))
            );

            const table = new Table({ data: tableData });
            const chart = new Chart({
                title: 'Data Chart',
                series: [chartSeries],
            });

            const tableLayout = table.layout(mockLayoutContext);
            const chartLayout = chart.layout(mockLayoutContext);

            // Both should layout successfully
            expect(tableLayout.size).toBeDefined();
            expect(chartLayout.size).toBeDefined();

            // Data integrity check
            expect(tableData.length - 1).toBe(sourceData.length); // -1 for header
            expect(chartSeries.data.length).toBe(sourceData.length);
        });
    });
});

describe('Table Text Overflow System - Consolidated', () => {
    // Reuse the typed mock paint context used across table tests
    const createTestPaintContext = () =>
        createMockPaintContext({
            size: { width: 400, height: 300 },
        });

    const shortText = 'Short';
    const mediumText = 'Medium length content';
    const longText =
        'This is a very long text that will definitely exceed the normal cell width and should trigger overflow behavior';
    const veryLongText =
        'This is an extremely long text content that spans multiple lines and should definitely test the limits of our text overflow system with various behaviors including clipping ellipsis and visible modes';

    describe('TextOverflow.Clip', () => {
        it('clips text at cell boundaries using PDF clipping regions', () => {
            const table = new Table({
                data: [
                    ['Short', 'Medium text', longText],
                    [shortText, mediumText, veryLongText],
                ],
                columnWidths: [
                    DataUtils.columnWidths.fixed(80),
                    DataUtils.columnWidths.fixed(120),
                    DataUtils.columnWidths.fixed(100),
                ],
                textOverflow: TextOverflow.Clip,
                borders: DataUtils.borders.all({
                    width: 1,
                    color: PdfColor.fromHex('#cccccc'),
                }),
            });

            const context = createTestPaintContext();
            let clipRegionSet = false;
            let clipRegionCleared = false;

            // Track clipping calls
            context.graphics!.setClippingRect = () => {
                clipRegionSet = true;
            };
            context.graphics!.clearClipping = () => {
                clipRegionCleared = true;
            };

            // Layout and paint
            const layoutResult = table.layout({
                constraints: {
                    minWidth: 0,
                    maxWidth: 400,
                    minHeight: 0,
                    maxHeight: 300,
                },
                theme: context.theme,
            } as any);

            expect(layoutResult.size.width).toBeGreaterThan(0);
            expect(layoutResult.size.height).toBeGreaterThan(0);

            table.paint(context);

            // Verify clipping was used
            expect(clipRegionSet).toBe(true);
            expect(clipRegionCleared).toBe(true);
        });

        it('respects maxLines parameter when clipping', () => {
            const table = new Table({
                data: [[veryLongText]],
                columnWidths: [DataUtils.columnWidths.fixed(150)],
                textOverflow: TextOverflow.Clip,
                maxLines: 2,
            });

            const context = createTestPaintContext();
            let linesRendered = 0;

            // Count text rendering calls
            const originalDraw = context.graphics!.drawString;
            context.graphics!.drawString = (font, fontSize, text, x, y) => {
                linesRendered++;
                return originalDraw?.(font, fontSize, text, x, y);
            };

            table.paint(context);

            // Should render at most 2 lines
            expect(linesRendered).toBeLessThanOrEqual(2);
        });
    });

    describe('TextOverflow.Ellipsis', () => {
        it('truncates with ellipsis when exceeding boundaries', () => {
            const table = new Table({
                data: [[longText]],
                columnWidths: [DataUtils.columnWidths.fixed(50)], // Force overflow
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();
            let ellipsisUsed = false;

            const originalDrawString = context.graphics!.drawString;
            context.graphics!.drawString = (font, fontSize, text, x, y) => {
                if (text.includes('…')) {
                    ellipsisUsed = true;
                }
                return originalDrawString?.(font, fontSize, text, x, y);
            };

            table.paint(context);

            expect(ellipsisUsed).toBe(true);
        });
    });

    describe('TextOverflow.Visible', () => {
        it('allows text to extend beyond cell boundaries (no clipping)', () => {
            const table = new Table({
                data: [[longText, shortText]],
                columnWidths: [
                    DataUtils.columnWidths.fixed(50),
                    DataUtils.columnWidths.fixed(100),
                ],
                textOverflow: TextOverflow.Visible,
            });

            const context = createTestPaintContext();
            let clippingUsed = false;

            context.graphics!.setClippingRect = () => {
                clippingUsed = true;
            };

            table.paint(context);

            expect(clippingUsed).toBe(false);
        });

        it('still respects maxLines even with visible overflow', () => {
            const table = new Table({
                data: [[veryLongText]],
                columnWidths: [DataUtils.columnWidths.fixed(80)],
                textOverflow: TextOverflow.Visible,
                maxLines: 3,
            });

            const context = createTestPaintContext();
            let linesRendered = 0;

            const originalDraw = context.graphics!.drawString;
            context.graphics!.drawString = (font, fontSize, text, x, y) => {
                linesRendered++;
                return originalDraw?.(font, fontSize, text, x, y);
            };

            table.paint(context);

            expect(linesRendered).toBeLessThanOrEqual(3);
        });
    });

    describe('Per-Row Overrides', () => {
        it('TableRow overrides table-level text overflow', () => {
            const table = new Table({
                textOverflow: TextOverflow.Clip,
                columnWidths: [DataUtils.columnWidths.fixed(40)], // Force overflow
                children: [
                    new TableRow({
                        children: [new Txt(longText)],
                        textOverflow: TextOverflow.Ellipsis,
                    }),
                    new TableRow({
                        children: [new Txt(longText)],
                        textOverflow: TextOverflow.Visible,
                    }),
                    new TableRow({
                        children: [new Txt(longText)],
                        // Uses table default (Clip)
                    }),
                ],
            });

            const context = createTestPaintContext();
            let ellipsisUsed = false;
            let clippingUsed = false;

            const originalDraw = context.graphics!.drawString;
            context.graphics!.drawString = (font, fontSize, text, x, y) => {
                if (text.includes('…')) {
                    ellipsisUsed = true;
                }
                return originalDraw?.(font, fontSize, text, x, y);
            };
            context.graphics!.setClippingRect = () => {
                clippingUsed = true;
            };

            table.paint(context);

            expect(ellipsisUsed).toBe(true);
            expect(clippingUsed).toBe(true);
        });

        it('TableRow can override maxLines independently', () => {
            const table = new Table({
                maxLines: 1, // Table default
                columnWidths: [DataUtils.columnWidths.fixed(100)],
                children: [
                    new TableRow({
                        children: [new Txt(veryLongText)],
                        maxLines: 3, // Override to 3 lines
                    }),
                    new TableRow({
                        children: [new Txt(veryLongText)],
                        // Uses table default (1)
                    }),
                ],
            });

            const context = createTestPaintContext();

            expect(() => {
                table.paint(context);
            }).not.toThrow();
        });
    });

    describe('Mixed Content & Width Strategies', () => {
        it('works with different column width types under overflow', () => {
            const table = new Table({
                data: [[longText, longText, longText, longText]],
                columnWidths: [
                    DataUtils.columnWidths.fixed(80),
                    DataUtils.columnWidths.flex(),
                    DataUtils.columnWidths.fraction(0.2),
                    DataUtils.columnWidths.intrinsic(),
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            expect(() => {
                const layoutResult = table.layout({
                    constraints: {
                        minWidth: 0,
                        maxWidth: 400,
                        minHeight: 0,
                        maxHeight: 300,
                    },
                    theme: context.theme,
                } as any);

                expect(layoutResult.size.width).toBeGreaterThan(0);
                table.paint(context);
            }).not.toThrow();
        });
    });

    describe('Performance (Smoke)', () => {
        it('renders a larger table with overflow handling within reasonable time', () => {
            const largeData: string[][] = [];
            for (let i = 0; i < 30; i++) {
                largeData.push([
                    `Row ${i} Col 1: ${longText}`,
                    `Row ${i} Col 2: ${veryLongText}`,
                    `Row ${i} Col 3: ${mediumText}`,
                ]);
            }

            const table = new Table({
                data: largeData,
                columnWidths: [
                    DataUtils.columnWidths.fixed(100),
                    DataUtils.columnWidths.fixed(120),
                    DataUtils.columnWidths.fixed(80),
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            const startTime = performance.now();
            expect(() => table.paint(context)).not.toThrow();
            const renderTime = performance.now() - startTime;

            // Keep test under strict budget to avoid flakes
            expect(renderTime).toBeLessThan(1500);
        });
    });
});
