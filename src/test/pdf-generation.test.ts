/**
 * PDF Generation Visual Validation Tests
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

import { Document, PdfColor } from '@/core/index.js';
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
    Theme,
    PrebuiltThemes,
    LayoutUtils,
    FlexUtils,
    DataUtils,
    TextAlign,
    BarOrientation,
} from '@/widgets/index.js';

// Test output directory
const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output');

// Ensure output directory exists
try {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
} catch (_e) {
    // Directory already exists
}

describe('PDF Generation Visual Validation', () => {
    describe('Container and Layout Tests', () => {
        it('should generate nested containers with background colors', async () => {
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
                    color: PdfColor.fromHex('#f0f0f0'), // Light gray background
                    border: { width: 2, color: PdfColor.fromHex('#333333') },
                },
                padding: Layout.EdgeInsets.all(20),
                child: new Column({
                    mainAxisAlignment: Flex.MainAxisAlignment.SpaceEvenly,
                    children: [
                        // Red container with centered text
                        new Container({
                            width: 460,
                            height: 120,
                            decoration: {
                                color: PdfColor.fromHex('#ff6b6b'), // Red
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

                        // Blue container with padding
                        new Container({
                            width: 460,
                            height: 120,
                            decoration: {
                                color: PdfColor.fromHex('#4dabf7'), // Blue
                                borderRadius: {
                                    topLeft: 15,
                                    topRight: 15,
                                    bottomLeft: 15,
                                    bottomRight: 15,
                                },
                            },
                            padding: Layout.EdgeInsets.all(15),
                            child: new Txt(
                                'Blue Container with Padding\nMultiple lines of text\nto test layout',
                                {
                                    style: {
                                        fontSize: 14,
                                        color: PdfColor.fromHex('#ffffff'),
                                        lineSpacing: 1.4,
                                    },
                                    textAlign: TextAlign.Center,
                                }
                            ),
                        }),

                        // Green container with nested layout
                        new Container({
                            width: 460,
                            height: 120,
                            decoration: {
                                color: PdfColor.fromHex('#51cf66'), // Green
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
                                crossAxisAlignment:
                                    Flex.CrossAxisAlignment.Center,
                                children: [
                                    new Txt('Left', {
                                        style: {
                                            fontSize: 16,
                                            fontWeight:
                                                ThemeTypes.FontWeight.Bold,
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
                                                color: PdfColor.fromHex(
                                                    '#51cf66'
                                                ),
                                            },
                                        }),
                                    }),
                                    new Txt('Right', {
                                        style: {
                                            fontSize: 16,
                                            fontWeight:
                                                ThemeTypes.FontWeight.Bold,
                                            color: PdfColor.fromHex('#ffffff'),
                                        },
                                    }),
                                ],
                            }),
                        }),

                        // Purple container with stack layout
                        new Container({
                            width: 460,
                            height: 120,
                            decoration: {
                                color: PdfColor.fromHex('#9775fa'), // Purple
                                borderRadius: {
                                    topLeft: 12,
                                    topRight: 12,
                                    bottomLeft: 12,
                                    bottomRight: 12,
                                },
                            },
                            child: new Stack({
                                children: [
                                    // Background text
                                    new Container({
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Stack Layout', {
                                            style: {
                                                fontSize: 24,
                                                color: PdfColor.fromHex(
                                                    '#ffffff'
                                                ),
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                            },
                                        }),
                                    }),
                                    // Top-right badge
                                    new Positioned({
                                        top: 10,
                                        right: 10,
                                        child: new Container({
                                            width: 30,
                                            height: 30,
                                            decoration: {
                                                color: PdfColor.fromHex(
                                                    '#f03e3e'
                                                ),
                                                borderRadius: {
                                                    topLeft: 15,
                                                    topRight: 15,
                                                    bottomLeft: 15,
                                                    bottomRight: 15,
                                                },
                                            },
                                            alignment: Layout.Alignment.Center,
                                            child: new Txt('!', {
                                                style: {
                                                    fontSize: 18,
                                                    color: PdfColor.fromHex(
                                                        '#ffffff'
                                                    ),
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
                                                },
                                            }),
                                        }),
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            });

            // Build and save PDF
            page.renderWidget(content);
            const pdfBytes = await doc.save();

            const outputPath = join(
                TEST_OUTPUT_DIR,
                'containers-with-backgrounds.pdf'
            );
            writeFileSync(outputPath, pdfBytes);

            expect(pdfBytes.length).toBeGreaterThan(1000);
            console.log(`✅ Generated: ${outputPath}`);
        });

        it('should generate data visualization with tables and charts', async () => {
            const doc = new Document();

            const page = doc.addPage({
                format: 'A4',
                margins: Layout.EdgeInsets.all(25),
            });

            // Sample data
            const salesData = [
                ['Month', 'Revenue', 'Orders', 'Growth'],
                ['January', '$45,200', '234', '+12%'],
                ['February', '$52,100', '267', '+15%'],
                ['March', '$48,900', '251', '+8%'],
                ['April', '$59,300', '298', '+21%'],
                ['May', '$61,800', '312', '+4%'],
                ['June', '$67,500', '345', '+9%'],
            ];

            const chartSeries = [
                DataUtils.createSeries('Revenue', [
                    { x: 'Jan', y: 45200 },
                    { x: 'Feb', y: 52100 },
                    { x: 'Mar', y: 48900 },
                    { x: 'Apr', y: 59300 },
                    { x: 'May', y: 61800 },
                    { x: 'Jun', y: 67500 },
                ]),
            ];

            const content = new Container({
                padding: Layout.EdgeInsets.all(20),
                child: new Column({
                    children: [
                        // Title
                        new Container({
                            alignment: Layout.Alignment.Center,
                            child: new Txt('Sales Dashboard', {
                                style: {
                                    fontSize: 26,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                    color: PdfColor.fromHex('#2c3e50'),
                                },
                            }),
                        }),

                        LayoutUtils.padded(
                            new Row({
                                children: [
                                    // Table on the left
                                    FlexUtils.expanded(
                                        new Container({
                                            padding: Layout.EdgeInsets.all(10),
                                            decoration: {
                                                color: PdfColor.fromHex(
                                                    '#f8f9fa'
                                                ),
                                                borderRadius: {
                                                    topLeft: 8,
                                                    topRight: 8,
                                                    bottomLeft: 8,
                                                    bottomRight: 8,
                                                },
                                                border: {
                                                    width: 1,
                                                    color: PdfColor.fromHex(
                                                        '#dee2e6'
                                                    ),
                                                },
                                            },
                                            child: new Column({
                                                children: [
                                                    new Txt('Sales Data', {
                                                        style: {
                                                            fontSize: 16,
                                                            fontWeight:
                                                                ThemeTypes
                                                                    .FontWeight
                                                                    .Bold,
                                                            color: PdfColor.fromHex(
                                                                '#495057'
                                                            ),
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
                                                                DataUtils.columnWidths.flex(
                                                                    1
                                                                ),
                                                                DataUtils.columnWidths.fixed(
                                                                    60
                                                                ),
                                                                DataUtils.columnWidths.fixed(
                                                                    50
                                                                ),
                                                            ],
                                                        }),
                                                        Layout.EdgeInsets.only({
                                                            top: 10,
                                                        })
                                                    ),
                                                ],
                                            }),
                                        })
                                    ),

                                    LayoutUtils.padded(
                                        FlexUtils.expanded(
                                            new Container({
                                                padding:
                                                    Layout.EdgeInsets.all(10),
                                                decoration: {
                                                    color: PdfColor.fromHex(
                                                        '#f8f9fa'
                                                    ),
                                                    borderRadius: {
                                                        topLeft: 8,
                                                        topRight: 8,
                                                        bottomLeft: 8,
                                                        bottomRight: 8,
                                                    },
                                                    border: {
                                                        width: 1,
                                                        color: PdfColor.fromHex(
                                                            '#dee2e6'
                                                        ),
                                                    },
                                                },
                                                child: new Column({
                                                    children: [
                                                        new Txt(
                                                            'Revenue Trend',
                                                            {
                                                                style: {
                                                                    fontSize: 16,
                                                                    fontWeight:
                                                                        ThemeTypes
                                                                            .FontWeight
                                                                            .Bold,
                                                                    color: PdfColor.fromHex(
                                                                        '#495057'
                                                                    ),
                                                                },
                                                            }
                                                        ),
                                                        LayoutUtils.padded(
                                                            new BarChart({
                                                                title: 'Monthly Revenue',
                                                                series: chartSeries,
                                                                height: 200,
                                                                orientation:
                                                                    BarOrientation.Vertical,
                                                            }),
                                                            Layout.EdgeInsets.only(
                                                                { top: 10 }
                                                            )
                                                        ),
                                                    ],
                                                }),
                                            })
                                        ),
                                        Layout.EdgeInsets.only({ left: 20 })
                                    ),
                                ],
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
                                                    color: PdfColor.fromHex(
                                                        '#666'
                                                    ),
                                                },
                                            }),
                                            new Txt('$334,800', {
                                                style: {
                                                    fontSize: 20,
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
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
                                            new Txt('Total Orders', {
                                                style: {
                                                    fontSize: 12,
                                                    color: PdfColor.fromHex(
                                                        '#666'
                                                    ),
                                                },
                                            }),
                                            new Txt('1,707', {
                                                style: {
                                                    fontSize: 20,
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
                                                    color: PdfColor.fromHex(
                                                        '#388e3c'
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
                                                    color: PdfColor.fromHex(
                                                        '#666'
                                                    ),
                                                },
                                            }),
                                            new Txt('+11.5%', {
                                                style: {
                                                    fontSize: 20,
                                                    fontWeight:
                                                        ThemeTypes.FontWeight
                                                            .Bold,
                                                    color: PdfColor.fromHex(
                                                        '#f57c00'
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

            const outputPath = join(TEST_OUTPUT_DIR, 'data-visualization.pdf');
            writeFileSync(outputPath, pdfBytes);

            expect(pdfBytes.length).toBeGreaterThan(1000);
            console.log(`✅ Generated: ${outputPath}`);
        });

        it('should generate themed document showcase', async () => {
            const doc = new Document();

            const page = doc.addPage({
                format: 'A4',
                margins: Layout.EdgeInsets.all(20),
            });

            const content = new Theme({
                data: PrebuiltThemes.modern(),
                child: new Container({
                    padding: Layout.EdgeInsets.all(30),
                    decoration: {
                        color: PdfColor.fromHex('#ffffff'),
                        border: {
                            width: 2,
                            color: PdfColor.fromHex('#6c5ce7'),
                        },
                    },
                    child: new Column({
                        crossAxisAlignment: Flex.CrossAxisAlignment.Stretch,
                        children: [
                            // Modern header with gradient effect simulation
                            new Container({
                                height: 80,
                                decoration: {
                                    color: PdfColor.fromHex('#6c5ce7'), // Modern purple
                                    borderRadius: {
                                        topLeft: 12,
                                        topRight: 12,
                                        bottomLeft: 12,
                                        bottomRight: 12,
                                    },
                                },
                                child: new Stack({
                                    children: [
                                        new Container({
                                            alignment: Layout.Alignment.Center,
                                            child: new Txt(
                                                'Modern Theme Showcase',
                                                {
                                                    style: {
                                                        fontSize: 24,
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                        color: PdfColor.fromHex(
                                                            '#ffffff'
                                                        ),
                                                    },
                                                }
                                            ),
                                        }),
                                        new Positioned({
                                            top: 15,
                                            right: 20,
                                            child: new Container({
                                                width: 50,
                                                height: 50,
                                                decoration: {
                                                    color: PdfColor.fromHex(
                                                        '#a29bfe'
                                                    ),
                                                    borderRadius: {
                                                        topLeft: 25,
                                                        topRight: 25,
                                                        bottomLeft: 25,
                                                        bottomRight: 25,
                                                    },
                                                },
                                                alignment:
                                                    Layout.Alignment.Center,
                                                child: new Txt('✓', {
                                                    style: {
                                                        fontSize: 20,
                                                        color: PdfColor.fromHex(
                                                            '#ffffff'
                                                        ),
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                            }),
                                        }),
                                    ],
                                }),
                            }),

                            // Content sections
                            LayoutUtils.padded(
                                new Row({
                                    children: [
                                        FlexUtils.expanded(
                                            new Container({
                                                padding:
                                                    Layout.EdgeInsets.all(20),
                                                decoration: {
                                                    color: PdfColor.fromHex(
                                                        '#f8f9ff'
                                                    ),
                                                    borderRadius: {
                                                        topLeft: 8,
                                                        topRight: 8,
                                                        bottomLeft: 8,
                                                        bottomRight: 8,
                                                    },
                                                    border: {
                                                        width: 1,
                                                        color: PdfColor.fromHex(
                                                            '#e0e0ff'
                                                        ),
                                                    },
                                                },
                                                child: new Column({
                                                    crossAxisAlignment:
                                                        Flex.CrossAxisAlignment
                                                            .Start,
                                                    children: [
                                                        new Txt('Features', {
                                                            style: {
                                                                fontSize: 18,
                                                                fontWeight:
                                                                    ThemeTypes
                                                                        .FontWeight
                                                                        .Bold,
                                                                color: PdfColor.fromHex(
                                                                    '#6c5ce7'
                                                                ),
                                                            },
                                                        }),
                                                        LayoutUtils.padded(
                                                            new Column({
                                                                crossAxisAlignment:
                                                                    Flex
                                                                        .CrossAxisAlignment
                                                                        .Start,
                                                                children: [
                                                                    new Txt(
                                                                        '• Modern color palette',
                                                                        {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: PdfColor.fromHex(
                                                                                    '#2d3436'
                                                                                ),
                                                                            },
                                                                        }
                                                                    ),
                                                                    new Txt(
                                                                        '• Rounded corners',
                                                                        {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: PdfColor.fromHex(
                                                                                    '#2d3436'
                                                                                ),
                                                                            },
                                                                        }
                                                                    ),
                                                                    new Txt(
                                                                        '• Clean typography',
                                                                        {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: PdfColor.fromHex(
                                                                                    '#2d3436'
                                                                                ),
                                                                            },
                                                                        }
                                                                    ),
                                                                    new Txt(
                                                                        '• Professional layout',
                                                                        {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: PdfColor.fromHex(
                                                                                    '#2d3436'
                                                                                ),
                                                                            },
                                                                        }
                                                                    ),
                                                                ],
                                                            }),
                                                            Layout.EdgeInsets.only(
                                                                { top: 10 }
                                                            )
                                                        ),
                                                    ],
                                                }),
                                            })
                                        ),

                                        LayoutUtils.padded(
                                            FlexUtils.expanded(
                                                new Container({
                                                    padding:
                                                        Layout.EdgeInsets.all(
                                                            20
                                                        ),
                                                    decoration: {
                                                        color: PdfColor.fromHex(
                                                            '#fff5f5'
                                                        ),
                                                        borderRadius: {
                                                            topLeft: 8,
                                                            topRight: 8,
                                                            bottomLeft: 8,
                                                            bottomRight: 8,
                                                        },
                                                        border: {
                                                            width: 1,
                                                            color: PdfColor.fromHex(
                                                                '#ffebee'
                                                            ),
                                                        },
                                                    },
                                                    child: new Column({
                                                        crossAxisAlignment:
                                                            Flex
                                                                .CrossAxisAlignment
                                                                .Start,
                                                        children: [
                                                            new Txt(
                                                                'Statistics',
                                                                {
                                                                    style: {
                                                                        fontSize: 18,
                                                                        fontWeight:
                                                                            ThemeTypes
                                                                                .FontWeight
                                                                                .Bold,
                                                                        color: PdfColor.fromHex(
                                                                            '#e17055'
                                                                        ),
                                                                    },
                                                                }
                                                            ),
                                                            LayoutUtils.padded(
                                                                new Column({
                                                                    children: [
                                                                        new Row(
                                                                            {
                                                                                mainAxisAlignment:
                                                                                    Flex
                                                                                        .MainAxisAlignment
                                                                                        .SpaceBetween,
                                                                                children:
                                                                                    [
                                                                                        new Txt(
                                                                                            'Users:',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#2d3436'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                        new Txt(
                                                                                            '12,547',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    fontWeight:
                                                                                                        ThemeTypes
                                                                                                            .FontWeight
                                                                                                            .Bold,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#00b894'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                    ],
                                                                            }
                                                                        ),
                                                                        new Row(
                                                                            {
                                                                                mainAxisAlignment:
                                                                                    Flex
                                                                                        .MainAxisAlignment
                                                                                        .SpaceBetween,
                                                                                children:
                                                                                    [
                                                                                        new Txt(
                                                                                            'Revenue:',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#2d3436'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                        new Txt(
                                                                                            '$89,432',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    fontWeight:
                                                                                                        ThemeTypes
                                                                                                            .FontWeight
                                                                                                            .Bold,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#00b894'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                    ],
                                                                            }
                                                                        ),
                                                                        new Row(
                                                                            {
                                                                                mainAxisAlignment:
                                                                                    Flex
                                                                                        .MainAxisAlignment
                                                                                        .SpaceBetween,
                                                                                children:
                                                                                    [
                                                                                        new Txt(
                                                                                            'Growth:',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#2d3436'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                        new Txt(
                                                                                            '+24%',
                                                                                            {
                                                                                                style: {
                                                                                                    fontSize: 12,
                                                                                                    fontWeight:
                                                                                                        ThemeTypes
                                                                                                            .FontWeight
                                                                                                            .Bold,
                                                                                                    color: PdfColor.fromHex(
                                                                                                        '#00b894'
                                                                                                    ),
                                                                                                },
                                                                                            }
                                                                                        ),
                                                                                    ],
                                                                            }
                                                                        ),
                                                                    ],
                                                                }),
                                                                Layout.EdgeInsets.only(
                                                                    { top: 10 }
                                                                )
                                                            ),
                                                        ],
                                                    }),
                                                })
                                            ),
                                            Layout.EdgeInsets.only({ left: 15 })
                                        ),
                                    ],
                                }),
                                Layout.EdgeInsets.symmetric({ vertical: 20 })
                            ),

                            // Action buttons simulation
                            new Row({
                                mainAxisAlignment:
                                    Flex.MainAxisAlignment.SpaceEvenly,
                                children: [
                                    new Container({
                                        width: 120,
                                        height: 40,
                                        decoration: {
                                            color: PdfColor.fromHex('#6c5ce7'),
                                            borderRadius: {
                                                topLeft: 20,
                                                topRight: 20,
                                                bottomLeft: 20,
                                                bottomRight: 20,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Primary', {
                                            style: {
                                                fontSize: 14,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex(
                                                    '#ffffff'
                                                ),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 120,
                                        height: 40,
                                        decoration: {
                                            color: PdfColor.fromHex('#ffffff'),
                                            borderRadius: {
                                                topLeft: 20,
                                                topRight: 20,
                                                bottomLeft: 20,
                                                bottomRight: 20,
                                            },
                                            border: {
                                                width: 2,
                                                color: PdfColor.fromHex(
                                                    '#6c5ce7'
                                                ),
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Secondary', {
                                            style: {
                                                fontSize: 14,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                                color: PdfColor.fromHex(
                                                    '#6c5ce7'
                                                ),
                                            },
                                        }),
                                    }),
                                    new Container({
                                        width: 120,
                                        height: 40,
                                        decoration: {
                                            color: PdfColor.fromHex('#ddd6fe'),
                                            borderRadius: {
                                                topLeft: 20,
                                                topRight: 20,
                                                bottomLeft: 20,
                                                bottomRight: 20,
                                            },
                                        },
                                        alignment: Layout.Alignment.Center,
                                        child: new Txt('Disabled', {
                                            style: {
                                                fontSize: 14,
                                                color: PdfColor.fromHex(
                                                    '#a78bfa'
                                                ),
                                            },
                                        }),
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
            });

            page.renderWidget(content);
            const pdfBytes = doc.save();

            const outputPath = join(TEST_OUTPUT_DIR, 'themed-showcase.pdf');
            writeFileSync(outputPath, pdfBytes);

            expect(pdfBytes.length).toBeGreaterThan(1000);
            console.log(`✅ Generated: ${outputPath}`);
        });
    });
});
