/**
 * Chart widget implementation
 * 
 * Implements a base chart system with:
 * - Data binding and visualization
 * - Configurable axes and legends
 * - Multiple chart types (Bar, Line)
 * - Responsive sizing and theming
 * - Integration with the constraint-based layout system
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import { Container } from './container.js';
import { Text } from './text.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
    EdgeInsets,
} from '../types/layout.js';
import { BoxConstraints, EdgeInsets as EdgeInsetsUtils, TextDirection } from '../types/layout.js';
import type { Size, Point, Rect } from '../types/geometry.js';
import { Matrix4 } from '../core/pdf/graphics.js';
import { FontWeight, TextStyleUtils, PaintPhase, type TextStyle } from '@/types/theming.js';
import { PdfStandardFont } from '@/core/pdf/font.js';
import { PdfColor } from '@/core/pdf/color.js';

/**
 * Chart data point representing a single value
 */
export interface ChartDataPoint {
    /** X-axis value (for scatter/line charts) or category index */
    x: number | string;
    /** Y-axis value */
    y: number;
    /** Optional label for this data point */
    label?: string;
    /** Optional color override for this point */
    color?: PdfColor;
}

/**
 * Chart data series containing multiple data points
 */
export interface ChartDataSeries {
    /** Series name for legend */
    name: string;
    /** Data points in this series */
    data: ChartDataPoint[];
    /** Series color */
    color: PdfColor;
    /** Series line/bar width */
    strokeWidth?: number;
    /** Whether this series is visible */
    visible?: boolean;
}

/**
 * Chart axis configuration
 */
export interface ChartAxis {
    /** Axis title */
    title?: string;
    /** Axis title style */
    titleStyle?: TextStyle; // TextStyle
    /** Whether to show axis line */
    showAxisLine?: boolean;
    /** Whether to show tick marks */
    showTicks?: boolean;
    /** Whether to show grid lines */
    showGrid?: boolean;
    /** Grid line color */
    gridColor?: PdfColor;
    /** Grid line width */
    gridWidth?: number;
    /** Minimum value (for numeric axes) */
    min?: number;
    /** Maximum value (for numeric axes) */
    max?: number;
    /** Tick interval */
    interval?: number;
    /** Custom tick labels */
    labels?: string[];
}

/**
 * Chart legend configuration
 */
export interface ChartLegend {
    /** Whether to show legend */
    show: boolean;
    /** Legend position */
    position: 'top' | 'bottom' | 'left' | 'right';
    /** Legend alignment */
    alignment: 'start' | 'center' | 'end';
    /** Legend text style */
    textStyle?: TextStyle; // TextStyle
    /** Legend item spacing */
    itemSpacing?: number;
    /** Legend padding */
    padding?: EdgeInsets;
}

/**
 * Chart styling configuration
 */
export interface ChartStyle {
    /** Chart background color */
    backgroundColor?: PdfColor;
    /** Chart border color */
    borderColor?: PdfColor;
    /** Chart border width */
    borderWidth?: number;
    /** Plot area background color */
    plotBackgroundColor?: PdfColor;
    /** Default series colors */
    colors?: PdfColor[];
    /** Chart padding */
    padding?: EdgeInsets;
    /** Plot area margin */
    plotMargin?: EdgeInsets;
}

/**
 * Base chart widget properties
 */
export interface ChartProps extends WidgetProps {
    /** Chart data series */
    series: ChartDataSeries[];
    /** Chart title */
    title?: string;
    /** Chart title style */
    titleStyle?: any; // TextStyle
    /** X-axis configuration */
    xAxis?: ChartAxis;
    /** Y-axis configuration */
    yAxis?: ChartAxis;
    /** Legend configuration */
    legend?: ChartLegend;
    /** Chart styling */
    style?: ChartStyle;
    /** Chart width */
    width?: number;
    /** Chart height */
    height?: number;
}

/**
 * Chart rendering context with calculated dimensions
 */
export interface ChartRenderContext {
    /** Total chart size */
    chartSize: Size;
    /** Plot area bounds */
    plotArea: Rect;
    /** Title area bounds (if any) */
    titleArea: Rect | undefined;
    /** Legend area bounds (if any) */
    legendArea: Rect | undefined;
    /** X-axis area bounds */
    xAxisArea: Rect | undefined;
    /** Y-axis area bounds */
    yAxisArea: Rect | undefined;
    /** Data value ranges */
    dataRanges: {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
    };
}

