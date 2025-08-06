/**
 * Integration Test Suite - Consolidated
 *
 * Tests system integration, performance, and end-to-end scenarios.
 * Consolidates: integration tests, performance tests, debug tests, fix verification tests
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
    TextWidget,
    Container,
    Row,
    Column,
    Stack,
    Positioned,
    Table,
    BarChart,
    LineChart,
    Theme,
    DefaultTextStyle,
    type Widget,
    WidgetUtils,
    LayoutUtils,
    FlexUtils,
    DataUtils,
    ThemeUtils,
    PrebuiltThemes,
} from '../widgets/index.js';

import { createTestLayoutContext, type TestPageFormat } from './test-utils.js';

import { Document } from '@/core/index.js';
import { Layout, Theme as ThemeTypes, Flex as FlexTypes } from '@/types.js';


describe('System Integration', () => {
    let document: Document;
    let mockLayoutContext: Layout.LayoutContext;

    beforeEach(() => {
        document = new Document();

        const mockTheme = ThemeUtils.light();
        mockLayoutContext = createTestLayoutContext({
            constraints: {
                minWidth: 0,
                maxWidth: 600,
                minHeight: 0,
                maxHeight: 800,
            },
            theme: mockTheme,
        });
    });

    describe('Full Document Generation', () => {
        it('should generate complete PDF document with mixed content', () => {
            document.addPage({
                format: 'A4' as TestPageFormat,
            });

            const content = new Theme({
                data: PrebuiltThemes.modern(),
                child: new Container({
                    padding: Layout.EdgeInsets.all(40),
                    child: new Column({
                        children: [
                            // Header
                            new Container({
                                alignment: Layout.Alignment.Center,
                                child: new TextWidget('Annual Report 2023', {
                                    style: {
                                        fontSize: 24,
                                        fontWeight: ThemeTypes.FontWeight.Bold,
                                    },
                                }),
                            }),

                            // Spacer
                            WidgetUtils.spacer(),

                            // Executive Summary
                            new DefaultTextStyle({
                                style: { fontSize: 14, lineSpacing: 1.4 },
                                child: new Column({
                                    children: [
                                        new TextWidget('Executive Summary', {
                                            style: {
                                                fontSize: 18,
                                                fontWeight:
                                                    ThemeTypes.FontWeight.Bold,
                                            },
                                        }),
                                        LayoutUtils.padded(
                                            new TextWidget(
                                                'This report presents our company performance for the fiscal year 2023, highlighting key achievements and growth metrics.'
                                            ),
                                            Layout.EdgeInsets.only({
                                                top: 10,
                                                bottom: 20,
                                            })
                                        ),
                                    ],
                                }),
                            }),

                            // Data Section
                            new Row({
                                children: [
                                    // Chart
                                    FlexUtils.expanded(
                                        new BarChart({
                                            title: 'Quarterly Performance',
                                            series: [
                                                DataUtils.createSeries(
                                                    'Revenue',
                                                    [
                                                        { x: 'Q1', y: 100000 },
                                                        { x: 'Q2', y: 120000 },
                                                        { x: 'Q3', y: 115000 },
                                                        { x: 'Q4', y: 140000 },
                                                    ]
                                                ),
                                            ],
                                            height: 200,
                                        })
                                    ),

                                    // Spacer
                                    WidgetUtils.sizedBox(20, 0),

                                    // Summary Table
                                    FlexUtils.expanded(
                                        new Table({
                                            data: [
                                                ['Metric', 'Value'],
                                                ['Total Revenue', '$475,000'],
                                                ['Growth Rate', '18.5%'],
                                                ['Market Share', '12.3%'],
                                                [
                                                    'Customer Satisfaction',
                                                    '94%',
                                                ],
                                            ],
                                            borders: {
                                                top: {
                                                    width: 1,
                                                    color: '#cccccc',
                                                },
                                                bottom: {
                                                    width: 1,
                                                    color: '#cccccc',
                                                },
                                            },
                                        })
                                    ),
                                ],
                            }),
                        ],
                    }),
                }),
            });

            const layout = content.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);

            // Test that document can handle the content
            expect(document.getPages().length).toBe(1);
        });

        it('should handle multi-page documents with consistent theming', () => {
            const theme = PrebuiltThemes.corporate();

            // Page 1 - Title Page
            document.addPage();
            const titlePage = new Theme({
                data: theme,
                child: new Container({
                    alignment: Layout.Alignment.Center,
                    child: new Column({
                        mainAxisAlignment: FlexTypes.MainAxisAlignment.Center,
                        children: [
                            new TextWidget('Company Overview', {
                                style: {
                                    fontSize: 28,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                },
                            }),
                            LayoutUtils.padded(
                                new TextWidget(
                                    'Confidential Internal Document',
                                    {
                                        style: {
                                            fontSize: 14,
                                            fontStyle:
                                                ThemeTypes.FontStyle.Italic,
                                        },
                                    }
                                ),
                                Layout.EdgeInsets.only({ top: 20 })
                            ),
                        ],
                    }),
                }),
            });

            // Page 2 - Data Page
            document.addPage();
            const dataPage = new Theme({
                data: theme,
                child: new Container({
                    padding: Layout.EdgeInsets.all(30),
                    child: new Stack({
                        children: [
                            // Main content
                            new Column({
                                children: [
                                    new TextWidget('Financial Overview', {
                                        style: {
                                            fontSize: 20,
                                            fontWeight:
                                                ThemeTypes.FontWeight.Bold,
                                        },
                                    }),
                                    LayoutUtils.padded(
                                        new LineChart({
                                            title: 'Revenue Trend',
                                            series: [
                                                DataUtils.arrayToSeries(
                                                    'Monthly Revenue',
                                                    [
                                                        95, 102, 108, 115, 122,
                                                        118, 125, 130, 128, 135,
                                                        142, 150,
                                                    ]
                                                ),
                                            ],
                                            height: 250,
                                        }),
                                        Layout.EdgeInsets.symmetric({
                                            vertical: 20,
                                        })
                                    ),
                                ],
                            }),

                            // Page number overlay
                            new Positioned({
                                bottom: 20,
                                right: 20,
                                child: new TextWidget('Page 2', {
                                    style: { fontSize: 10, color: '#666666' },
                                }),
                            }),
                        ],
                    }),
                }),
            });

            const titleLayout = titlePage.layout(mockLayoutContext);
            const dataLayout = dataPage.layout(mockLayoutContext);

            expect(titleLayout.size).toBeDefined();
            expect(dataLayout.size).toBeDefined();
            expect(document.getPages().length).toBe(2);
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle large tables efficiently', () => {
            const startTime = performance.now();

            // Generate large dataset
            const largeData = [['ID', 'Name', 'Value', 'Category', 'Status']];
            for (let i = 1; i <= 1000; i++) {
                largeData.push([
                    i.toString(),
                    `Item ${i}`,
                    (Math.random() * 1000).toFixed(2),
                    ['A', 'B', 'C'][i % 3] ?? 'A',
                    ['Active', 'Inactive'][i % 2] ?? 'Active',
                ]);
            }

            const largeTable = new Table({ data: largeData });
            const layout = largeTable.layout(mockLayoutContext);

            const endTime = performance.now();
            const processingTime = endTime - startTime;

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
            expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle complex nested layouts without performance degradation', () => {
            const startTime = performance.now();

            const complexLayout = new Container({
                child: new Column({
                    children: Array.from(
                        { length: 50 },
                        (_, i) =>
                            new Row({
                                children: [
                                    FlexUtils.flexible(
                                        new TextWidget(
                                            `Row ${i + 1} - Column 1`
                                        ),
                                        { flex: 1 }
                                    ),
                                    FlexUtils.flexible(
                                        new Container({
                                            padding: Layout.EdgeInsets.all(5),
                                            child: new TextWidget(
                                                `Row ${i + 1} - Column 2`
                                            ),
                                        }),
                                        { flex: 2 }
                                    ),
                                    FlexUtils.flexible(
                                        new Stack({
                                            children: [
                                                new TextWidget(
                                                    `Row ${i + 1} - Column 3`
                                                ),
                                                new Positioned({
                                                    top: 0,
                                                    right: 0,
                                                    child: new TextWidget('*'),
                                                }),
                                            ],
                                        }),
                                        { flex: 1 }
                                    ),
                                ],
                            })
                    ),
                }),
            });

            const layout = complexLayout.layout(mockLayoutContext);
            const endTime = performance.now();
            const processingTime = endTime - startTime;

            expect(layout.size.width).toBeGreaterThan(0);
            expect(layout.size.height).toBeGreaterThan(0);
            expect(processingTime).toBeLessThan(500); // Should be reasonably fast
        });

        it('should maintain consistent layout across multiple renders', () => {
            const widget = new Container({
                padding: Layout.EdgeInsets.all(10),
                child: new Row({
                    children: [
                        FlexUtils.flexible(new TextWidget('Consistent 1'), {
                            flex: 1,
                        }),
                        FlexUtils.flexible(new TextWidget('Consistent 2'), {
                            flex: 2,
                        }),
                        FlexUtils.flexible(new TextWidget('Consistent 3'), {
                            flex: 1,
                        }),
                    ],
                }),
            });

            const layouts: Layout.LayoutResult[] = [];
            const renderTimes: number[] = [];

            // Perform multiple renders
            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                const layout = widget.layout(mockLayoutContext);
                const endTime = performance.now();

                layouts.push(layout);
                renderTimes.push(endTime - startTime);
            }

            // All layouts should be identical
            layouts.forEach(layout => {
                expect(layout.size).toEqual(layouts[0]!.size);
                expect(layout.needsRepaint).toBe(layouts[0]!.needsRepaint);
            });

            // Render times should be consistent (no memory leaks or degradation)
            const avgTime =
                renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
            renderTimes.forEach(time => {
                expect(time).toBeLessThan(avgTime * 6); // No render should be >6x average (more tolerant)
            });
        });
    });

    describe('Error Handling and Robustness', () => {
        it('should handle invalid data gracefully', () => {
            // Test with malformed table data
            const malformedTable = new Table({
                data: [
                    ['Header 1', 'Header 2'],
                    ['Valid', 'Data'],
                    ['Another', 'Row', 'Extra Column'],
                    [], // Empty row
                ],
            });

            expect(() => {
                const layout = malformedTable.layout(mockLayoutContext);
                expect(layout.size).toBeDefined();
            }).not.toThrow();
        });

        it('should handle extreme constraint scenarios', () => {
            const widget = new TextWidget(
                'Test content for extreme constraints'
            );

            const extremeConstraints = [
                // Very small constraints
                { minWidth: 0, maxWidth: 1, minHeight: 0, maxHeight: 1 },
                // Very large constraints
                {
                    minWidth: 0,
                    maxWidth: 10000,
                    minHeight: 0,
                    maxHeight: 10000,
                },
                // Tight constraints
                { minWidth: 100, maxWidth: 100, minHeight: 50, maxHeight: 50 },
            ];

            extremeConstraints.forEach(constraints => {
                const context = { ...mockLayoutContext, constraints };
                expect(() => {
                    const layout = widget.layout(context);
                    expect(layout.size.width).toBeLessThanOrEqual(
                        constraints.maxWidth
                    );
                    expect(layout.size.height).toBeLessThanOrEqual(
                        constraints.maxHeight
                    );
                    expect(layout.size.width).toBeGreaterThanOrEqual(
                        constraints.minWidth
                    );
                    expect(layout.size.height).toBeGreaterThanOrEqual(
                        constraints.minHeight
                    );
                }).not.toThrow();
            });
        });

        it('should handle circular references and deep nesting safely', () => {
            // Test deep nesting (shouldn't cause stack overflow)
            let deepWidget: Widget = new TextWidget('Deep Content');

            for (let i = 0; i < 100; i++) {
                deepWidget = new Container({
                    padding: Layout.EdgeInsets.all(1),
                    child: deepWidget,
                });
            }

            expect(() => {
                const layout = deepWidget.layout(mockLayoutContext);
                expect(layout.size).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Real-World Use Cases', () => {
        it('should generate invoice document', () => {
            const invoiceData = [
                ['Item', 'Quantity', 'Price', 'Total'],
                ['Web Development', '40 hrs', '$75/hr', '$3,000'],
                ['Design Services', '20 hrs', '$65/hr', '$1,300'],
                ['Consulting', '10 hrs', '$85/hr', '$850'],
            ];

            const invoice = new Theme({
                data: PrebuiltThemes.minimal(),
                child: new Container({
                    padding: Layout.EdgeInsets.all(40),
                    child: new Column({
                        children: [
                            // Header
                            new Row({
                                mainAxisAlignment:
                                    FlexTypes.MainAxisAlignment.SpaceBetween,
                                children: [
                                    new TextWidget('INVOICE', {
                                        style: {
                                            fontSize: 28,
                                            fontWeight:
                                                ThemeTypes.FontWeight.Bold,
                                        },
                                    }),
                                    new Column({
                                        crossAxisAlignment:
                                            FlexTypes.CrossAxisAlignment.End,
                                        children: [
                                            new TextWidget(
                                                'Invoice #: INV-2023-001'
                                            ),
                                            new TextWidget(
                                                'Date: March 15, 2023'
                                            ),
                                            new TextWidget(
                                                'Due: April 15, 2023'
                                            ),
                                        ],
                                    }),
                                ],
                            }),

                            // Spacing
                            WidgetUtils.sizedBox(0, 40),

                            // Client Info
                            new Row({
                                children: [
                                    FlexUtils.expanded(
                                        new Column({
                                            crossAxisAlignment:
                                                FlexTypes.CrossAxisAlignment
                                                    .Start,
                                            children: [
                                                new TextWidget('From:', {
                                                    style: {
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                                new TextWidget(
                                                    'Your Company Name'
                                                ),
                                                new TextWidget(
                                                    '123 Business St.'
                                                ),
                                                new TextWidget(
                                                    'City, State 12345'
                                                ),
                                            ],
                                        })
                                    ),
                                    FlexUtils.expanded(
                                        new Column({
                                            crossAxisAlignment:
                                                FlexTypes.CrossAxisAlignment
                                                    .Start,
                                            children: [
                                                new TextWidget('To:', {
                                                    style: {
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                                new TextWidget(
                                                    'Client Company'
                                                ),
                                                new TextWidget(
                                                    '456 Client Ave.'
                                                ),
                                                new TextWidget(
                                                    'Client City, State 67890'
                                                ),
                                            ],
                                        })
                                    ),
                                ],
                            }),

                            // Spacing
                            WidgetUtils.sizedBox(0, 30),

                            // Invoice Items
                            new Table({
                                data: invoiceData,
                                borders: {
                                    top: { width: 1, color: '#000000' },
                                    bottom: { width: 1, color: '#000000' },
                                },
                            }),

                            // Spacing
                            WidgetUtils.sizedBox(0, 20),

                            // Total
                            new Row({
                                mainAxisAlignment:
                                    FlexTypes.MainAxisAlignment.End,
                                children: [
                                    new Container({
                                        padding: Layout.EdgeInsets.all(10),
                                        child: new Column({
                                            crossAxisAlignment:
                                                FlexTypes.CrossAxisAlignment
                                                    .End,
                                            children: [
                                                new TextWidget(
                                                    'Subtotal: $5,150'
                                                ),
                                                new TextWidget(
                                                    'Tax (8.5%): $437.75'
                                                ),
                                                new TextWidget(
                                                    'TOTAL: $5,587.75',
                                                    {
                                                        style: {
                                                            fontSize: 16,
                                                            fontWeight:
                                                                ThemeTypes
                                                                    .FontWeight
                                                                    .Bold,
                                                        },
                                                    }
                                                ),
                                            ],
                                        }),
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
            });

            const layout = invoice.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(400);
            expect(layout.size.height).toBeGreaterThan(300);
        });

        it('should generate dashboard report', () => {
            const dashboard = new Container({
                padding: Layout.EdgeInsets.all(20),
                child: new Column({
                    children: [
                        // Title
                        new Container({
                            alignment: Layout.Alignment.Center,
                            child: new TextWidget('Executive Dashboard', {
                                style: {
                                    fontSize: 24,
                                    fontWeight: ThemeTypes.FontWeight.Bold,
                                },
                            }),
                        }),

                        // Metrics Row
                        LayoutUtils.padded(
                            new Row({
                                mainAxisAlignment:
                                    FlexTypes.MainAxisAlignment.SpaceEvenly,
                                children: [
                                    new Container({
                                        padding: Layout.EdgeInsets.all(15),
                                        child: new Column({
                                            children: [
                                                new TextWidget('Revenue', {
                                                    style: {
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                                new TextWidget('$125,000', {
                                                    style: {
                                                        fontSize: 20,
                                                        color: '#2e7d32',
                                                    },
                                                }),
                                            ],
                                        }),
                                    }),
                                    new Container({
                                        padding: Layout.EdgeInsets.all(15),
                                        child: new Column({
                                            children: [
                                                new TextWidget('Orders', {
                                                    style: {
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                                new TextWidget('1,247', {
                                                    style: {
                                                        fontSize: 20,
                                                        color: '#1976d2',
                                                    },
                                                }),
                                            ],
                                        }),
                                    }),
                                    new Container({
                                        padding: Layout.EdgeInsets.all(15),
                                        child: new Column({
                                            children: [
                                                new TextWidget('Growth', {
                                                    style: {
                                                        fontWeight:
                                                            ThemeTypes
                                                                .FontWeight
                                                                .Bold,
                                                    },
                                                }),
                                                new TextWidget('+18.5%', {
                                                    style: {
                                                        fontSize: 20,
                                                        color: '#388e3c',
                                                    },
                                                }),
                                            ],
                                        }),
                                    }),
                                ],
                            }),
                            Layout.EdgeInsets.symmetric({ vertical: 20 })
                        ),

                        // Charts Row
                        new Row({
                            children: [
                                FlexUtils.expanded(
                                    new BarChart({
                                        title: 'Monthly Sales',
                                        series: [
                                            DataUtils.arrayToSeries(
                                                'Sales',
                                                [12, 15, 18, 22, 19, 25]
                                            ),
                                        ],
                                        height: 200,
                                    })
                                ),
                                WidgetUtils.sizedBox(20, 0),
                                FlexUtils.expanded(
                                    new LineChart({
                                        title: 'User Growth',
                                        series: [
                                            DataUtils.arrayToSeries(
                                                'Users',
                                                [
                                                    1000, 1200, 1100, 1400,
                                                    1600, 1500,
                                                ]
                                            ),
                                        ],
                                        height: 200,
                                        fill: true,
                                    })
                                ),
                            ],
                        }),
                    ],
                }),
            });

            const layout = dashboard.layout(mockLayoutContext);
            expect(layout.size.width).toBeGreaterThan(500);
            expect(layout.size.height).toBeGreaterThan(300);
        });
    });

    describe('System Stress Tests', () => {
        it('should handle memory pressure scenarios', () => {
            const widgets: Widget[] = [];

            // Create many widgets to test memory handling
            for (let i = 0; i < 1000; i++) {
                widgets.push(
                    new Container({
                        child: new TextWidget(`Widget ${i}`),
                    })
                );
            }

            // Layout all widgets
            widgets.forEach(widget => {
                const layout = widget.layout(mockLayoutContext);
                expect(layout.size).toBeDefined();
            });

            // Clear references to allow garbage collection
            widgets.length = 0;

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            expect(true).toBe(true); // Test completed without memory issues
        });

        it('should handle concurrent layout operations', async () => {
            const widgets = Array.from(
                { length: 100 },
                (_, i) =>
                    new Container({
                        child: new Row({
                            children: [
                                new TextWidget(`Concurrent ${i}`),
                                FlexUtils.flexible(
                                    new TextWidget('Flex content'),
                                    { flex: 1 }
                                ),
                            ],
                        }),
                    })
            );

            // Layout all widgets concurrently
            const layoutPromises = widgets.map(widget =>
                Promise.resolve(widget.layout(mockLayoutContext))
            );

            const results = await Promise.all(layoutPromises);

            expect(results).toHaveLength(100);
            results.forEach(result => {
                expect(result.size).toBeDefined();
                expect(result.size.width).toBeGreaterThan(0);
                expect(result.size.height).toBeGreaterThan(0);
            });
        });
    });
});
