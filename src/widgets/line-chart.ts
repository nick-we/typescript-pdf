/**
 * Line Chart widget implementation
 * 
 * Implements a line chart visualization with:
 * - Connected data points with lines
 * - Multiple line series support
 * - Customizable line styling and markers
 * - Area fill support
 * - Data binding and responsive sizing
 * 
 * @packageDocumentation
 */

import { Chart, type ChartProps, type ChartDataSeries, type ChartDataPoint, ChartColors } from './chart.js';
import type { PaintContext } from '../types/layout.js';
import { PdfColor } from '../core/pdf/color.js';
import type { Point } from '../types/geometry.js';
import type { TextStyle } from '../types/theming.js';
import type { PdfGraphics } from '@/core/index.js';

/**
 * Line marker styles
 */
export enum LineMarker {
    None = 'none',
    Circle = 'circle',
    Square = 'square',
    Triangle = 'triangle',
    Diamond = 'diamond',
}

/**
 * Line chart specific properties
 */
export interface LineChartProps extends ChartProps {
    /** Whether to show data point markers */
    showMarkers?: boolean;
    /** Default marker style */
    markerStyle?: LineMarker;
    /** Default marker size */
    markerSize?: number;
    /** Whether to fill area under lines */
    fillArea?: boolean;
    /** Area fill opacity (0-1) */
    areaOpacity?: number;
    /** Whether to smooth lines with curves */
    smoothLines?: boolean;
    /** Line width */
    lineWidth?: number;
    /** Whether to show value labels at data points */
    showValues?: boolean;
    /** Value label style */
    valueLabelStyle?: TextStyle;
}

/**
 * Line Chart widget implementation
 */
export class LineChart extends Chart {
    private readonly showMarkers: boolean;
    private readonly markerStyle: LineMarker;
    private readonly markerSize: number;
    private readonly fillArea: boolean;
    private readonly areaOpacity: number;
    private readonly smoothLines: boolean;
    private readonly lineWidth: number;
    private readonly showValues: boolean;
    private readonly valueLabelStyle?: TextStyle;

    constructor(props: LineChartProps) {
        super(props);

        this.showMarkers = props.showMarkers ?? true;
        this.markerStyle = props.markerStyle ?? LineMarker.Circle;
        this.markerSize = props.markerSize ?? 4;
        this.fillArea = props.fillArea ?? false;
        this.areaOpacity = props.areaOpacity ?? 0.3;
        this.smoothLines = props.smoothLines ?? false;
        this.lineWidth = props.lineWidth ?? 2;
        this.showValues = props.showValues ?? false;
        if (props.valueLabelStyle) this.valueLabelStyle = props.valueLabelStyle;

        // Validate opacity
        if (this.areaOpacity < 0 || this.areaOpacity > 1) {
            throw new Error('Area opacity must be between 0 and 1');
        }
    }

    /**
     * Convert data points to plot coordinates
     */
    private getPlotPoints(series: ChartDataSeries): Point[] {
        if (!this.renderContext) {
            throw new Error('Chart not laid out');
        }

        const points: Point[] = [];

        // Sort data points by x value for proper line drawing
        const sortedData = [...series.data].sort((a, b) => {
            const aValue = typeof a.x === 'number' ? a.x : 0;
            const bValue = typeof b.x === 'number' ? b.x : 0;
            return aValue - bValue;
        });

        for (const dataPoint of sortedData) {
            const xValue = typeof dataPoint.x === 'number' ? dataPoint.x : 0;
            const plotPoint = this.dataToPlot(xValue, dataPoint.y);
            points.push(plotPoint);
        }

        return points;
    }

    /**
     * Paint axes (implementation required by Chart base class)
     */
    protected paintAxes(context: PaintContext): void {
        if (!this.renderContext) return;

        const { graphics } = context;
        const { plotArea } = this.renderContext;

        // Paint X axis
        if (this.xAxis.showAxisLine) {
            const axisColor = PdfColor.black;
            graphics.setStrokeColor(axisColor);
            graphics.setLineWidth(1);
            graphics.drawLine(plotArea.x, plotArea.y, plotArea.x + plotArea.width, plotArea.y);
            graphics.strokePath();
        }

        // Paint Y axis
        if (this.yAxis.showAxisLine) {
            const axisColor = PdfColor.black;
            graphics.setStrokeColor(axisColor);
            graphics.setLineWidth(1);
            graphics.drawLine(plotArea.x, plotArea.y, plotArea.x, plotArea.y + plotArea.height);
            graphics.strokePath();
        }

        // TODO: Add axis labels and tick marks
    }