/**
 * Abstract base Chart widget
 */
export abstract class Chart extends BaseWidget {
    protected readonly series: ChartDataSeries[];
    protected readonly title?: string;
    protected readonly titleStyle?: any; // TextStyle
    protected readonly xAxis: ChartAxis;
    protected readonly yAxis: ChartAxis;
    protected readonly legend: ChartLegend;
    protected readonly chartStyle: ChartStyle;
    protected readonly explicitWidth?: number;
    protected readonly explicitHeight?: number;

    // Calculated layout information
    protected renderContext?: ChartRenderContext;

    constructor(props: ChartProps) {
        super(props);

        this.series = props.series.filter(s => s.visible !== false);
        if (props.title) this.title = props.title;
        if (props.titleStyle) this.titleStyle = props.titleStyle;

        // Default axis configurations
        this.xAxis = {
            showAxisLine: true,
            showTicks: true,
            showGrid: true,
            gridColor: PdfColor.fromHex('#e0e0e0'),
            gridWidth: 1,
            ...props.xAxis,
        };

        this.yAxis = {
            showAxisLine: true,
            showTicks: true,
            showGrid: true,
            gridColor: PdfColor.fromHex('#e0e0e0'),
            gridWidth: 1,
            ...props.yAxis,
        };

        // Default legend configuration
        this.legend = {
            show: true,
            position: 'bottom',
            alignment: 'center',
            itemSpacing: 16,
            padding: EdgeInsetsUtils.all(8),
            ...props.legend,
        };

        // Default chart styling
        this.chartStyle = {
            backgroundColor: PdfColor.white,
            colors: [
                PdfColor.fromHex('#3366cc'), PdfColor.fromHex('#dc3912'), PdfColor.fromHex('#ff9900'), PdfColor.fromHex('#109618'), PdfColor.fromHex('#990099'),
                PdfColor.fromHex('#0099c6'), PdfColor.fromHex('#dd4477'), PdfColor.fromHex('#66aa00'), PdfColor.fromHex('#b82e2e'), PdfColor.fromHex('#316395')
            ],
            padding: EdgeInsetsUtils.all(16),
            plotMargin: EdgeInsetsUtils.symmetric({ horizontal: 40, vertical: 32 }),
            ...props.style,
        };

        if (props.width) this.explicitWidth = props.width;
        if (props.height) this.explicitHeight = props.height;
    }

    /**
     * Calculate data value ranges from all series
     */
    protected calculateDataRanges(): { xMin: number; xMax: number; yMin: number; yMax: number } {
        if (this.series.length === 0) {
            return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
        }

        let xMin = Number.POSITIVE_INFINITY;
        let xMax = Number.NEGATIVE_INFINITY;
        let yMin = Number.POSITIVE_INFINITY;
        let yMax = Number.NEGATIVE_INFINITY;

        for (const series of this.series) {
            for (const point of series.data) {
                const xValue = typeof point.x === 'string' ? 0 : point.x;
                xMin = Math.min(xMin, xValue);
                xMax = Math.max(xMax, xValue);
                yMin = Math.min(yMin, point.y);
                yMax = Math.max(yMax, point.y);
            }
        }

        // Apply axis min/max overrides
        if (this.xAxis.min !== undefined) xMin = this.xAxis.min;
        if (this.xAxis.max !== undefined) xMax = this.xAxis.max;
        if (this.yAxis.min !== undefined) yMin = this.yAxis.min;
        if (this.yAxis.max !== undefined) yMax = this.yAxis.max;

        // Ensure non-zero ranges
        if (xMin === xMax) {
            xMin -= 0.5;
            xMax += 0.5;
        }
        if (yMin === yMax) {
            yMin -= 0.5;
            yMax += 0.5;
        }

        return { xMin, xMax, yMin, yMax };
    }

