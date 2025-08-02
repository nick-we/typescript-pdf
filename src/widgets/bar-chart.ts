/**
 * Bar Chart widget implementation
 * 
 * Implements a bar chart visualization with:
 * - Vertical and horizontal bar orientations
 * - Grouped and stacked bar modes
 * - Customizable bar styling and spacing
 * - Data binding and responsive sizing
 * 
 * @packageDocumentation
 */

import { Chart, type ChartProps, type ChartDataSeries, type ChartDataPoint, ChartColors } from './chart.js';
import type { PaintContext } from '../types/layout.js';
import type { Point } from '../types/geometry.js';
import type { TextStyle } from '../types/theming.js';
import { PdfColor } from '@/core/pdf/color.js';

/**
 * Bar chart orientation
 */
export enum BarOrientation {
    Vertical = 'vertical',
    Horizontal = 'horizontal',
}

/**
 * Bar chart display mode
 */
export enum BarMode {
    Grouped = 'grouped',
    Stacked = 'stacked',
}

/**
 * Bar chart specific properties
 */
export interface BarChartProps extends ChartProps {
    /** Bar orientation */
    orientation?: BarOrientation;
    /** Bar display mode */
    mode?: BarMode;
    /** Bar width as fraction of available space (0-1) */
    barWidth?: number;
    /** Spacing between bar groups */
    groupSpacing?: number;
    /** Spacing between bars in a group */
    barSpacing?: number;
    /** Whether to show value labels on bars */
    showValues?: boolean;
    /** Value label style */
    valueLabelStyle?: TextStyle;
}

/**
 * Bar Chart widget implementation
 */
export class BarChart extends Chart {
    private readonly orientation: BarOrientation;
    private readonly mode: BarMode;
    private readonly barWidth: number;
    private readonly groupSpacing: number;
    private readonly barSpacing: number;
    private readonly showValues: boolean;
    private readonly valueLabelStyle?: TextStyle;

    constructor(props: BarChartProps) {
        super(props);

        this.orientation = props.orientation ?? BarOrientation.Vertical;
        this.mode = props.mode ?? BarMode.Grouped;
        this.barWidth = props.barWidth ?? 0.8;
        this.groupSpacing = props.groupSpacing ?? 0.2;
        this.barSpacing = props.barSpacing ?? 0.1;
        this.showValues = props.showValues ?? false;
        if (props.valueLabelStyle) this.valueLabelStyle = props.valueLabelStyle;

        // Validate bar width
        if (this.barWidth <= 0 || this.barWidth > 1) {
            throw new Error('Bar width must be between 0 and 1');
        }
    }