    /**
     * Paint chart data (lines and markers)
     */
    protected paintData(context: PaintContext): void {
        if (!this.renderContext) return;

        const { graphics } = context;

        // Paint each series
        for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
            const series = this.series[seriesIndex]!;
            const points = this.getPlotPoints(series);

            if (points.length === 0) continue;

            const seriesColor = series.color;

            // Paint area fill if enabled
            if (this.fillArea) {
                this.paintAreaFill(graphics, points, seriesColor);
            }

            // Paint line connecting points
            this.paintLine(graphics, points, seriesColor, series.strokeWidth ?? this.lineWidth);

            // Paint markers if enabled
            if (this.showMarkers) {
                this.paintMarkers(graphics, points, seriesColor);
            }

            // TODO: Paint value labels if showValues is true
        }
    }

    /**
     * Paint area fill under the line
     */
    private paintAreaFill(graphics: PdfGraphics, points: Point[], color: PdfColor): void {
        if (!this.renderContext || points.length < 2) return;

        const { plotArea } = this.renderContext;

        // Create area path
        graphics.saveContext();

        // Set fill color with opacity (simplified - real implementation would use transparency)
        const fillColor = new PdfColor(
            color.red + (1 - color.red) * (1 - this.areaOpacity),
            color.green + (1 - color.green) * (1 - this.areaOpacity),
            color.blue + (1 - color.blue) * (1 - this.areaOpacity),
            color.alpha
        );
        graphics.setFillColor(fillColor);

        // Start at bottom-left of first point
        graphics.moveTo(points[0]!.x, plotArea.y);

        // Line to first point
        graphics.lineTo(points[0]!.x, points[0]!.y);

        // Draw line through all points
        for (let i = 1; i < points.length; i++) {
            const point = points[i]!;
            if (this.smoothLines && i > 0 && i < points.length - 1) {
                // Simplified curve - real implementation would use proper Bezier curves
                const prevPoint = points[i - 1]!;
                const nextPoint = points[i + 1]!;
                const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.5;
                const cp1y = prevPoint.y;
                const cp2x = point.x - (nextPoint.x - point.x) * 0.5;
                const cp2y = point.y;
                graphics.curveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
            } else {
                graphics.lineTo(point.x, point.y);
            }
        }

        // Close area to baseline
        const lastPoint = points[points.length - 1]!;
        graphics.lineTo(lastPoint.x, plotArea.y);
        graphics.closePath();

        graphics.fillPath();
        graphics.restoreContext();
    }

    /**
     * Paint line connecting data points
     */
    private paintLine(graphics: PdfGraphics, points: Point[], color: PdfColor, lineWidth: number): void {
        if (points.length < 2) return;

        graphics.saveContext();
        graphics.setStrokeColor(color);
        graphics.setLineWidth(lineWidth);

        // Start path at first point
        graphics.moveTo(points[0]!.x, points[0]!.y);

        // Draw line through all points
        for (let i = 1; i < points.length; i++) {
            const point = points[i]!;
            if (this.smoothLines && i > 0 && i < points.length - 1) {
                // Simplified curve - real implementation would use proper Bezier curves
                const prevPoint = points[i - 1]!;
                const nextPoint = points[i + 1]!;
                const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.5;
                const cp1y = prevPoint.y;
                const cp2x = point.x - (nextPoint.x - point.x) * 0.5;
                const cp2y = point.y;
                graphics.curveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
            } else {
                graphics.lineTo(point.x, point.y);
            }
        }

        graphics.strokePath();
        graphics.restoreContext();
    }

    /**
     * Paint markers at data points
     */
    private paintMarkers(graphics: PdfGraphics, points: Point[], color: PdfColor): void {
        graphics.saveContext();
        graphics.setFillColor(color);
        graphics.setStrokeColor(color);

        for (const point of points) {
            switch (this.markerStyle) {
                case LineMarker.Circle:
                    // Draw circle (simplified as square for now)
                    graphics.drawRect(
                        point.x - this.markerSize / 2,
                        point.y - this.markerSize / 2,
                        this.markerSize,
                        this.markerSize
                    );
                    graphics.fillPath();
                    break;

                case LineMarker.Square:
                    graphics.drawRect(
                        point.x - this.markerSize / 2,
                        point.y - this.markerSize / 2,
                        this.markerSize,
                        this.markerSize
                    );
                    graphics.fillPath();
                    break;

                case LineMarker.Triangle:
                    // Simplified triangle as square
                    graphics.drawRect(
                        point.x - this.markerSize / 2,
                        point.y - this.markerSize / 2,
                        this.markerSize,
                        this.markerSize
                    );
                    graphics.fillPath();
                    break;

                case LineMarker.Diamond:
                    // Simplified diamond as square
                    graphics.drawRect(
                        point.x - this.markerSize / 2,
                        point.y - this.markerSize / 2,
                        this.markerSize,
                        this.markerSize
                    );
                    graphics.fillPath();
                    break;

                case LineMarker.None:
                default:
                    // No marker
                    break;
            }
        }

        graphics.restoreContext();
    }
}