    /**
     * Calculate chart layout areas
     */
    protected calculateRenderContext(availableSize: Size): ChartRenderContext {
        const padding = this.chartStyle.padding ?? EdgeInsetsUtils.zero;
        const plotMargin = this.chartStyle.plotMargin ?? EdgeInsetsUtils.zero;

        // Start with available size minus chart padding
        let workingWidth = availableSize.width - EdgeInsetsUtils.horizontal(padding);
        let workingHeight = availableSize.height - EdgeInsetsUtils.vertical(padding);

        let titleArea: Rect | undefined;
        let legendArea: Rect | undefined;
        let xAxisArea: Rect | undefined;
        let yAxisArea: Rect | undefined;

        // Reserve space for title
        if (this.title) {
            const titleHeight = 32; // Estimated title height
            titleArea = {
                x: padding.left,
                y: availableSize.height - padding.top - titleHeight,
                width: workingWidth,
                height: titleHeight,
            };
            workingHeight -= titleHeight;
        }

        // Reserve space for legend
        if (this.legend.show) {
            const legendHeight = 40; // Estimated legend height
            const legendPadding = this.legend.padding ?? EdgeInsetsUtils.zero;

            if (this.legend.position === 'top') {
                legendArea = {
                    x: padding.left,
                    y: availableSize.height - padding.top - (titleArea ? titleArea.height : 0) - legendHeight,
                    width: workingWidth,
                    height: legendHeight,
                };
                workingHeight -= legendHeight;
            } else if (this.legend.position === 'bottom') {
                legendArea = {
                    x: padding.left,
                    y: padding.bottom,
                    width: workingWidth,
                    height: legendHeight,
                };
                workingHeight -= legendHeight;
            }
        }

        // Reserve space for axes
        if (this.xAxis.title || this.xAxis.showTicks) {
            const xAxisHeight = 30;
            xAxisArea = {
                x: padding.left,
                y: padding.bottom + (legendArea && this.legend.position === 'bottom' ? legendArea.height : 0),
                width: workingWidth,
                height: xAxisHeight,
            };
            workingHeight -= xAxisHeight;
        }

        if (this.yAxis.title || this.yAxis.showTicks) {
            const yAxisWidth = 40;
            yAxisArea = {
                x: padding.left,
                y: padding.bottom,
                width: yAxisWidth,
                height: workingHeight,
            };
            workingWidth -= yAxisWidth;
        }

        // Calculate plot area
        const plotArea: Rect = {
            x: padding.left + (yAxisArea ? yAxisArea.width : 0) + plotMargin.left,
            y: padding.bottom + (xAxisArea ? xAxisArea.height : 0) + (legendArea && this.legend.position === 'bottom' ? legendArea.height : 0) + plotMargin.bottom,
            width: workingWidth - EdgeInsetsUtils.horizontal(plotMargin),
            height: workingHeight - EdgeInsetsUtils.vertical(plotMargin),
        };

        return {
            chartSize: availableSize,
            plotArea,
            titleArea,
            legendArea,
            xAxisArea,
            yAxisArea,
            dataRanges: this.calculateDataRanges(),
        };
    }

    /**
     * Convert data coordinates to plot area pixel coordinates
     */
    protected dataToPlot(dataX: number, dataY: number): Point {
        if (!this.renderContext) {
            throw new Error('Chart not laid out - renderContext is missing');
        }

        const { plotArea, dataRanges } = this.renderContext;

        const x = plotArea.x + (dataX - dataRanges.xMin) / (dataRanges.xMax - dataRanges.xMin) * plotArea.width;
        const y = plotArea.y + (dataY - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin) * plotArea.height;

        return { x, y };
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Determine chart size
        let chartSize: Size;
        if (this.explicitWidth && this.explicitHeight) {
            chartSize = {
                width: this.explicitWidth,
                height: this.explicitHeight,
            };
        } else if (this.explicitWidth) {
            chartSize = {
                width: this.explicitWidth,
                height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                    ? this.explicitWidth * 0.6 // Default aspect ratio 
                    : context.constraints.maxHeight,
            };
        } else if (this.explicitHeight) {
            chartSize = {
                width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                    ? this.explicitHeight * 1.6 // Default aspect ratio
                    : context.constraints.maxWidth,
                height: this.explicitHeight,
            };
        } else {
            // Use available space with sensible defaults
            chartSize = {
                width: context.constraints.maxWidth === Number.POSITIVE_INFINITY
                    ? 400 // Default width
                    : context.constraints.maxWidth,
                height: context.constraints.maxHeight === Number.POSITIVE_INFINITY
                    ? 240 // Default height
                    : context.constraints.maxHeight,
            };
        }

        // Constrain to parent constraints
        chartSize = this.constrainSize(context.constraints, chartSize);

        // Calculate render context for painting
        this.renderContext = this.calculateRenderContext(chartSize);

        return this.createLayoutResult(chartSize, {
            needsRepaint: true,
        });
    }

