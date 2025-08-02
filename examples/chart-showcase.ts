/**
 * Chart showcase examples
 * 
 * Demonstrates the Chart, BarChart, and LineChart widgets with:
 * - Various chart types and configurations
 * - Data binding and styling options  
 * - Responsive layouts and theming
 * - Integration with the document system
 * 
 * @packageDocumentation
 */

import { Document } from '../src/core/document.js';
import {
    BarChart,
    LineChart,
    BarChartHelpers,
    LineChartHelpers,
    BarOrientation,
    BarMode,
    LineMarker,
    ChartColors,
    Container,
    Column,
    Row,
    Text,
    Padding,
    type ChartDataSeries,
} from '../src/widgets/index.js';
import { EdgeInsets } from '../src/types/layout.js';
import { TextStyleUtils, FontWeight } from '../src/types/theming.js';
import { PdfStandardFont } from '../src/core/pdf/font.js';

/**
 * Example 1: Simple Bar Chart
 */
export function createSimpleBarChart(): Document {
    // Sample sales data
    const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
    const sales = [120000, 135000, 98000, 142000];

    const barChart = BarChartHelpers.createSimple(categories, sales, {
        title: 'Quarterly Sales Performance',
        color: ChartColors.Primary,
        width: 400,
        height: 250,
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Chart Showcase - Simple Bar Chart', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 20,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#333333',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: barChart,
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This example shows a simple vertical bar chart with quarterly sales data. The chart automatically scales to fit the data range and includes a title and legend.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 2: Grouped Bar Chart
 */
export function createGroupedBarChart(): Document {
    // Comparative data for multiple products
    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const seriesData = [
        { name: 'Product A', values: [45, 52, 38, 61, 55], color: ChartColors.Primary },
        { name: 'Product B', values: [35, 48, 42, 51, 47], color: ChartColors.Secondary },
        { name: 'Product C', values: [28, 35, 45, 39, 52], color: ChartColors.Success },
    ];

    const groupedChart = BarChartHelpers.createGrouped(categories, seriesData, {
        title: 'Monthly Product Sales Comparison',
        orientation: BarOrientation.Vertical,
        width: 500,
        height: 300,
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Grouped Bar Chart Example', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 20,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#333333',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: groupedChart,
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This grouped bar chart compares three products across five months. Each group contains bars for all products, making it easy to compare performance both within and across time periods.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 3: Stacked Bar Chart
 */
export function createStackedBarChart(): Document {
    const categories = ['Team A', 'Team B', 'Team C', 'Team D'];
    const seriesData = [
        { name: 'Completed', values: [45, 38, 52, 41], color: ChartColors.Success },
        { name: 'In Progress', values: [15, 22, 18, 25], color: ChartColors.Warning },
        { name: 'Pending', values: [8, 12, 6, 14], color: ChartColors.Danger },
    ];

    const stackedChart = BarChartHelpers.createStacked(categories, seriesData, {
        title: 'Project Status by Team',
        orientation: BarOrientation.Vertical,
        width: 450,
        height: 280,
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Stacked Bar Chart Example', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 20,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#333333',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: stackedChart,
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This stacked bar chart shows the breakdown of project status for each team. The segments stack on top of each other, making it easy to see both individual category values and total values per team.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 4: Simple Line Chart
 */
export function createSimpleLineChart(): Document {
    // Time series data
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const revenue = [85, 92, 88, 96, 105, 112, 108, 118, 125, 132, 128, 145];

    const lineChart = LineChartHelpers.createSimple(months, revenue, {
        title: 'Monthly Revenue Growth',
        color: ChartColors.Primary,
        width: 480,
        height: 300,
        showMarkers: true,
        fillArea: true,
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Simple Line Chart Example', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 20,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#333333',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: lineChart,
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This line chart displays monthly revenue growth over a year. The filled area under the line helps visualize the trend, while markers highlight individual data points.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 5: Multi-Series Line Chart
 */
export function createMultiSeriesLineChart(): Document {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const seriesData = [
        {
            name: 'Desktop',
            xData: months,
            yData: [65, 68, 72, 71, 74, 78, 82, 85, 87, 89, 91, 93],
            color: ChartColors.Primary,
        },
        {
            name: 'Mobile',
            xData: months,
            yData: [25, 28, 35, 42, 48, 52, 58, 65, 72, 78, 82, 85],
            color: ChartColors.Secondary,
        },
        {
            name: 'Tablet',
            xData: months,
            yData: [10, 12, 13, 15, 18, 20, 22, 25, 27, 28, 30, 32],
            color: ChartColors.Success,
        },
    ];

    const multiLineChart = LineChartHelpers.createMultiSeries(seriesData, {
        title: 'Traffic by Device Type',
        width: 520,
        height: 320,
        showMarkers: true,
        smoothLines: true,
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(40),
            child: new Column({
                children: [
                    new Text('Multi-Series Line Chart Example', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 20,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#333333',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: multiLineChart,
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This multi-series line chart compares website traffic from different device types over time. Each series has its own color and is displayed with smooth lines and markers. The legend helps identify each series.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 6: Custom Styled Charts
 */
export function createCustomStyledCharts(): Document {
    // Custom data series with specific styling
    const customSeries: ChartDataSeries[] = [
        {
            name: 'Premium',
            color: '#8e44ad',
            data: [
                { x: 'Jan', y: 45 },
                { x: 'Feb', y: 52 },
                { x: 'Mar', y: 58 },
                { x: 'Apr', y: 61 },
            ],
            strokeWidth: 3,
        },
        {
            name: 'Standard',
            color: '#3498db',
            data: [
                { x: 'Jan', y: 78 },
                { x: 'Feb', y: 85 },
                { x: 'Mar', y: 82 },
                { x: 'Apr', y: 91 },
            ],
            strokeWidth: 2,
        },
    ];

    const customBarChart = new BarChart({
        series: customSeries,
        title: 'Subscription Plans Performance',
        orientation: BarOrientation.Vertical,
        mode: BarMode.Grouped,
        barWidth: 0.7,
        width: 350,
        height: 200,
        style: {
            backgroundColor: '#f8f9fa',
            borderColor: '#dee2e6',
            borderWidth: 1,
            padding: EdgeInsets.all(10),
        },
        legend: {
            show: true,
            position: 'bottom',
            alignment: 'center',
        },
        xAxis: {
            title: 'Month',
            showGrid: true,
            gridColor: '#e9ecef',
        },
        yAxis: {
            title: 'Subscriptions',
            showGrid: true,
            gridColor: '#e9ecef',
        },
    });

    const customLineChart = new LineChart({
        series: customSeries,
        title: 'Growth Trends',
        width: 350,
        height: 200,
        showMarkers: true,
        markerStyle: LineMarker.Circle,
        markerSize: 5,
        lineWidth: 2,
        smoothLines: true,
        style: {
            backgroundColor: '#ffffff',
            borderColor: '#ced4da',
            borderWidth: 2,
            padding: EdgeInsets.all(12),
        },
        legend: {
            show: true,
            position: 'top',
            alignment: 'center',
        },
    });

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(30),
            child: new Column({
                children: [
                    new Text('Custom Styled Charts', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 22,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#2c3e50',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Row({
                            children: [
                                new Container({
                                    width: 350,
                                    child: customBarChart,
                                }),
                                new Padding({
                                    padding: EdgeInsets.only({ left: 20 }),
                                    child: new Container({
                                        width: 350,
                                        child: customLineChart,
                                    }),
                                }),
                            ],
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 25 }),
                        child: new Text('These charts demonstrate advanced styling capabilities including custom colors, borders, backgrounds, and grid lines. The bar chart uses grouped mode while the line chart features smooth curves and circular markers.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 10,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#666666',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Example 7: Dashboard-Style Layout
 */
export function createDashboardLayout(): Document {
    // Create multiple small charts for dashboard
    const salesChart = BarChartHelpers.createSimple(
        ['Q1', 'Q2', 'Q3', 'Q4'],
        [125, 138, 142, 156],
        {
            title: 'Quarterly Sales',
            color: ChartColors.Primary,
            width: 250,
            height: 150,
        }
    );

    const trendsChart = LineChartHelpers.createSimple(
        [1, 2, 3, 4, 5, 6],
        [45, 52, 48, 61, 58, 67],
        {
            title: 'Growth Trends',
            color: ChartColors.Success,
            width: 250,
            height: 150,
            showMarkers: true,
            fillArea: false,
        }
    );

    const comparisonChart = BarChartHelpers.createGrouped(
        ['Product A', 'Product B'],
        [
            { name: 'Last Month', values: [85, 92] },
            { name: 'This Month', values: [91, 87] },
        ],
        {
            title: 'Month Comparison',
            width: 250,
            height: 150,
        }
    );

    const performanceChart = LineChartHelpers.createMultiSeries(
        [
            { name: 'Target', xData: [1, 2, 3, 4], yData: [100, 100, 100, 100] },
            { name: 'Actual', xData: [1, 2, 3, 4], yData: [95, 102, 98, 105] },
        ],
        {
            title: 'Performance vs Target',
            width: 250,
            height: 150,
            showMarkers: false,
        }
    );

    const doc = new Document();
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Column({
                children: [
                    new Text('Executive Dashboard', {
                        style: TextStyleUtils.createDefault({
                            fontSize: 24,
                            fontWeight: FontWeight.Bold,
                            fontFamily: PdfStandardFont.Helvetica,
                            color: '#2c3e50',
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Column({
                            children: [
                                // First row of charts
                                new Row({
                                    children: [
                                        salesChart,
                                        new Padding({
                                            padding: EdgeInsets.only({ left: 20 }),
                                            child: trendsChart,
                                        }),
                                    ],
                                }),

                                // Second row of charts
                                new Padding({
                                    padding: EdgeInsets.only({ top: 20 }),
                                    child: new Row({
                                        children: [
                                            comparisonChart,
                                            new Padding({
                                                padding: EdgeInsets.only({ left: 20 }),
                                                child: performanceChart,
                                            }),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                    }),

                    new Padding({
                        padding: EdgeInsets.only({ top: 20 }),
                        child: new Text('This dashboard layout combines multiple chart types in a grid format, providing a comprehensive view of key business metrics. Each chart is sized appropriately for quick scanning while maintaining readability.', {
                            style: TextStyleUtils.createDefault({
                                fontSize: 9,
                                fontFamily: PdfStandardFont.Helvetica,
                                color: '#7f8c8d',
                            }),
                        }),
                    }),
                ],
            }),
        }),
    });

    return doc;
}

/**
 * Helper function to save examples
 */
export async function saveChartExamples(): Promise<void> {
    // Create and save each example
    const examples = [
        { name: 'simple-bar-chart', doc: createSimpleBarChart() },
        { name: 'grouped-bar-chart', doc: createGroupedBarChart() },
        { name: 'stacked-bar-chart', doc: createStackedBarChart() },
        { name: 'simple-line-chart', doc: createSimpleLineChart() },
        { name: 'multi-series-line-chart', doc: createMultiSeriesLineChart() },
        { name: 'custom-styled-charts', doc: createCustomStyledCharts() },
        { name: 'dashboard-layout', doc: createDashboardLayout() },
    ];

    for (const example of examples) {
        try {
            const pdfBytes = await example.doc.save();
            // In a real environment, you would save to file system
            console.log(`Generated ${example.name}.pdf (${pdfBytes.length} bytes)`);
        } catch (error) {
            console.error(`Failed to generate ${example.name}:`, error);
        }
    }
}

// Export all examples for testing/demo purposes
export const chartExamples = {
    createSimpleBarChart,
    createGroupedBarChart,
    createStackedBarChart,
    createSimpleLineChart,
    createMultiSeriesLineChart,
    createCustomStyledCharts,
    createDashboardLayout,
    saveChartExamples,
};