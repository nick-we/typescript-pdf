/**
 * PDF Visual Validation Tests - Simplified
 *
 * These tests create actual PDF files to verify visual output quality.
 * Generated PDFs are saved to test-output/ for manual inspection.
 *
 * @vitest-environment happy-dom
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { describe, it, expect } from 'vitest';

// Import our restructured system

import { initializeGlobalTextMeasurement } from '@/core/accurate-text-measurement.js';
import { FontSystem } from '@/core/fonts.js';
import { Document, TextAlign } from '@/core/index.js';
import { PdfColor } from '@/core/pdf';
import { Flex, Layout, Theme as ThemeTypes } from '@/types.js';
import {
    Container,
    Txt,
    Row,
    Column,
    Stack,
    Positioned,
    Table,
    BarChart,
    LineChart,
    Theme,
    PrebuiltThemes,
    LayoutUtils,
    FlexUtils,
    DataUtils,
    LineMarker,
    MultiPage,
    PageBreakBehavior,
    MultiPageUtils,
    StackFit,
} from '@/widgets/index.js';

// Test output directory
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output');

// Ensure output directory exists
try {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
} catch (_e) {
    // Directory already exists
}

describe('PDF Visual Validation Tests', () => {
    it('should generate containers with background colors', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(40),
        });

        // Create nested containers with different background colors
        const content = new Container({
            width: 500,
            height: 600,
            decoration: {
                color: PdfColor.fromHex('#f0f0f0'),
                border: { width: 2, color: PdfColor.fromHex('#333333') },
            },
            padding: Layout.EdgeInsets.all(20),
            child: new Column({
                mainAxisAlignment: Flex.MainAxisAlignment.SpaceEvenly,
                children: [
                    // Red container
                    new Container({
                        width: 460,
                        height: 120,
                        decoration: {
                            color: PdfColor.fromHex('#ff6b6b'),
                            borderRadius: {
                                topLeft: 10,
                                topRight: 10,
                                bottomLeft: 10,
                                bottomRight: 10,
                            },
                        },
                        alignment: Layout.Alignment.Center,
                        child: new Txt('Red Container - Centered Text', {
                            style: {
                                fontSize: 18,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                                color: PdfColor.fromHex('#ffffff'),
                            },
                        }),
                    }),

                    // Blue container
                    new Container({
                        width: 460,
                        height: 120,
                        decoration: {
                            color: PdfColor.fromHex('#4dabf7'),
                            borderRadius: {
                                topLeft: 15,
                                topRight: 15,
                                bottomLeft: 15,
                                bottomRight: 15,
                            },
                        },
                        padding: Layout.EdgeInsets.all(15),
                        child: new Txt('Blue Container with Padding', {
                            style: {
                                fontSize: 14,
                                color: PdfColor.fromHex('#ffffff'),
                            },
                            textAlign: TextAlign.Center,
                        }),
                    }),

                    // Green container with layout
                    new Container({
                        width: 460,
                        height: 120,
                        decoration: {
                            color: PdfColor.fromHex('#51cf66'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                        },
                        padding: Layout.EdgeInsets.symmetric({
                            horizontal: 20,
                            vertical: 10,
                        }),
                        child: new Row({
                            mainAxisAlignment:
                                Flex.MainAxisAlignment.SpaceBetween,
                            crossAxisAlignment: Flex.CrossAxisAlignment.Center,
                            children: [
                                new Txt('Left Side', {
                                    style: {
                                        fontSize: 16,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#ffffff'),
                                    },
                                }),
                                new Container({
                                    width: 60,
                                    height: 60,
                                    decoration: {
                                        color: PdfColor.fromHex('#ffffff'),
                                        borderRadius: {
                                            topLeft: 30,
                                            topRight: 30,
                                            bottomLeft: 30,
                                            bottomRight: 30,
                                        },
                                    },
                                    alignment: Layout.Alignment.Center,
                                    child: new Txt('•', {
                                        style: {
                                            fontSize: 24,
                                            color: PdfColor.fromHex('#51cf66'),
                                        },
                                    }),
                                }),
                                new Txt('Right Side', {
                                    style: {
                                        fontSize: 16,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#ffffff'),
                                    },
                                }),
                            ],
                        }),
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'visual-containers.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
    });

    it('should generate typography showcase', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(30),
        });

        const content = new Theme({
            data: PrebuiltThemes.corporate(),
            child: new Column({
                crossAxisAlignment: Flex.CrossAxisAlignment.Stretch,
                children: [
                    // Header
                    new Container({
                        padding: Layout.EdgeInsets.all(20),
                        decoration: {
                            color: PdfColor.fromHex('#2c3e50'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                        },
                        child: new Txt('Typography Showcase', {
                            style: {
                                fontSize: 28,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                                color: PdfColor.fromHex('#ffffff'),
                            },
                            textAlign: TextAlign.Center,
                        }),
                    }),

                    LayoutUtils.padded(
                        new Column({
                            crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                            children: [
                                new Txt('Heading 1 - Large Text', {
                                    style: {
                                        fontSize: 24,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#2c3e50'),
                                    },
                                }),
                                new Txt('Heading 2 - Medium Text', {
                                    style: {
                                        fontSize: 20,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#34495e'),
                                    },
                                }),
                                new Txt(
                                    'Body text with proper spacing. This demonstrates text flow.',
                                    {
                                        style: {
                                            fontSize: 12,
                                            lineSpacing: 1.6,
                                            color: PdfColor.fromHex('#2c3e50'),
                                        },
                                    }
                                ),

                                // Text alignment examples
                                new Container({
                                    width: 500,
                                    padding: Layout.EdgeInsets.all(15),
                                    decoration: {
                                        color: PdfColor.fromHex('#ecf0f1'),
                                        borderRadius: {
                                            topLeft: 5,
                                            topRight: 5,
                                            bottomLeft: 5,
                                            bottomRight: 5,
                                        },
                                    },
                                    child: new Column({
                                        children: [
                                            new Txt('Left Aligned Text', {
                                                textAlign: TextAlign.Left,
                                                style: {
                                                    fontSize: 14,
                                                    color: PdfColor.fromHex(
                                                        '#2c3e50'
                                                    ),
                                                },
                                            }),
                                            new Txt('Center Aligned Text', {
                                                textAlign: TextAlign.Center,
                                                style: {
                                                    fontSize: 14,
                                                    color: PdfColor.fromHex(
                                                        '#2c3e50'
                                                    ),
                                                },
                                            }),
                                            new Txt('Right Aligned Text', {
                                                textAlign: TextAlign.Right,
                                                style: {
                                                    fontSize: 14,
                                                    color: PdfColor.fromHex(
                                                        '#2c3e50'
                                                    ),
                                                },
                                            }),
                                        ],
                                    }),
                                }),
                            ],
                        }),
                        Layout.EdgeInsets.all(20)
                    ),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'visual-typography.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
    });

    it('should generate data table example', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(25),
        });

        // Sample data
        const salesData = [
            ['Month', 'Revenue', 'Growth'],
            ['January', '$45,200', '+12%'],
            ['February', '$52,100', '+15%'],
            ['March', '$48,900', '+8%'],
            ['April', '$59,300', '+21%'],
        ];

        const content = new Container({
            padding: Layout.EdgeInsets.all(20),
            child: new Column({
                children: [
                    // Title
                    new Container({
                        alignment: Layout.Alignment.Center,
                        child: new Txt('Sales Report', {
                            style: {
                                fontSize: 26,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                                color: PdfColor.fromHex('#2c3e50'),
                            },
                        }),
                    }),

                    LayoutUtils.padded(
                        new Container({
                            padding: Layout.EdgeInsets.all(10),
                            decoration: {
                                color: PdfColor.fromHex('#f8f9fa'),
                                borderRadius: {
                                    topLeft: 8,
                                    topRight: 8,
                                    bottomLeft: 8,
                                    bottomRight: 8,
                                },
                                border: {
                                    width: 1,
                                    color: PdfColor.fromHex('#dee2e6'),
                                },
                            },
                            child: new Column({
                                children: [
                                    new Txt('Monthly Performance', {
                                        style: {
                                            fontSize: 16,
                                            fontWeight:
                                                ThemeTypes.FontWeight.Bold,
                                            color: PdfColor.fromHex('#495057'),
                                        },
                                    }),
                                    LayoutUtils.padded(
                                        new Table({
                                            data: salesData,
                                            borders: {
                                                top: {
                                                    width: 1,
                                                    color: PdfColor.fromHex(
                                                        '#dee2e6'
                                                    ),
                                                },
                                                bottom: {
                                                    width: 1,
                                                    color: PdfColor.fromHex(
                                                        '#dee2e6'
                                                    ),
                                                },
                                                horizontal: {
                                                    width: 0.5,
                                                    color: PdfColor.fromHex(
                                                        '#e9ecef'
                                                    ),
                                                },
                                            },
                                            columnWidths: [
                                                DataUtils.columnWidths.fixed(
                                                    80
                                                ),
                                                DataUtils.columnWidths.flex(1),
                                                DataUtils.columnWidths.fixed(
                                                    60
                                                ),
                                            ],
                                        }),
                                        Layout.EdgeInsets.only({ top: 10 })
                                    ),
                                ],
                            }),
                        }),
                        Layout.EdgeInsets.symmetric({ vertical: 20 })
                    ),

                    // Summary metrics
                    new Container({
                        padding: Layout.EdgeInsets.all(20),
                        decoration: {
                            color: PdfColor.fromHex('#e3f2fd'),
                            borderRadius: {
                                topLeft: 10,
                                topRight: 10,
                                bottomLeft: 10,
                                bottomRight: 10,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#bbdefb'),
                            },
                        },
                        child: new Row({
                            mainAxisAlignment:
                                Flex.MainAxisAlignment.SpaceEvenly,
                            children: [
                                new Column({
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Center,
                                    children: [
                                        new Txt('Total Revenue', {
                                            style: {
                                                fontSize: 12,
                                                color: PdfColor.fromHex('#666'),
                                            },
                                        }),
                                        new Txt('$205,500', {
                                            style: {
                                                fontSize: 20,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex(
                                                    '#1976d2'
                                                ),
                                            },
                                        }),
                                    ],
                                }),
                                new Column({
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Center,
                                    children: [
                                        new Txt('Avg Growth', {
                                            style: {
                                                fontSize: 12,
                                                color: PdfColor.fromHex('#666'),
                                            },
                                        }),
                                        new Txt('+14%', {
                                            style: {
                                                fontSize: 20,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex(
                                                    '#388e3c'
                                                ),
                                            },
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'visual-data-table.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
    });

    it('should generate responsive layout example', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(15),
        });

        const content = new Container({
            padding: Layout.EdgeInsets.all(20),
            child: new Column({
                children: [
                    // Header
                    new Container({
                        height: 60,
                        decoration: {
                            color: PdfColor.fromHex('#2c3e50'),
                            borderRadius: {
                                topLeft: 5,
                                topRight: 5,
                                bottomLeft: 5,
                                bottomRight: 5,
                            },
                        },
                        alignment: Layout.Alignment.Center,
                        child: new Txt('Responsive Layout Demo', {
                            style: {
                                fontSize: 20,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                                color: PdfColor.fromHex('#ffffff'),
                            },
                        }),
                    }),

                    // Three equal columns
                    LayoutUtils.padded(
                        new Row({
                            children: [
                                FlexUtils.expanded(
                                    new Container({
                                        height: 100,
                                        margin: Layout.EdgeInsets.only({
                                            right: 5,
                                        }),
                                        decoration: {
                                            color: PdfColor.fromHex('#e74c3c'),
                                            borderRadius: {
                                                topLeft: 5,
                                                topRight: 5,
                                                bottomLeft: 5,
                                                bottomRight: 5,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Column 1', {
                                            style: {
                                                fontSize: 14,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    })
                                ),
                                FlexUtils.expanded(
                                    new Container({
                                        height: 100,
                                        margin: Layout.EdgeInsets.symmetric({
                                            horizontal: 5,
                                        }),
                                        decoration: {
                                            color: PdfColor.fromHex('#f39c12'),
                                            borderRadius: {
                                                topLeft: 5,
                                                topRight: 5,
                                                bottomLeft: 5,
                                                bottomRight: 5,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Column 2', {
                                            style: {
                                                fontSize: 14,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    })
                                ),
                                FlexUtils.expanded(
                                    new Container({
                                        height: 100,
                                        margin: Layout.EdgeInsets.only({
                                            left: 5,
                                        }),
                                        decoration: {
                                            color: PdfColor.fromHex('#27ae60'),
                                            borderRadius: {
                                                topLeft: 5,
                                                topRight: 5,
                                                bottomLeft: 5,
                                                bottomRight: 5,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Column 3', {
                                            style: {
                                                fontSize: 14,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    })
                                ),
                            ],
                        }),
                        Layout.EdgeInsets.symmetric({ vertical: 10 })
                    ),

                    // 2:1 ratio layout
                    new Row({
                        children: [
                            FlexUtils.flexible(
                                new Container({
                                    height: 120,
                                    margin: Layout.EdgeInsets.only({
                                        right: 10,
                                    }),
                                    decoration: {
                                        color: PdfColor.fromHex('#3498db'),
                                        borderRadius: {
                                            topLeft: 5,
                                            topRight: 5,
                                            bottomLeft: 5,
                                            bottomRight: 5,
                                        },
                                    },
                                    padding: Layout.EdgeInsets.all(15),
                                    child: new Column({
                                        crossAxisAlignment:
                                            Flex.CrossAxisAlignment.Start,
                                        children: [
                                            new Txt('Main Content', {
                                                style: {
                                                    fontSize: 16,
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
                                                    color: PdfColor.fromHex(
                                                        '#fff'
                                                    ),
                                                },
                                            }),
                                            LayoutUtils.padded(
                                                new Txt(
                                                    'This takes up 2/3 of available space.',
                                                    {
                                                        style: {
                                                            fontSize: 10,
                                                            color: PdfColor.fromHex(
                                                                '#fff'
                                                            ),
                                                            lineSpacing: 1.4,
                                                        },
                                                    }
                                                ),
                                                Layout.EdgeInsets.only({
                                                    top: 8,
                                                })
                                            ),
                                        ],
                                    }),
                                }),
                                { flex: 2 }
                            ),
                            FlexUtils.flexible(
                                new Container({
                                    height: 120,
                                    decoration: {
                                        color: PdfColor.fromHex('#9b59b6'),
                                        borderRadius: {
                                            topLeft: 5,
                                            topRight: 5,
                                            bottomLeft: 5,
                                            bottomRight: 5,
                                        },
                                    },
                                    alignment: Layout.Alignment.Center,
                                    child: new Column({
                                        mainAxisAlignment:
                                            Flex.MainAxisAlignment.Center,
                                        children: [
                                            new Txt('Sidebar', {
                                                style: {
                                                    fontSize: 14,
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
                                                    color: PdfColor.fromHex(
                                                        '#fff'
                                                    ),
                                                },
                                            }),
                                            new Txt('1/3 width', {
                                                style: {
                                                    fontSize: 10,
                                                    color: PdfColor.fromHex(
                                                        '#fff'
                                                    ),
                                                },
                                            }),
                                        ],
                                    }),
                                }),
                                { flex: 1 }
                            ),
                        ],
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'visual-responsive.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
    });

    it('should generate chart visualization with proper text positioning', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(20),
        });

        // Sample chart data
        const salesData = DataUtils.createSeries(
            'Sales',
            [
                { x: 'Q1', y: 125000 },
                { x: 'Q2', y: 145000 },
                { x: 'Q3', y: 135000 },
                { x: 'Q4', y: 162000 },
            ],
            PdfColor.fromHex('#3498db')
        );

        const profitData = DataUtils.createSeries(
            'Profit',
            [
                { x: 'Q1', y: 45000 },
                { x: 'Q2', y: 52000 },
                { x: 'Q3', y: 48000 },
                { x: 'Q4', y: 61000 },
            ],
            PdfColor.fromHex('#e74c3c')
        );

        const trendData = DataUtils.createSeries(
            'Growth Trend',
            [
                { x: 0, y: 100 },
                { x: 1, y: 115 },
                { x: 2, y: 108 },
                { x: 3, y: 130 },
                { x: 4, y: 125 },
                { x: 5, y: 142 },
            ],
            PdfColor.fromHex('#27ae60')
        );

        const content = new Container({
            padding: Layout.EdgeInsets.all(15),
            child: new Column({
                children: [
                    // Page title
                    new Container({
                        alignment: Layout.Alignment.Center,
                        padding: Layout.EdgeInsets.only({ bottom: 20 }),
                        child: new Txt('Chart Visualization Test', {
                            style: {
                                fontSize: 24,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                                color: PdfColor.fromHex('#2c3e50'),
                            },
                        }),
                    }),

                    // Bar chart section
                    new Container({
                        height: 280,
                        margin: Layout.EdgeInsets.only({ bottom: 20 }),
                        decoration: {
                            color: PdfColor.fromHex('#f8f9fa'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#dee2e6'),
                            },
                        },
                        padding: Layout.EdgeInsets.all(10),
                        child: new BarChart({
                            title: 'Quarterly Performance - Bar Chart',
                            series: [salesData, profitData],
                            xAxis: {
                                title: 'Quarter',
                                showLabels: true,
                            },
                            yAxis: {
                                title: 'Amount ($)',
                                showLabels: true,
                            },
                            width: 540,
                            height: 260,
                            colors: [
                                PdfColor.fromHex('#3498db'),
                                PdfColor.fromHex('#e74c3c'),
                                PdfColor.fromHex('#f39c12'),
                                PdfColor.fromHex('#27ae60'),
                            ],
                        }),
                    }),

                    // Line chart section
                    new Container({
                        height: 280,
                        margin: Layout.EdgeInsets.only({ bottom: 15 }),
                        decoration: {
                            color: PdfColor.fromHex('#f0f8ff'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#b3d9ff'),
                            },
                        },
                        padding: Layout.EdgeInsets.all(10),
                        child: new LineChart({
                            title: 'Growth Trend Analysis - Line Chart',
                            series: [trendData],
                            xAxis: {
                                title: 'Time Period',
                                showLabels: true,
                            },
                            yAxis: {
                                title: 'Index Value',
                                showLabels: true,
                            },
                            width: 540,
                            height: 260,
                            marker: LineMarker.Circle,
                            lineWidth: 2,
                            colors: [PdfColor.fromHex('#27ae60')],
                        }),
                    }),

                    // Chart description
                    new Container({
                        padding: Layout.EdgeInsets.all(15),
                        decoration: {
                            color: PdfColor.fromHex('#fff3cd'),
                            borderRadius: {
                                topLeft: 6,
                                topRight: 6,
                                bottomLeft: 6,
                                bottomRight: 6,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#ffeaa7'),
                            },
                        },
                        child: new Column({
                            children: [
                                new Txt('Chart Text Positioning Validation', {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#856404'),
                                    },
                                }),
                                LayoutUtils.padded(
                                    new Txt(
                                        'This test validates that all text elements in charts render correctly:\n• Chart titles are centered at the top\n• X-axis labels appear at the bottom\n• Y-axis labels are rotated vertically on the left\n• Value labels are positioned above bars/near markers\n• All text respects the PDF coordinate system transformation',
                                        {
                                            style: {
                                                fontSize: 11,
                                                color: PdfColor.fromHex(
                                                    '#856404'
                                                ),
                                                lineSpacing: 1.4,
                                            },
                                        }
                                    ),
                                    Layout.EdgeInsets.only({ top: 8 })
                                ),
                            ],
                        }),
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'visual-charts.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
        console.log(`📊 Chart test includes:`);
        console.log(`   - Bar chart with title, axis labels, and value labels`);
        console.log(`   - Line chart with markers and trend line`);
        console.log(
            `   - Text positioning validation across coordinate systems`
        );
    });

    it('should demonstrate child positioning issues in layout widgets', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(20),
        });

        // Create colored test widgets to make positioning issues visible
        const createColoredBox = (
            color: PdfColor,
            text: string,
            size: number = 80
        ) =>
            new Container({
                width: size,
                height: size,
                decoration: {
                    color,
                    border: { width: 2, color: PdfColor.fromHex('#000000') },
                },
                alignment: Layout.Alignment.Center,
                child: new Txt(text, {
                    style: {
                        fontSize: 10,
                        fontWeight: ThemeTypes.FontWeight.Bold,
                        color: PdfColor.fromHex('#ffffff'),
                    },
                }),
            });

        const content = new Container({
            padding: Layout.EdgeInsets.all(20),
            child: new Column({
                crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                mainAxisSpacing: 30,
                children: [
                    // Title
                    new Txt('Layout Widget Positioning Test', {
                        style: {
                            fontSize: 20,
                            fontWeight: ThemeTypes.FontWeight.Bold,
                            color: PdfColor.fromHex('#2c3e50'),
                        },
                    }),

                    // 1. Container test (SHOULD WORK - baseline)
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt(
                                '1. Container Widget (Expected: GREEN at center)',
                                {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#333'),
                                    },
                                }
                            ),
                            new Container({
                                width: 200,
                                height: 100,
                                decoration: {
                                    color: PdfColor.fromHex('#f0f0f0'),
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#999'),
                                    },
                                },
                                alignment: Layout.Alignment.Center,
                                child: createColoredBox(
                                    PdfColor.fromHex('#27ae60'),
                                    'OK',
                                    60
                                ),
                            }),
                        ],
                    }),

                    // 2. Stack test (EXPECTED TO BE BROKEN)
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt(
                                '2. Stack Widget (Expected: BLUE centered, RED top-right)',
                                {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#333'),
                                    },
                                }
                            ),
                            new Txt(
                                '   → If broken: both boxes at top-left corner overlapping',
                                {
                                    style: {
                                        fontSize: 12,
                                        color: PdfColor.fromHex('#666'),
                                    },
                                }
                            ),
                            new Container({
                                width: 200,
                                height: 100,
                                decoration: {
                                    color: PdfColor.fromHex('#f0f0f0'),
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#999'),
                                    },
                                },
                                child: new Stack({
                                    fit: StackFit.Expand,
                                    children: [
                                        new Container({
                                            alignment: Layout.Alignment.Center,
                                            child: createColoredBox(
                                                PdfColor.fromHex('#3498db'),
                                                'CENTER',
                                                50
                                            ),
                                        }),
                                        new Positioned({
                                            top: 10,
                                            right: 10,
                                            child: createColoredBox(
                                                PdfColor.fromHex('#e74c3c'),
                                                'TOP-R',
                                                30
                                            ),
                                        }),
                                    ],
                                }),
                            }),
                        ],
                    }),

                    // 3. Row test (EXPECTED TO BE BROKEN)
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt(
                                '3. Row Widget (Expected: 3 boxes in horizontal line)',
                                {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#333'),
                                    },
                                }
                            ),
                            new Txt(
                                '   → If broken: all 3 boxes stacked at left edge',
                                {
                                    style: {
                                        fontSize: 12,
                                        color: PdfColor.fromHex('#666'),
                                    },
                                }
                            ),
                            new Container({
                                width: 300,
                                height: 80,
                                decoration: {
                                    color: PdfColor.fromHex('#f0f0f0'),
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#999'),
                                    },
                                },
                                child: new Row({
                                    mainAxisAlignment:
                                        Flex.MainAxisAlignment.SpaceEvenly,
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Center,
                                    children: [
                                        createColoredBox(
                                            PdfColor.fromHex('#e67e22'),
                                            '1',
                                            50
                                        ),
                                        createColoredBox(
                                            PdfColor.fromHex('#9b59b6'),
                                            '2',
                                            50
                                        ),
                                        createColoredBox(
                                            PdfColor.fromHex('#1abc9c'),
                                            '3',
                                            50
                                        ),
                                    ],
                                }),
                            }),
                        ],
                    }),

                    // 4. Column test (EXPECTED TO BE BROKEN)
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt(
                                '4. Column Widget (Expected: 3 boxes in vertical line)',
                                {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#333'),
                                    },
                                }
                            ),
                            new Txt(
                                '   → If broken: all 3 boxes stacked at top edge',
                                {
                                    style: {
                                        fontSize: 12,
                                        color: PdfColor.fromHex('#666'),
                                    },
                                }
                            ),
                            new Container({
                                width: 100,
                                height: 200,
                                decoration: {
                                    color: PdfColor.fromHex('#f0f0f0'),
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#999'),
                                    },
                                },
                                child: new Column({
                                    mainAxisAlignment:
                                        Flex.MainAxisAlignment.SpaceEvenly,
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Center,
                                    children: [
                                        createColoredBox(
                                            PdfColor.fromHex('#f39c12'),
                                            'A',
                                            40
                                        ),
                                        createColoredBox(
                                            PdfColor.fromHex('#8e44ad'),
                                            'B',
                                            40
                                        ),
                                        createColoredBox(
                                            PdfColor.fromHex('#16a085'),
                                            'C',
                                            40
                                        ),
                                    ],
                                }),
                            }),
                        ],
                    }),

                    // Expected results description
                    new Container({
                        padding: Layout.EdgeInsets.all(15),
                        decoration: {
                            color: PdfColor.fromHex('#fff3cd'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#ffeaa7'),
                            },
                        },
                        child: new Column({
                            crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                            children: [
                                new Txt('Expected Results:', {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#856404'),
                                    },
                                }),
                                LayoutUtils.padded(
                                    new Txt(
                                        '• Container: GREEN box should be centered (✓ Working)\n• Stack: BLUE centered + RED at top-right (❌ Broken)\n• Row: 3 boxes spread horizontally (❌ Broken)\n• Column: 3 boxes spread vertically (❌ Broken)',
                                        {
                                            style: {
                                                fontSize: 11,
                                                color: PdfColor.fromHex(
                                                    '#856404'
                                                ),
                                                lineSpacing: 1.4,
                                            },
                                        }
                                    ),
                                    Layout.EdgeInsets.only({ top: 8 })
                                ),
                            ],
                        }),
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'positioning-test-broken.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
        console.log(`🔍 Positioning test demonstrates:`);
        console.log(`   - Container widget: Correct positioning (baseline)`);
        console.log(`   - Stack widget: Broken positioning (children at 0,0)`);
        console.log(`   - Row widget: Broken positioning (children at 0,0)`);
        console.log(`   - Column widget: Broken positioning (children at 0,0)`);
        console.log(
            `⚠️  Expected issues: Stack, Row, and Column children should overlap at origin`
        );
    });

    it('should generate BorderRadius validation test', async () => {
        const doc = new Document();

        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(20),
        });

        const content = new Container({
            padding: Layout.EdgeInsets.all(20),
            child: new Column({
                crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                mainAxisSpacing: 20,
                children: [
                    // Title
                    new Txt('BorderRadius Validation Test', {
                        style: {
                            fontSize: 24,
                            fontWeight: ThemeTypes.FontWeight.Bold,
                            color: PdfColor.fromHex('#2c3e50'),
                        },
                    }),

                    // Row 1: Different radius values
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt('1. Different Border Radius Values', {
                                style: {
                                    fontSize: 16,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                    color: PdfColor.fromHex('#333'),
                                },
                            }),
                            new Row({
                                mainAxisAlignment:
                                    Flex.MainAxisAlignment.SpaceEvenly,
                                children: [
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#e74c3c'),
                                            borderRadius: {
                                                topLeft: 0,
                                                topRight: 0,
                                                bottomLeft: 0,
                                                bottomRight: 0,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('No\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#3498db'),
                                            borderRadius: {
                                                topLeft: 5,
                                                topRight: 5,
                                                bottomLeft: 5,
                                                bottomRight: 5,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('5px\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#27ae60'),
                                            borderRadius: {
                                                topLeft: 15,
                                                topRight: 15,
                                                bottomLeft: 15,
                                                bottomRight: 15,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('15px\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#f39c12'),
                                            borderRadius: {
                                                topLeft: 40,
                                                topRight: 40,
                                                bottomLeft: 40,
                                                bottomRight: 40,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt(
                                            '40px\nRadius\n(Circle)',
                                            {
                                                style: {
                                                    fontSize: 9,
                                                    color: PdfColor.fromHex(
                                                        '#fff'
                                                    ),
                                                },
                                            }
                                        ),
                                    }),
                                ],
                            }),
                        ],
                    }),

                    // Row 2: Different corner combinations
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt('2. Individual Corner Radius', {
                                style: {
                                    fontSize: 16,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                    color: PdfColor.fromHex('#333'),
                                },
                            }),
                            new Row({
                                mainAxisAlignment:
                                    Flex.MainAxisAlignment.SpaceEvenly,
                                children: [
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#9b59b6'),
                                            borderRadius: {
                                                topLeft: 20,
                                                topRight: 0,
                                                bottomLeft: 0,
                                                bottomRight: 0,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Top-Left\nOnly', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#1abc9c'),
                                            borderRadius: {
                                                topLeft: 0,
                                                topRight: 20,
                                                bottomLeft: 0,
                                                bottomRight: 20,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Right\nSide', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#e67e22'),
                                            borderRadius: {
                                                topLeft: 15,
                                                topRight: 15,
                                                bottomLeft: 0,
                                                bottomRight: 0,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Top\nOnly', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 100,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#34495e'),
                                            borderRadius: {
                                                topLeft: 10,
                                                topRight: 20,
                                                bottomLeft: 30,
                                                bottomRight: 5,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Mixed\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                ],
                            }),
                        ],
                    }),

                    // Row 3: Border + BorderRadius
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        mainAxisSpacing: 10,
                        children: [
                            new Txt('3. Border + BorderRadius Combination', {
                                style: {
                                    fontSize: 16,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                    color: PdfColor.fromHex('#333'),
                                },
                            }),
                            new Row({
                                mainAxisAlignment:
                                    Flex.MainAxisAlignment.SpaceEvenly,
                                children: [
                                    new Container({
                                        width: 120,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#ffffff'),
                                            borderRadius: {
                                                topLeft: 10,
                                                topRight: 10,
                                                bottomLeft: 10,
                                                bottomRight: 10,
                                            },
                                            border: {
                                                width: 2,
                                                color: PdfColor.fromHex(
                                                    '#e74c3c'
                                                ),
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Border +\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex(
                                                    '#e74c3c'
                                                ),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 120,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#f8f9fa'),
                                            borderRadius: {
                                                topLeft: 20,
                                                topRight: 20,
                                                bottomLeft: 20,
                                                bottomRight: 20,
                                            },
                                            border: {
                                                width: 3,
                                                color: PdfColor.fromHex(
                                                    '#3498db'
                                                ),
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt(
                                            'Thick Border\n+ Circle',
                                            {
                                                style: {
                                                    fontSize: 10,
                                                    color: PdfColor.fromHex(
                                                        '#3498db'
                                                    ),
                                                },
                                            }
                                        ),
                                    }),
                                    new Container({
                                        width: 120,
                                        height: 80,
                                        decoration: {
                                            color: PdfColor.fromHex('#27ae60'),
                                            borderRadius: {
                                                topLeft: 0,
                                                topRight: 15,
                                                bottomLeft: 15,
                                                bottomRight: 0,
                                            },
                                            border: {
                                                width: 1,
                                                color: PdfColor.fromHex(
                                                    '#ffffff'
                                                ),
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Diagonal\nRadius', {
                                            style: {
                                                fontSize: 10,
                                                color: PdfColor.fromHex('#fff'),
                                            },
                                        }),
                                    }),
                                ],
                            }),
                        ],
                    }),

                    // Expected results description
                    new Container({
                        padding: Layout.EdgeInsets.all(15),
                        decoration: {
                            color: PdfColor.fromHex('#d4edda'),
                            borderRadius: {
                                topLeft: 8,
                                topRight: 8,
                                bottomLeft: 8,
                                bottomRight: 8,
                            },
                            border: {
                                width: 1,
                                color: PdfColor.fromHex('#c3e6cb'),
                            },
                        },
                        child: new Column({
                            crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                            children: [
                                new Txt('Expected Results:', {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                        color: PdfColor.fromHex('#155724'),
                                    },
                                }),
                                LayoutUtils.padded(
                                    new Txt(
                                        '✅ All containers should have properly rounded corners\n✅ Different radius values should be visually distinct\n✅ Individual corner radius should work correctly\n✅ Borders should follow the rounded shape\n✅ This green container should also have rounded corners',
                                        {
                                            style: {
                                                fontSize: 11,
                                                color: PdfColor.fromHex(
                                                    '#155724'
                                                ),
                                                lineSpacing: 1.4,
                                            },
                                        }
                                    ),
                                    Layout.EdgeInsets.only({ top: 8 })
                                ),
                            ],
                        }),
                    }),
                ],
            }),
        });

        page.renderWidget(content);
        const pdfBytes = await doc.save();

        const outputPath = join(TEST_OUTPUT_DIR, 'border-radius-test.pdf');
        writeFileSync(outputPath, pdfBytes);

        expect(pdfBytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${outputPath}`);
        console.log(`🎨 BorderRadius test includes:`);
        console.log(`   - Different radius values (0px, 5px, 15px, 40px)`);
        console.log(`   - Individual corner radius combinations`);
        console.log(`   - Border + BorderRadius combinations`);
        console.log(
            `   - Expected: All containers should have properly rounded corners`
        );
    });
});

/* Additional consolidated visual tests appended by test-suite consolidation */