    paint(context: PaintContext): void {
        if (!this.renderContext) {
            return; // Not laid out yet
        }

        const { graphics } = context;

        graphics.saveContext();

        // Paint in phases following dart-pdf pattern
        this.paintBackground(context);
        this.paintContent(context);
        this.paintForeground(context);

        graphics.restoreContext();
    }

    /**
     * Paint background phase: chart background, plot area background
     */
    protected paintBackground(context: PaintContext): void {
        const { graphics } = context;
        const { chartSize, plotArea } = this.renderContext!;

        // Paint chart background
        if (this.chartStyle.backgroundColor) {
            graphics.setFillColor(this.chartStyle.backgroundColor);
            graphics.drawRect(0, 0, chartSize.width, chartSize.height);
            graphics.fillPath();
        }

        // Paint plot area background
        if (this.chartStyle.plotBackgroundColor) {
            graphics.setFillColor(this.chartStyle.plotBackgroundColor);
            graphics.drawRect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
            graphics.fillPath();
        }
    }

    /**
     * Paint content phase: axes, grid, data, legend, title
     */
    protected paintContent(context: PaintContext): void {
        this.paintGrid(context);
        this.paintAxes(context);
        this.paintData(context);
        this.paintTitle(context);
        this.paintLegend(context);
    }

    /**
     * Paint foreground phase: borders, decorations
     */
    protected paintForeground(context: PaintContext): void {
        const { graphics } = context;
        const { chartSize } = this.renderContext!;

        // Paint chart border
        if (this.chartStyle.borderColor && this.chartStyle.borderWidth) {
            graphics.setStrokeColor(this.chartStyle.borderColor);
            graphics.setLineWidth(this.chartStyle.borderWidth);
            graphics.drawRect(0, 0, chartSize.width, chartSize.height);
            graphics.strokePath();
        }
    }

    /**
     * Paint grid lines
     */
    protected paintGrid(context: PaintContext): void {
        const { graphics } = context;
        const { plotArea, dataRanges } = this.renderContext!;

        // Y-axis grid lines
        if (this.yAxis.showGrid) {
            const gridColor = this.yAxis.gridColor ?? PdfColor.fromHex('#e0e0e0');
            graphics.setStrokeColor(gridColor);
            graphics.setLineWidth(this.yAxis.gridWidth ?? 1);

            const yInterval = this.yAxis.interval ?? (dataRanges.yMax - dataRanges.yMin) / 5;
            for (let y = dataRanges.yMin; y <= dataRanges.yMax; y += yInterval) {
                const plotY = plotArea.y + (y - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin) * plotArea.height;
                graphics.drawLine(plotArea.x, plotY, plotArea.x + plotArea.width, plotY);
            }
            graphics.strokePath();
        }

        // X-axis grid lines
        if (this.xAxis.showGrid) {
            const gridColor = this.xAxis.gridColor ?? PdfColor.fromHex('#e0e0e0');
            graphics.setStrokeColor(gridColor);
            graphics.setLineWidth(this.xAxis.gridWidth ?? 1);

            const xInterval = this.xAxis.interval ?? (dataRanges.xMax - dataRanges.xMin) / 5;
            for (let x = dataRanges.xMin; x <= dataRanges.xMax; x += xInterval) {
                const plotX = plotArea.x + (x - dataRanges.xMin) / (dataRanges.xMax - dataRanges.xMin) * plotArea.width;
                graphics.drawLine(plotX, plotArea.y, plotX, plotArea.y + plotArea.height);
            }
            graphics.strokePath();
        }
    }

    /**
     * Paint axes - implemented by subclasses
     */
    protected abstract paintAxes(context: PaintContext): void;

    /**
     * Paint chart data - implemented by subclasses
     */
    protected abstract paintData(context: PaintContext): void;