    /**
     * Get unique x-axis categories from all series
     */
    private getCategories(): (string | number)[] {
        const categorySet = new Set<string | number>();

        for (const series of this.series) {
            for (const point of series.data) {
                categorySet.add(point.x);
            }
        }

        return Array.from(categorySet).sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            return String(a).localeCompare(String(b));
        });
    }

    /**
     * Calculate bar dimensions and positions
     */
    private calculateBarLayout(): {
        categories: (string | number)[];
        barWidth: number;
        groupWidth: number;
        positions: Map<string, { series: ChartDataSeries; x: number; y: number; width: number; height: number; }[]>;
    } {
        if (!this.renderContext) {
            throw new Error('Chart not laid out');
        }

        const { plotArea, dataRanges } = this.renderContext;
        const categories = this.getCategories();

        if (categories.length === 0) {
            return {
                categories: [],
                barWidth: 0,
                groupWidth: 0,
                positions: new Map(),
            };
        }

        // Calculate dimensions based on orientation
        const categoryCount = categories.length;
        const seriesCount = this.series.length;

        let availableSpace: number;
        let groupWidth: number;
        let individualBarWidth: number;

        if (this.orientation === BarOrientation.Vertical) {
            availableSpace = plotArea.width;
            groupWidth = (availableSpace / categoryCount) * this.barWidth;

            if (this.mode === BarMode.Grouped) {
                individualBarWidth = (groupWidth - (seriesCount - 1) * this.barSpacing) / seriesCount;
            } else {
                individualBarWidth = groupWidth;
            }
        } else {
            availableSpace = plotArea.height;
            groupWidth = (availableSpace / categoryCount) * this.barWidth;

            if (this.mode === BarMode.Grouped) {
                individualBarWidth = (groupWidth - (seriesCount - 1) * this.barSpacing) / seriesCount;
            } else {
                individualBarWidth = groupWidth;
            }
        }

        // Calculate bar positions
        const positions = new Map<string, { series: ChartDataSeries; x: number; y: number; width: number; height: number; }[]>();

        for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
            const category = categories[categoryIndex]!;
            const categoryKey = String(category);
            const categoryBars: { series: ChartDataSeries; x: number; y: number; width: number; height: number; }[] = [];

            // Find center position for this category
            let categoryCenter: number;
            if (this.orientation === BarOrientation.Vertical) {
                categoryCenter = plotArea.x + (categoryIndex + 0.5) * (availableSpace / categoryCount);
            } else {
                categoryCenter = plotArea.y + (categoryIndex + 0.5) * (availableSpace / categoryCount);
            }

            if (this.mode === BarMode.Grouped) {
                // Grouped bars: place series side by side
                const groupStartOffset = -groupWidth / 2;

                for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
                    const series = this.series[seriesIndex]!;
                    const dataPoint = series.data.find(p => String(p.x) === categoryKey);

                    if (!dataPoint) continue;

                    const barOffset = groupStartOffset + seriesIndex * (individualBarWidth + this.barSpacing);

                    if (this.orientation === BarOrientation.Vertical) {
                        const barHeight = Math.abs((dataPoint.y - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin) * plotArea.height);
                        const barY = dataPoint.y >= 0
                            ? plotArea.y + (dataRanges.yMin / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height
                            : plotArea.y + (dataRanges.yMin / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height - barHeight;

                        categoryBars.push({
                            series,
                            x: categoryCenter + barOffset,
                            y: barY,
                            width: individualBarWidth,
                            height: barHeight,
                        });
                    } else {
                        const barWidth = Math.abs((dataPoint.y - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin) * plotArea.width);
                        const barX = dataPoint.y >= 0
                            ? plotArea.x
                            : plotArea.x - barWidth;

                        categoryBars.push({
                            series,
                            x: barX,
                            y: categoryCenter + barOffset,
                            width: barWidth,
                            height: individualBarWidth,
                        });
                    }
                }
            } else {
                // Stacked bars: stack series on top of each other
                let positiveStack = 0;
                let negativeStack = 0;

                for (const series of this.series) {
                    const dataPoint = series.data.find(p => String(p.x) === categoryKey);

                    if (!dataPoint) continue;

                    const value = dataPoint.y;

                    if (this.orientation === BarOrientation.Vertical) {
                        if (value >= 0) {
                            const barHeight = (value / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height;
                            const barY = plotArea.y + ((positiveStack - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height;

                            categoryBars.push({
                                series,
                                x: categoryCenter - individualBarWidth / 2,
                                y: barY,
                                width: individualBarWidth,
                                height: barHeight,
                            });

                            positiveStack += value;
                        } else {
                            const barHeight = Math.abs((value / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height);
                            const barY = plotArea.y + ((negativeStack - dataRanges.yMin) / (dataRanges.yMax - dataRanges.yMin)) * plotArea.height - barHeight;

                            categoryBars.push({
                                series,
                                x: categoryCenter - individualBarWidth / 2,
                                y: barY,
                                width: individualBarWidth,
                                height: barHeight,
                            });

                            negativeStack += value;
                        }
                    } else {
                        if (value >= 0) {
                            const barWidth = (value / (dataRanges.yMax - dataRanges.yMin)) * plotArea.width;
                            const barX = plotArea.x + (positiveStack / (dataRanges.yMax - dataRanges.yMin)) * plotArea.width;

                            categoryBars.push({
                                series,
                                x: barX,
                                y: categoryCenter - individualBarWidth / 2,
                                width: barWidth,
                                height: individualBarWidth,
                            });

                            positiveStack += value;
                        } else {
                            const barWidth = Math.abs((value / (dataRanges.yMax - dataRanges.yMin)) * plotArea.width);
                            const barX = plotArea.x + ((negativeStack - Math.abs(value)) / (dataRanges.yMax - dataRanges.yMin)) * plotArea.width;

                            categoryBars.push({
                                series,
                                x: barX,
                                y: categoryCenter - individualBarWidth / 2,
                                width: barWidth,
                                height: individualBarWidth,
                            });

                            negativeStack += value;
                        }
                    }
                }
            }

            positions.set(categoryKey, categoryBars);
        }

        return {
            categories,
            barWidth: individualBarWidth,
            groupWidth,
            positions,
        };
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
     * Paint chart data (bars)
     */
    protected paintData(context: PaintContext): void {
        if (!this.renderContext) return;

        const { graphics } = context;
        const barLayout = this.calculateBarLayout();

        // Paint bars for each category
        for (const [categoryKey, categoryBars] of barLayout.positions) {
            for (const barInfo of categoryBars) {
                const { series, x, y, width, height } = barInfo;

                // Set bar color
                graphics.setFillColor(series.color);

                // Draw bar
                graphics.drawRect(x, y, width, height);
                graphics.fillPath();

                // Draw bar border if specified
                if (series.strokeWidth && series.strokeWidth > 0) {
                    graphics.setStrokeColor(series.color);
                    graphics.setLineWidth(series.strokeWidth);
                    graphics.drawRect(x, y, width, height);
                    graphics.strokePath();
                }

                // TODO: Add value labels if showValues is true
            }
        }
    }
}

/**
 * Convenience function to create a BarChart widget
 */
export function createBarChart(props: BarChartProps): BarChart {
    return new BarChart(props);
}

/**
 * Bar chart helper functions
 */
export const BarChartHelpers = {
    /**
     * Create simple vertical bar chart from categorical data
     */
    createSimple(
        categories: string[],
        values: number[],
        options: {
            title?: string;
            color?: PdfColor;
            width?: number;
            height?: number;
        } = {}
    ): BarChart {
        if (categories.length !== values.length) {
            throw new Error('Categories and values must have the same length');
        }

        const series: ChartDataSeries = {
            name: 'Data',
            color: options.color ?? ChartColors.Primary,
            data: categories.map((category, i) => ({
                x: category,
                y: values[i]!,
            })),
        };

        const chartProps: BarChartProps = {
            series: [series],
            orientation: BarOrientation.Vertical,
            mode: BarMode.Grouped,
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;

        return new BarChart(chartProps);
    },

    /**
     * Create grouped bar chart from multiple data series
     */
    createGrouped(
        categories: string[],
        seriesData: { name: string; values: number[]; color?: PdfColor }[],
        options: {
            title?: string;
            orientation?: BarOrientation;
            width?: number;
            height?: number;
        } = {}
    ): BarChart {
        const series: ChartDataSeries[] = seriesData.map((seriesInfo, index) => {
            if (seriesInfo.values.length !== categories.length) {
                throw new Error(`Series "${seriesInfo.name}" values length must match categories length`);
            }

            return {
                name: seriesInfo.name,
                color: seriesInfo.color ?? ChartColors.getColor(index),
                data: categories.map((category, i) => ({
                    x: category,
                    y: seriesInfo.values[i]!,
                })),
            };
        });

        const chartProps: BarChartProps = {
            series,
            orientation: options.orientation ?? BarOrientation.Vertical,
            mode: BarMode.Grouped,
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;

        return new BarChart(chartProps);
    },

    /**
     * Create stacked bar chart
     */
    createStacked(
        categories: string[],
        seriesData: { name: string; values: number[]; color?: PdfColor }[],
        options: {
            title?: string;
            orientation?: BarOrientation;
            width?: number;
            height?: number;
        } = {}
    ): BarChart {
        const series: ChartDataSeries[] = seriesData.map((seriesInfo, index) => {
            if (seriesInfo.values.length !== categories.length) {
                throw new Error(`Series "${seriesInfo.name}" values length must match categories length`);
            }

            return {
                name: seriesInfo.name,
                color: seriesInfo.color ?? ChartColors.getColor(index),
                data: categories.map((category, i) => ({
                    x: category,
                    y: seriesInfo.values[i]!,
                })),
            };
        });

        const chartProps: BarChartProps = {
            series,
            orientation: options.orientation ?? BarOrientation.Vertical,
            mode: BarMode.Stacked,
        };

        if (options.title) chartProps.title = options.title;
        if (options.width) chartProps.width = options.width;
        if (options.height) chartProps.height = options.height;

        return new BarChart(chartProps);
    },
};