/**
 * Chart widget tests
 * 
 * Tests the Chart, BarChart, and LineChart widgets with:
 * - Layout calculations and constraint handling
 * - Data binding and series management
 * - Rendering context and coordinate transformations
 * - Helper functions and convenience methods
 * 
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    Chart,
    BarChart,
    LineChart,
    ChartColors,
    ChartHelpers,
    BarChartHelpers,
    LineChartHelpers,
    BarOrientation,
    BarMode,
    LineMarker,
    type ChartDataSeries,
    type ChartDataPoint,
    type BarChartProps,
    type LineChartProps,
} from '../widgets/index.js';
import {
    BoxConstraints,
    EdgeInsets,
    TextDirection,
    defaultTheme,
    type LayoutContext,
    type PaintContext,
} from '../types/layout.js';
import { PdfGraphics } from '../core/pdf/graphics.js';
import { PdfContentStream } from '../core/pdf/document.js';
import { PdfColor } from '@/core/pdf/color.js';

// Mock graphics context for testing
class MockGraphics {
    public operations: string[] = [];

    saveContext(): void {
        this.operations.push('saveContext');
    }

    restoreContext(): void {
        this.operations.push('restoreContext');
    }

    setFillColor(color: PdfColor): void {
        this.operations.push(`setFillColor(${color.toHex()})`);
    }

    setStrokeColor(color: PdfColor): void {
        this.operations.push(`setStrokeColor(${color.toHex()})`);
    }

    setLineWidth(width: number): void {
        this.operations.push(`setLineWidth(${width})`);
    }

    drawRect(x: number, y: number, width: number, height: number): void {
        this.operations.push(`drawRect(${x}, ${y}, ${width}, ${height})`);
    }

    fillPath(): void {
        this.operations.push('fillPath');
    }

    strokePath(): void {
        this.operations.push('strokePath');
    }

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.operations.push(`drawLine(${x1}, ${y1}, ${x2}, ${y2})`);
    }

    moveTo(x: number, y: number): void {
        this.operations.push(`moveTo(${x}, ${y})`);
    }

    lineTo(x: number, y: number): void {
        this.operations.push(`lineTo(${x}, ${y})`);
    }

    curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        this.operations.push(`curveTo(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3})`);
    }

    closePath(): void {
        this.operations.push('closePath');
    }

    setTransform(matrix: any): void {
        this.operations.push('setTransform');
    }

    clipPath(): void {
        this.operations.push('clipPath');
    }

    // Text rendering methods for fallback scenarios
    beginText(): void {
        this.operations.push('beginText()');
    }

    endText(): void {
        this.operations.push('endText()');
    }

    setFont(font: any, size?: number): void {
        this.operations.push(`setFont("${font.name ?? font}")`);
    }

    moveTextPosition(x: number, y: number): void {
        this.operations.push(`moveTextPosition(${x}, ${y})`);
    }

    showText(text: string): void {
        this.operations.push(`showText('${text}')`);
    }
}

// Test data
const sampleSeriesData: ChartDataSeries[] = [
    {
        name: 'Series 1',
        color: PdfColor.fromHex('#3366cc'),
        data: [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 15 },
            { x: 3, y: 25 },
        ],
    },
    {
        name: 'Series 2',
        color: PdfColor.fromHex('#dc3912'),
        data: [
            { x: 0, y: 5 },
            { x: 1, y: 15 },
            { x: 2, y: 25 },
            { x: 3, y: 20 },
        ],
    },
];

const categoricalSeriesData: ChartDataSeries[] = [
    {
        name: 'Sales',
        color: PdfColor.fromHex('#109618'),
        data: [
            { x: 'Q1', y: 100 },
            { x: 'Q2', y: 120 },
            { x: 'Q3', y: 90 },
            { x: 'Q4', y: 110 },
        ],
    },
];

describe('ChartColors', () => {
    it('should provide predefined colors', () => {
        expect(ChartColors.Primary).toStrictEqual(PdfColor.fromHex('#3366cc'));
        expect(ChartColors.Secondary).toStrictEqual(PdfColor.fromHex('#dc3912'));
        expect(ChartColors.Success).toStrictEqual(PdfColor.fromHex('#109618'));
    });

    it('should cycle through colors by index', () => {
        expect(ChartColors.getColor(0)).toStrictEqual(PdfColor.fromHex('#3366cc'));
        expect(ChartColors.getColor(1)).toStrictEqual(PdfColor.fromHex('#dc3912'));
        expect(ChartColors.getColor(10)).toStrictEqual(PdfColor.fromHex('#3366cc')); // Cycles back to first color (index 0)
        expect(ChartColors.getColor(9)).toStrictEqual(PdfColor.fromHex('#316395')); // Last color in array
    });
});

describe('ChartHelpers', () => {
    it('should create series from arrays', () => {
        const xData = [1, 2, 3, 4];
        const yData = [10, 20, 15, 25];

        const series = ChartHelpers.createSeries('Test Series', xData, yData, PdfColor.fromHex('#ff0000'));

        expect(series.name).toBe('Test Series');
        expect(series.color).toStrictEqual(PdfColor.fromHex('#ff0000'));
        expect(series.data).toHaveLength(4);
        expect(series.data[0]).toEqual({ x: 1, y: 10 });
        expect(series.data[3]).toEqual({ x: 4, y: 25 });
    });

    it('should create categorical series', () => {
        const categories = ['A', 'B', 'C'];
        const values = [10, 20, 30];

        const series = ChartHelpers.createCategoricalSeries('Categories', categories, values);

        expect(series.name).toBe('Categories');
        expect(series.data).toHaveLength(3);
        expect(series.data[0]).toEqual({ x: 'A', y: 10 });
        expect(series.data[2]).toEqual({ x: 'C', y: 30 });
    });

    it('should throw error for mismatched array lengths', () => {
        expect(() => {
            ChartHelpers.createSeries('Test', [1, 2, 3], [10, 20]);
        }).toThrow('X and Y data arrays must have the same length');
    });
});

describe('BarChart', () => {
    let layoutContext: LayoutContext;
    let paintContext: PaintContext;
    let mockGraphics: MockGraphics;

    beforeEach(() => {
        layoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        mockGraphics = new MockGraphics();
        paintContext = {
            graphics: mockGraphics as any,
            size: { width: 400, height: 300 },
            theme: defaultTheme,
        };
    });

    describe('construction', () => {
        it('should create with default properties', () => {
            const chart = new BarChart({
                series: sampleSeriesData,
            });

            expect(chart).toBeDefined();
        });

        it('should validate bar width', () => {
            expect(() => {
                new BarChart({
                    series: sampleSeriesData,
                    barWidth: 1.5, // Invalid: > 1
                });
            }).toThrow('Bar width must be between 0 and 1');

            expect(() => {
                new BarChart({
                    series: sampleSeriesData,
                    barWidth: 0, // Invalid: <= 0
                });
            }).toThrow('Bar width must be between 0 and 1');
        });

        it('should accept all valid properties', () => {
            const props: BarChartProps = {
                series: sampleSeriesData,
                title: 'Test Chart',
                orientation: BarOrientation.Horizontal,
                mode: BarMode.Stacked,
                barWidth: 0.6,
                showValues: true,
                width: 500,
                height: 400,
            };

            const chart = new BarChart(props);
            expect(chart).toBeDefined();
        });
    });

    describe('layout', () => {
        it('should calculate layout with default size', () => {
            const chart = new BarChart({
                series: sampleSeriesData,
            });

            const result = chart.layout(layoutContext);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.needsRepaint).toBe(true);
        });

        it('should respect explicit dimensions', () => {
            const chart = new BarChart({
                series: sampleSeriesData,
                width: 300,
                height: 200,
            });

            const result = chart.layout(layoutContext);

            expect(result.size.width).toBe(300);
            expect(result.size.height).toBe(200);
        });

        it('should handle tight constraints', () => {
            const tightContext: LayoutContext = {
                ...layoutContext,
                constraints: BoxConstraints.tight({ width: 200, height: 150 }),
            };

            const chart = new BarChart({
                series: sampleSeriesData,
            });

            const result = chart.layout(tightContext);

            expect(result.size.width).toBe(200);
            expect(result.size.height).toBe(150);
        });

        it('should handle empty series', () => {
            const chart = new BarChart({
                series: [],
            });

            const result = chart.layout(layoutContext);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('painting', () => {
        it('should paint bars for series data', () => {
            const chart = new BarChart({
                series: sampleSeriesData,
                title: 'Test Chart',
            });

            chart.layout(layoutContext);
            chart.paint(paintContext);

            const ops = mockGraphics.operations;
            expect(ops).toContain('saveContext');
            expect(ops).toContain('restoreContext');
            expect(ops.filter(op => op.includes('setFillColor')).length).toBeGreaterThan(0);
            expect(ops.filter(op => op.includes('drawRect')).length).toBeGreaterThan(0);
            expect(ops.filter(op => op.includes('fillPath')).length).toBeGreaterThan(0);
        });

        it('should paint without errors for empty series', () => {
            const chart = new BarChart({
                series: [],
            });

            chart.layout(layoutContext);

            expect(() => {
                chart.paint(paintContext);
            }).not.toThrow();
        });
    });
});

describe('LineChart', () => {
    let layoutContext: LayoutContext;
    let paintContext: PaintContext;
    let mockGraphics: MockGraphics;

    beforeEach(() => {
        layoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        mockGraphics = new MockGraphics();
        paintContext = {
            graphics: mockGraphics as any,
            size: { width: 400, height: 300 },
            theme: defaultTheme,
        };
    });

    describe('construction', () => {
        it('should create with default properties', () => {
            const chart = new LineChart({
                series: sampleSeriesData,
            });

            expect(chart).toBeDefined();
        });

        it('should validate area opacity', () => {
            expect(() => {
                new LineChart({
                    series: sampleSeriesData,
                    areaOpacity: 1.5, // Invalid: > 1
                });
            }).toThrow('Area opacity must be between 0 and 1');

            expect(() => {
                new LineChart({
                    series: sampleSeriesData,
                    areaOpacity: -0.1, // Invalid: < 0
                });
            }).toThrow('Area opacity must be between 0 and 1');
        });

        it('should accept all valid properties', () => {
            const props: LineChartProps = {
                series: sampleSeriesData,
                title: 'Line Chart',
                showMarkers: true,
                markerStyle: LineMarker.Circle,
                markerSize: 6,
                fillArea: true,
                areaOpacity: 0.5,
                smoothLines: true,
                lineWidth: 3,
                showValues: true,
                width: 500,
                height: 400,
            };

            const chart = new LineChart(props);
            expect(chart).toBeDefined();
        });
    });

    describe('layout', () => {
        it('should calculate layout correctly', () => {
            const chart = new LineChart({
                series: sampleSeriesData,
            });

            const result = chart.layout(layoutContext);

            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.needsRepaint).toBe(true);
        });

        it('should handle single point series', () => {
            const singlePointSeries: ChartDataSeries[] = [{
                name: 'Single Point',
                color: PdfColor.fromHex('#000000'),
                data: [{ x: 1, y: 10 }],
            }];

            const chart = new LineChart({
                series: singlePointSeries,
            });

            const result = chart.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('painting', () => {
        it('should paint lines and markers', () => {
            const chart = new LineChart({
                series: sampleSeriesData,
                showMarkers: true,
                markerStyle: LineMarker.Circle,
            });

            chart.layout(layoutContext);
            chart.paint(paintContext);

            const ops = mockGraphics.operations;
            expect(ops).toContain('saveContext');
            expect(ops).toContain('restoreContext');
            expect(ops.filter(op => op.includes('setStrokeColor')).length).toBeGreaterThan(0);
            expect(ops.filter(op => op.includes('moveTo')).length).toBeGreaterThan(0);
            expect(ops.filter(op => op.includes('lineTo')).length).toBeGreaterThan(0);
        });

        it('should paint area fill when enabled', () => {
            const chart = new LineChart({
                series: sampleSeriesData,
                fillArea: true,
                areaOpacity: 0.3,
            });

            chart.layout(layoutContext);
            chart.paint(paintContext);

            const ops = mockGraphics.operations;
            expect(ops.filter(op => op.includes('fillPath')).length).toBeGreaterThan(0);
            expect(ops.filter(op => op.includes('closePath')).length).toBeGreaterThan(0);
        });
    });
});

describe('BarChartHelpers', () => {
    it('should create simple bar chart', () => {
        const categories = ['A', 'B', 'C'];
        const values = [10, 20, 15];

        const chart = BarChartHelpers.createSimple(categories, values, {
            title: 'Simple Chart',
            color: PdfColor.fromHex('#ff0000'),
        });

        expect(chart).toBeInstanceOf(BarChart);
    });

    it('should create grouped bar chart', () => {
        const categories = ['Q1', 'Q2', 'Q3'];
        const seriesData = [
            { name: 'Product A', values: [10, 15, 12] },
            { name: 'Product B', values: [8, 18, 14] },
        ];

        const chart = BarChartHelpers.createGrouped(categories, seriesData, {
            title: 'Grouped Chart',
            orientation: BarOrientation.Horizontal,
        });

        expect(chart).toBeInstanceOf(BarChart);
    });

    it('should create stacked bar chart', () => {
        const categories = ['Q1', 'Q2'];
        const seriesData = [
            { name: 'Revenue', values: [100, 120] },
            { name: 'Profit', values: [20, 25] },
        ];

        const chart = BarChartHelpers.createStacked(categories, seriesData, {
            title: 'Stacked Chart',
        });

        expect(chart).toBeInstanceOf(BarChart);
    });

    it('should validate input arrays', () => {
        expect(() => {
            BarChartHelpers.createSimple(['A', 'B'], [10]); // Mismatched lengths
        }).toThrow('Categories and values must have the same length');

        expect(() => {
            BarChartHelpers.createGrouped(['A', 'B'], [{
                name: 'Test',
                values: [10], // Wrong length
            }]);
        }).toThrow('Series "Test" values length must match categories length');
    });
});

describe('LineChartHelpers', () => {
    it('should create simple line chart', () => {
        const xData = [1, 2, 3, 4];
        const yData = [10, 20, 15, 25];

        const chart = LineChartHelpers.createSimple(xData, yData, {
            title: 'Simple Line',
            color: PdfColor.fromHex('#0000ff'),
            showMarkers: false,
            fillArea: true,
        });

        expect(chart).toBeInstanceOf(LineChart);
    });

    it('should create multi-series line chart', () => {
        const seriesData = [
            { name: 'Series A', xData: [1, 2, 3], yData: [10, 20, 15] },
            { name: 'Series B', xData: [1, 2, 3], yData: [5, 15, 25] },
        ];

        const chart = LineChartHelpers.createMultiSeries(seriesData, {
            title: 'Multi-Series',
            smoothLines: true,
        });

        expect(chart).toBeInstanceOf(LineChart);
    });

    it('should create time series chart', () => {
        const timestamps = [1609459200, 1609545600, 1609632000]; // Unix timestamps
        const values = [100, 105, 98];

        const chart = LineChartHelpers.createTimeSeries(timestamps, values, {
            title: 'Time Series',
            fillArea: true,
            smoothLines: true,
        });

        expect(chart).toBeInstanceOf(LineChart);
    });

    it('should validate input arrays', () => {
        expect(() => {
            LineChartHelpers.createSimple([1, 2, 3], [10, 20]); // Mismatched lengths
        }).toThrow('X and Y data arrays must have the same length');

        expect(() => {
            LineChartHelpers.createMultiSeries([{
                name: 'Test',
                xData: [1, 2],
                yData: [10], // Wrong length
            }]);
        }).toThrow('Series "Test" X and Y data arrays must have the same length');
    });
});

describe('Chart Integration', () => {
    it('should handle complex layout scenarios', () => {
        const chart = new BarChart({
            series: sampleSeriesData,
            title: 'Integration Test',
            legend: {
                show: true,
                position: 'bottom',
                alignment: 'center',
            },
            xAxis: {
                title: 'X Axis',
                showGrid: true,
            },
            yAxis: {
                title: 'Y Axis',
                showGrid: true,
            },
        });

        const context: LayoutContext = {
            constraints: BoxConstraints.loose({ width: 600, height: 400 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        const result = chart.layout(context);

        expect(result.size.width).toBeLessThanOrEqual(600);
        expect(result.size.height).toBeLessThanOrEqual(400);
        expect(result.size.width).toBeGreaterThan(0);
        expect(result.size.height).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
        // Chart with no data
        const emptyChart = new BarChart({ series: [] });
        const context: LayoutContext = {
            constraints: BoxConstraints.loose({ width: 400, height: 300 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        expect(() => {
            const result = emptyChart.layout(context);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        }).not.toThrow();

        // Chart with single data point
        const singlePointChart = new LineChart({
            series: [{
                name: 'Single',
                color: PdfColor.fromHex('#000000'),
                data: [{ x: 0, y: 10 }],
            }],
        });

        expect(() => {
            singlePointChart.layout(context);
        }).not.toThrow();
    });
});