    /**
     * Paint chart title
     */
    protected paintTitle(context: PaintContext): void {
        const titleArea = this.renderContext?.titleArea;
        if (!this.title || !titleArea) {
            return;
        }

        const { graphics, theme } = context;

        graphics.saveContext();

        // Create title text widget
        const titleWidget = new Text(this.title, {
            style: this.titleStyle ?? TextStyleUtils.createDefault({
                fontSize: 16,
                fontWeight: FontWeight.Bold,
                fontFamily: PdfStandardFont.Helvetica,
                color: PdfColor.black,
            }),
        });

        // Layout and paint title
        const titleContext: LayoutContext = {
            constraints: BoxConstraints.tight({ width: titleArea.width, height: titleArea.height }),
            textDirection: TextDirection.LeftToRight, // Default text direction
            theme,
        };

        titleWidget.layout(titleContext);

        // Transform to title position
        const titleTransform = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            titleArea.x, titleArea.y, 0, 1
        ]);
        graphics.setTransform(titleTransform);

        const titlePaintContext: PaintContext = {
            ...context,
            size: { width: titleArea.width, height: titleArea.height },
        };

        titleWidget.paint(titlePaintContext);

        graphics.restoreContext();
    }

    /**
     * Paint chart legend
     */
    protected paintLegend(context: PaintContext): void {
        if (!this.legend.show || !this.renderContext!.legendArea) {
            return;
        }

        const { legendArea } = this.renderContext!;
        const { graphics } = context;

        graphics.saveContext();

        // Transform to legend position
        const legendTransform = new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            legendArea?.x ?? 0, legendArea?.y ?? 0, 0, 1
        ]);
        graphics.setTransform(legendTransform);

        // Paint legend items
        const itemSpacing = this.legend.itemSpacing ?? 16;
        let currentX = 0;

        for (let i = 0; i < this.series.length; i++) {
            const series = this.series[i]!;

            // Paint legend marker (small rectangle)
            graphics.setFillColor(series.color);
            graphics.drawRect(currentX, (legendArea?.height ?? 0) / 2 - 4, 12, 8);
            graphics.fillPath();

            // Paint legend text
            const textWidget = new Text(series.name, {
                style: this.legend.textStyle ?? TextStyleUtils.createDefault({
                    fontSize: 10,
                    fontFamily: PdfStandardFont.Helvetica,
                    color: PdfColor.black,
                }),
            });

            graphics.saveContext();
            const textTransform = new Matrix4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                currentX + 16, 0, 0, 1
            ]);
            graphics.setTransform(textTransform);

            const textPaintContext: PaintContext = {
                ...context,
                size: { width: 100, height: legendArea?.height ?? 0 },
            };

            textWidget.paint(textPaintContext);
            graphics.restoreContext();

            currentX += 100 + itemSpacing; // Estimated text width + spacing
        }

        graphics.restoreContext();
    }
}

/**
 * Default chart colors palette
 */
export const ChartColors = {
    Primary: PdfColor.fromHex('#3366cc'),
    Secondary: PdfColor.fromHex('#dc3912'),
    Success: PdfColor.fromHex('#109618'),
    Warning: PdfColor.fromHex('#ff9900'),
    Danger: PdfColor.fromHex('#990099'),
    Info: PdfColor.fromHex('#0099c6'),
    Light: PdfColor.fromHex('#f8f9fa'),
    Dark: PdfColor.fromHex('#343a40'),

    /**
     * Get color by index with automatic cycling
     */
    getColor(index: number): PdfColor {
        const colors = [
            PdfColor.fromHex('#3366cc'), PdfColor.fromHex('#dc3912'), PdfColor.fromHex('#ff9900'),
            PdfColor.fromHex('#109618'), PdfColor.fromHex('#990099'), PdfColor.fromHex('#0099c6'),
            PdfColor.fromHex('#dd4477'), PdfColor.fromHex('#66aa00'), PdfColor.fromHex('#b82e2e'),
            PdfColor.fromHex('#316395')
        ];
        return colors[index % colors.length]!;
    },
};

/**
 * Chart helper functions
 */
export const ChartHelpers = {
    /**
     * Create simple data series from arrays
     */
    createSeries(name: string, xData: number[], yData: number[], color?: PdfColor): ChartDataSeries {
        if (xData.length !== yData.length) {
            throw new Error('X and Y data arrays must have the same length');
        }

        return {
            name,
            color: color ?? ChartColors.getColor(0),
            data: xData.map((x, i) => ({ x, y: yData[i]! })),
        };
    },

    /**
     * Create categorical data series
     */
    createCategoricalSeries(name: string, categories: string[], values: number[], color?: PdfColor): ChartDataSeries {
        if (categories.length !== values.length) {
            throw new Error('Categories and values arrays must have the same length');
        }

        return {
            name,
            color: color ?? ChartColors.getColor(0),
            data: categories.map((category, i) => ({ x: category, y: values[i]! })),
        };
    },
};