describe('MultiPage Visual Generation - Consolidated', () => {
    it('should generate a basic multi-page document with header and footer', async () => {
        const doc = new Document();

        const content = Array.from(
            { length: 16 },
            (_, i) =>
                new Container({
                    child: new Column({
                        children: [
                            new Txt(`Section ${i + 1}`, {
                                style: {
                                    fontSize: 16,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                    color: PdfColor.fromHex('#2c3e50'),
                                },
                            }),
                            new Txt(
                                `This is content for section ${i + 1}. ` +
                                    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
                                    `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                                { style: { fontSize: 12, lineSpacing: 1.4 } }
                            ),
                        ],
                    }),
                    padding: Layout.EdgeInsets.all(12),
                    margin: Layout.EdgeInsets.only({ bottom: 12 }),
                    decoration: {
                        border: {
                            width: 1,
                            color: PdfColor.fromHex('#e0e0e0'),
                        },
                        color: PdfColor.fromHex('#f8f9fa'),
                    },
                })
        );

        const header = (pageNum: number, totalPages: number) =>
            new Container({
                padding: Layout.EdgeInsets.symmetric({
                    horizontal: 20,
                    vertical: 8,
                }),
                child: new Row({
                    mainAxisAlignment: Flex.MainAxisAlignment.SpaceBetween,
                    children: [
                        new Txt('MultiPage Visual Doc', {
                            style: {
                                fontSize: 12,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                            },
                        }),
                        new Txt(`Page ${pageNum} of ${totalPages}`, {
                            style: { fontSize: 10 },
                        }),
                    ],
                }),
                decoration: {
                    color: PdfColor.fromHex('#ecf0f1'),
                    border: { width: 1, color: PdfColor.fromHex('#bdc3c7') },
                },
            });

        const footer = new Container({
            alignment: Layout.Alignment.Center,
            padding: Layout.EdgeInsets.all(6),
            child: new Txt('© MultiPage Visual Test', {
                style: { fontSize: 10, color: PdfColor.fromHex('#95a5a6') },
            }),
        });

        const mp = MultiPageUtils.forReport(
            [
                new Container({
                    padding: Layout.EdgeInsets.only({ bottom: 12 }),
                    child: new Txt('Report Title', {
                        style: {
                            fontSize: 18,
                            fontWeight: ThemeTypes.FontWeight.Bold,
                        },
                    }),
                }),
                ...content,
            ],
            {
                title: 'Consolidated Visual Report',
                showPageNumbers: true,
                margins: Layout.EdgeInsets.all(40),
            }
        );

        // Override header/footer for this test to validate both paths
        const mpWithHeaderFooter = new MultiPage({
            children: [mp],
            header,
            footer,
            pageBreakBehavior: PageBreakBehavior.Auto,
            pageMargins: Layout.EdgeInsets.all(40),
        });

        doc.addPage({ format: 'A4', build: () => mpWithHeaderFooter });

        const bytes = await doc.save();
        const out = join(TEST_OUTPUT_DIR, 'visual-multipage-basic.pdf');
        writeFileSync(out, bytes);
        expect(bytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${out}`);
    });

    it('should generate a utility-based multipage report', async () => {
        const doc = new Document();

        const reportContent = [
            new Container({
                child: new Column({
                    children: [
                        new Txt('EXECUTIVE SUMMARY', {
                            style: {
                                fontSize: 16,
                                fontWeight: ThemeTypes.FontWeight.Bold,
                            },
                        }),
                        new Txt(
                            'This report demonstrates the MultiPageUtils.forReport functionality with consolidated tests.',
                            { style: { fontSize: 11, lineSpacing: 1.5 } }
                        ),
                    ],
                }),
                padding: Layout.EdgeInsets.all(16),
                margin: Layout.EdgeInsets.only({ bottom: 16 }),
                decoration: {
                    color: PdfColor.fromHex('#e8f4fd'),
                    border: { width: 1, color: PdfColor.fromHex('#3498db') },
                },
            }),
            ...Array.from(
                { length: 8 },
                (_, i) =>
                    new Container({
                        child: new Txt(
                            `Content block ${i + 1} — demonstrating paging and layout.`
                        ),
                        padding: Layout.EdgeInsets.all(10),
                        margin: Layout.EdgeInsets.only({ bottom: 10 }),
                        decoration: { color: PdfColor.fromHex('#ffffff') },
                    })
            ),
        ];

        const mp = MultiPageUtils.forReport(reportContent, {
            title: 'Consolidated MultiPage Utils Report',
            showPageNumbers: true,
            margins: Layout.EdgeInsets.all(50),
        });

        doc.addPage({ format: 'A4', build: () => mp });

        const bytes = doc.save();
        const out = join(TEST_OUTPUT_DIR, 'visual-multipage-utils.pdf');
        writeFileSync(out, bytes);
        expect(bytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${out}`);
    });
});

describe('Accurate Text Measurement - Visual (Consolidated)', () => {
    it('should generate a comparison page demonstrating wrapping/truncation', async () => {
        // Initialize global measurement (lightweight mock)
        const mockPdfDocument = {
            genSerial: () => 1,
            objects: { add: () => {} },
        };
        const fontSystem = new FontSystem(mockPdfDocument);
        initializeGlobalTextMeasurement(fontSystem);

        const doc = new Document();
        const page = doc.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(24),
        });

        const longText =
            'This is a longer text that demonstrates improved wrapping and truncation when using accurate font metrics.';
        const containerWidth = 260;

        const content = new Column({
            crossAxisAlignment: Flex.CrossAxisAlignment.Start,
            children: [
                new Txt('Accurate Text Measurement - Visual Comparison', {
                    style: {
                        fontSize: 16,
                        fontWeight: ThemeTypes.FontWeight.Bold,
                    },
                }),
                LayoutUtils.padded(
                    new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Start,
                        children: [
                            new Container({
                                width: containerWidth,
                                padding: Layout.EdgeInsets.all(8),
                                decoration: {
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#e74c3c'),
                                    },
                                },
                                child: new Column({
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Start,
                                    children: [
                                        new Txt('OLD (approximate) - Clip', {
                                            style: {
                                                fontSize: 9,
                                                color: PdfColor.fromHex(
                                                    '#e74c3c'
                                                ),
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                            },
                                        }),
                                        new Txt(longText, {
                                            style: {
                                                fontSize: 12,
                                                fontFamily: 'Helvetica',
                                            },
                                            softWrap: true,
                                        }),
                                    ],
                                }),
                            }),
                            new Container({
                                width: containerWidth,
                                padding: Layout.EdgeInsets.all(8),
                                decoration: {
                                    border: {
                                        width: 1,
                                        color: PdfColor.fromHex('#27ae60'),
                                    },
                                },
                                child: new Column({
                                    crossAxisAlignment:
                                        Flex.CrossAxisAlignment.Start,
                                    children: [
                                        new Txt('NEW (accurate) - Clip', {
                                            style: {
                                                fontSize: 9,
                                                color: PdfColor.fromHex(
                                                    '#27ae60'
                                                ),
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                            },
                                        }),
                                        new Txt(longText, {
                                            style: {
                                                fontSize: 12,
                                                fontFamily: 'Helvetica',
                                            },
                                            softWrap: true,
                                        }),
                                    ],
                                }),
                            }),
                        ],
                    }),
                    Layout.EdgeInsets.only({ top: 10 })
                ),
            ],
        });

        page.renderWidget(content);
        const bytes = await doc.save();
        const out = join(TEST_OUTPUT_DIR, 'visual-accurate-text.pdf');
        writeFileSync(out, bytes);
        expect(bytes.length).toBeGreaterThan(100);
        console.log(`✅ Generated: ${out}`);
    });
});