/**
 * Convenience function to create a LineChart widget
 */
export function createLineChart(props: LineChartProps): LineChart {
    return new LineChart(props);
}

/**
 * Line chart helper functions
 */
export const LineChartHelpers = {
    /**
     * Create simple line chart from numeric data
     */
    createSimple(
        xData: number[],
        yData: number[],
        options: {
            title?: string;
            color?: PdfColor;
            width?: number;
            height?: number;
            showMarkers?: boolean;
            fillArea?: boolean;
        } = {}
    ): LineChart {
        if (xData.length !== yData.length) {
            throw new Error('X and Y data arrays must have the same length');
        }

        const series: ChartDataSeries = {
            name: 'Data',
            color: options.color ?? ChartColors.Primary,
            data: xData.map((x, i) => ({
                x,
                y: yData[i]!,
            })),
        };

        const chartProps: LineChartProps = {
            series: [series],
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;
        if (options.showMarkers !== undefined) chartProps.showMarkers = options.showMarkers;
        if (options.fillArea !== undefined) chartProps.fillArea = options.fillArea;

        return new LineChart(chartProps);
    },

    /**
     * Create multi-series line chart
     */
    createMultiSeries(
        seriesData: { name: string; xData: number[]; yData: number[]; color?: PdfColor }[],
        options: {
            title?: string;
            width?: number;
            height?: number;
            showMarkers?: boolean;
            smoothLines?: boolean;
        } = {}
    ): LineChart {
        const series: ChartDataSeries[] = seriesData.map((seriesInfo, index) => {
            if (seriesInfo.xData.length !== seriesInfo.yData.length) {
                throw new Error(`Series "${seriesInfo.name}" X and Y data arrays must have the same length`);
            }

            return {
                name: seriesInfo.name,
                color: seriesInfo.color ?? ChartColors.getColor(index),
                data: seriesInfo.xData.map((x, i) => ({
                    x,
                    y: seriesInfo.yData[i]!,
                })),
            };
        });

        const chartProps: LineChartProps = {
            series,
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;
        if (options.showMarkers !== undefined) chartProps.showMarkers = options.showMarkers;
        if (options.smoothLines !== undefined) chartProps.smoothLines = options.smoothLines;

        return new LineChart(chartProps);
    },

    /**
     * Create time series line chart
     */
    createTimeSeries(
        timestamps: number[],
        values: number[],
        options: {
            title?: string;
            color?: PdfColor;
            width?: number;
            height?: number;
            fillArea?: boolean;
            smoothLines?: boolean;
        } = {}
    ): LineChart {
        if (timestamps.length !== values.length) {
            throw new Error('Timestamps and values arrays must have the same length');
        }

        const series: ChartDataSeries = {
            name: 'Time Series',
            color: options.color ?? ChartColors.Primary,
            data: timestamps.map((timestamp, i) => ({
                x: timestamp,
                y: values[i]!,
            })),
        };

        const chartProps: LineChartProps = {
            series: [series],
            showMarkers: false, // Typically no markers for time series
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;
        if (options.fillArea !== undefined) chartProps.fillArea = options.fillArea;
        if (options.smoothLines !== undefined) chartProps.smoothLines = options.smoothLines;

        return new LineChart(chartProps);
    },
};