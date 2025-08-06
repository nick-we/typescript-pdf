/**
 * MultiPage PDF Generation Tests
 *
 * These tests create actual PDF files using the MultiPage widget system
 * to validate functionality and provide visual examples.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import { describe, test, expect, beforeAll } from 'vitest';

import { Document } from '@/core/document.js';
import { Layout, Flex } from '@/types.js';
import { Table, TableColumnWidthType } from '@/widgets/data.js';
import { Column, Row } from '@/widgets/flex.js';
import { Container } from '@/widgets/layout.js';
import {
    MultiPage,
    PageBreakBehavior,
    MultiPageUtils,
} from '@/widgets/multipage.js';
import { TextWidget } from '@/widgets/text.js';

const TEST_OUTPUT_DIR = 'test-output/multipage-pdf-generation';

describe('MultiPage PDF Generation', () => {
    beforeAll(async () => {
        // Ensure output directory exists
        await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    });

    test('should generate basic multi-page PDF', async () => {
        console.log('🧪 Testing basic multi-page PDF generation...');

        const document = new Document({ verbose: false });

        // Create content that will span multiple pages
        const content = Array.from(
            { length: 25 },
            (_, i) =>
                new Container({
                    child: new Column({
                        children: [
                            new TextWidget(`Section ${i + 1}`, {
                                style: {
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#2c3e50',
                                },
                            }),
                            new TextWidget(
                                `This is content for section ${i + 1}. ` +
                                    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
                                    `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ` +
                                    `Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ` +
                                    `nisi ut aliquip ex ea commodo consequat.`,
                                {
                                    style: { fontSize: 12, lineSpacing: 1.4 },
                                }
                            ),
                        ],
                    }),
                    padding: Layout.EdgeInsets.all(16),
                    margin: Layout.EdgeInsets.only({ bottom: 20 }),
                    decoration: {
                        border: { width: 1, color: '#e0e0e0' },
                        color: '#f8f9fa',
                    },
                })
        );

        const multiPageWidget = new MultiPage({
            children: content,
            pageBreakBehavior: PageBreakBehavior.Auto,
            pageMargins: Layout.EdgeInsets.all(50),
        });

        document.addPage({
            format: 'A4',
            build: () => multiPageWidget,
        });

        const bytes = await document.save();
        const filePath = path.join(TEST_OUTPUT_DIR, 'basic-multipage.pdf');
        await fs.writeFile(filePath, bytes);

        console.log(`✅ Basic multi-page PDF generated: ${filePath}`);
        expect(bytes.length).toBeGreaterThan(1000);
    });

    test('should generate PDF with headers and footers', async () => {
        console.log('🧪 Testing multi-page PDF with headers and footers...');

        const document = new Document({ verbose: false });

        // Create content
        const content = Array.from(
            { length: 20 },
            (_, i) =>
                new Container({
                    child: new TextWidget(
                        `Page content item ${i + 1}. This content demonstrates how headers ` +
                            `and footers are rendered consistently across all pages of a multi-page document. ` +
                            `The MultiPage widget automatically handles the positioning and rendering ` +
                            `of headers and footers while managing content overflow.`,
                        {
                            style: { fontSize: 11, lineSpacing: 1.3 },
                        }
                    ),
                    padding: Layout.EdgeInsets.all(12),
                    margin: Layout.EdgeInsets.only({ bottom: 16 }),
                    decoration: {
                        border: { width: 1, color: '#dee2e6' },
                        color: '#ffffff',
                    },
                })
        );

        // Dynamic header function
        const header = (pageNum: number, totalPages: number) =>
            new Container({
                child: new Row({
                    mainAxisAlignment: Flex.MainAxisAlignment.SpaceBetween,
                    children: [
                        new TextWidget('MultiPage Test Document', {
                            style: {
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#003e50',
                            },
                        }),
                        new TextWidget(`Page ${pageNum} of ${totalPages}`, {
                            style: { fontSize: 12, color: '#00008d' },
                        }),
                    ],
                }),
                padding: Layout.EdgeInsets.symmetric({
                    horizontal: 20,
                    vertical: 10,
                }),
                decoration: {
                    border: { width: 1, color: '#bdc3c7' },
                    color: '#ecf0f1',
                },
            });

        // Static footer
        const footer = new Container({
            child: new TextWidget(
                '© 2024 TypeScript PDF - MultiPage Widget Test',
                {
                    style: { fontSize: 10, color: '#95a5a6' },
                }
            ),
            padding: Layout.EdgeInsets.all(8),
            decoration: {
                border: { width: 1, color: '#bdc3c7' },
            },
            alignment: Layout.Alignment.Center,
        });

        const multiPageWidget = new MultiPage({
            children: content,
            header,
            footer,
            pageBreakBehavior: PageBreakBehavior.Auto,
            pageMargins: Layout.EdgeInsets.all(40),
        });

        document.addPage({
            format: 'A4',
            build: () => multiPageWidget,
        });

        const bytes = document.save();
        const filePath = path.join(
            TEST_OUTPUT_DIR,
            'header-footer-multipage.pdf'
        );
        await fs.writeFile(filePath, bytes);

        console.log(`✅ Header/footer multi-page PDF generated: ${filePath}`);
        expect(bytes.length).toBeGreaterThan(1000);
    });

    test('should generate PDF with mixed content types', async () => {
        console.log('🧪 Testing multi-page PDF with mixed content types...');

        const document = new Document({ verbose: false });

        const mixedContent = [
            // Title section
            new Container({
                child: new Column({
                    children: [
                        new TextWidget('Mixed Content Report', {
                            style: {
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            'Demonstrating various widget types across pages',
                            {
                                style: { fontSize: 14, color: '#7f8c8d' },
                            }
                        ),
                    ],
                }),
                padding: Layout.EdgeInsets.all(24),
                margin: Layout.EdgeInsets.only({ bottom: 32 }),
                decoration: {
                    color: '#f8f9fa',
                    border: { width: 2, color: '#3498db' },
                },
            }),

            // Text sections
            ...Array.from(
                { length: 8 },
                (_, i) =>
                    new Container({
                        child: new Column({
                            children: [
                                new TextWidget(`Chapter ${i + 1}`, {
                                    style: {
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: '#2c3e50',
                                    },
                                }),
                                new TextWidget(
                                    `This chapter demonstrates the MultiPage widget's ability to handle ` +
                                        `mixed content types across page boundaries. Content flows naturally ` +
                                        `from one page to the next, maintaining proper spacing and formatting.`,
                                    {
                                        style: {
                                            fontSize: 12,
                                            lineSpacing: 1.5,
                                        },
                                    }
                                ),
                            ],
                        }),
                        padding: Layout.EdgeInsets.all(16),
                        margin: Layout.EdgeInsets.only({ bottom: 24 }),
                    })
            ),

            // Table example
            new Container({
                child: new Column({
                    children: [
                        new TextWidget('Performance Metrics', {
                            style: {
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#2c3e50',
                            },
                        }),
                        new Table({
                            data: [
                                ['Metric', 'Q1', 'Q2', 'Q3', 'Q4'],
                                ['Revenue', '$120K', '$135K', '$145K', '$160K'],
                                ['Users', '1,200', '1,450', '1,680', '1,920'],
                                ['Growth', '12%', '15%', '18%', '22%'],
                                [
                                    'Satisfaction',
                                    '4.2/5',
                                    '4.3/5',
                                    '4.4/5',
                                    '4.5/5',
                                ],
                            ],
                            columnWidths: [
                                { type: TableColumnWidthType.Flex, value: 2 },
                                { type: TableColumnWidthType.Flex, value: 1 },
                                { type: TableColumnWidthType.Flex, value: 1 },
                                { type: TableColumnWidthType.Flex, value: 1 },
                                { type: TableColumnWidthType.Flex, value: 1 },
                            ],
                            borders: {
                                horizontal: { width: 1, color: '#bdc3c7' },
                                vertical: { width: 1, color: '#bdc3c7' },
                                top: { width: 2, color: '#34495e' },
                                bottom: { width: 2, color: '#34495e' },
                                left: { width: 2, color: '#34495e' },
                                right: { width: 2, color: '#34495e' },
                            },
                        }),
                    ],
                }),
                margin: Layout.EdgeInsets.only({ bottom: 32 }),
            }),

            // More content to ensure page breaks
            ...Array.from(
                { length: 15 },
                (_, i) =>
                    new Container({
                        child: new TextWidget(
                            `Additional content section ${i + 1}. This section tests page break ` +
                                `behavior with mixed content types. The MultiPage widget should handle ` +
                                `the transition between different types of content seamlessly.`,
                            {
                                style: { fontSize: 11, lineSpacing: 1.4 },
                            }
                        ),
                        padding: Layout.EdgeInsets.all(12),
                        margin: Layout.EdgeInsets.only({ bottom: 16 }),
                        decoration: {
                            color: '#f8f9fa',
                            border: { width: 1, color: '#dee2e6' },
                        },
                    })
            ),
        ];

        const multiPageWidget = new MultiPage({
            children: mixedContent,
            header: (pageNum, totalPages) =>
                new TextWidget(
                    `Mixed Content Report - Page ${pageNum}/${totalPages}`,
                    {
                        style: {
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#6c757d',
                        },
                    }
                ),
            footer: new Container({
                child: new TextWidget(
                    'Generated with MultiPage Widget System',
                    {
                        style: { fontSize: 10, color: '#adb5bd' },
                    }
                ),
                alignment: Layout.Alignment.Center,
            }),
            pageBreakBehavior: PageBreakBehavior.Auto,
            pageMargins: Layout.EdgeInsets.all(60),
        });

        document.addPage({
            format: 'A4',
            build: () => multiPageWidget,
        });

        const bytes = document.save();
        const filePath = path.join(
            TEST_OUTPUT_DIR,
            'mixed-content-multipage.pdf'
        );
        await fs.writeFile(filePath, bytes);

        console.log(`✅ Mixed content multi-page PDF generated: ${filePath}`);
        expect(bytes.length).toBeGreaterThan(1000);
    });

    test('should generate PDF using MultiPageUtils.forReport', async () => {
        console.log('🧪 Testing MultiPageUtils.forReport PDF generation...');

        const document = new Document({ verbose: false });

        // Generate report content
        const reportContent = [
            // Executive Summary
            new Container({
                child: new Column({
                    children: [
                        new TextWidget('EXECUTIVE SUMMARY', {
                            style: {
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            'This report demonstrates the MultiPageUtils.forReport functionality. ' +
                                'It showcases automated report generation with proper headers, page numbers, ' +
                                'and professional formatting across multiple pages.',
                            {
                                style: { fontSize: 12, lineSpacing: 1.6 },
                            }
                        ),
                    ],
                }),
                padding: Layout.EdgeInsets.all(20),
                margin: Layout.EdgeInsets.only({ bottom: 30 }),
                decoration: {
                    color: '#e8f4fd',
                    border: { width: 2, color: '#3498db' },
                },
            }),

            // Multiple sections
            ...Array.from(
                { length: 20 },
                (_, i) =>
                    new Container({
                        child: new Column({
                            children: [
                                new TextWidget(
                                    `Section ${i + 1}: Analysis Report`,
                                    {
                                        style: {
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#34495e',
                                        },
                                    }
                                ),
                                new TextWidget(
                                    `Detailed analysis for section ${i + 1}. This section covers ` +
                                        `important findings and recommendations. The MultiPageUtils.forReport ` +
                                        `function automatically handles page layout, headers, and numbering.`,
                                    {
                                        style: {
                                            fontSize: 11,
                                            lineSpacing: 1.4,
                                        },
                                    }
                                ),
                                new Row({
                                    children: [
                                        new Container({
                                            child: new TextWidget(
                                                'Status: Complete',
                                                {
                                                    style: {
                                                        fontSize: 10,
                                                        color: '#ffffff',
                                                        fontWeight: 700,
                                                    },
                                                }
                                            ),
                                            padding:
                                                Layout.EdgeInsets.symmetric({
                                                    horizontal: 8,
                                                    vertical: 4,
                                                }),
                                            decoration: { color: '#27ae60' },
                                        }),
                                        new Container({
                                            child: new TextWidget(
                                                `Priority: ${i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low'}`,
                                                {
                                                    style: {
                                                        fontSize: 10,
                                                        color: '#ffffff',
                                                        fontWeight: 700,
                                                    },
                                                }
                                            ),
                                            padding:
                                                Layout.EdgeInsets.symmetric({
                                                    horizontal: 8,
                                                    vertical: 4,
                                                }),
                                            decoration: {
                                                color:
                                                    i % 3 === 0
                                                        ? '#e74c3c'
                                                        : i % 3 === 1
                                                          ? '#f39c12'
                                                          : '#95a5a6',
                                            },
                                            margin: Layout.EdgeInsets.only({
                                                left: 8,
                                            }),
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        padding: Layout.EdgeInsets.all(16),
                        margin: Layout.EdgeInsets.only({ bottom: 20 }),
                        decoration: {
                            border: { width: 1, color: '#e9ecef' },
                            color: '#f8f9fa',
                        },
                    })
            ),
        ];

        // Use MultiPageUtils for report-style document
        const multiPageWidget = MultiPageUtils.forReport(reportContent, {
            title: 'Q4 2024 MultiPage System Test Report',
            showPageNumbers: true,
            margins: Layout.EdgeInsets.all(50),
        });

        document.addPage({
            format: 'A4',
            build: () => multiPageWidget,
        });

        const bytes = document.save();
        const filePath = path.join(
            TEST_OUTPUT_DIR,
            'utils-report-multipage.pdf'
        );
        await fs.writeFile(filePath, bytes);

        console.log(`✅ MultiPageUtils report PDF generated: ${filePath}`);
        expect(bytes.length).toBeGreaterThan(1000);
    });

    test('should generate performance test PDF with large content', async () => {
        console.log(
            '🧪 Testing performance with large content PDF generation...'
        );

        const document = new Document({ verbose: false });
        const startTime = Date.now();

        // Generate large amount of content
        const largeContent = Array.from(
            { length: 50 },
            (_, i) =>
                new Container({
                    child: new Column({
                        children: [
                            new TextWidget(`Performance Test Item ${i + 1}`, {
                                style: {
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2c3e50',
                                },
                            }),
                            new TextWidget(
                                `This is performance test content item ${i + 1}. It contains sufficient text ` +
                                    `to test the MultiPage widget's performance with large amounts of content. ` +
                                    `The system should efficiently handle content measurement, page splitting, ` +
                                    `and rendering while maintaining good performance characteristics.`,
                                {
                                    style: { fontSize: 11, lineSpacing: 1.3 },
                                }
                            ),
                            // Add a table every 10th item
                            ...(i % 10 === 0
                                ? [
                                      new Table({
                                          data: [
                                              ['Metric', 'Value', 'Unit'],
                                              [
                                                  'Processing Time',
                                                  `${(i * 0.1).toFixed(1)}`,
                                                  'ms',
                                              ],
                                              [
                                                  'Memory Usage',
                                                  `${(45 + i * 0.5).toFixed(1)}`,
                                                  'MB',
                                              ],
                                              [
                                                  'Items Processed',
                                                  `${i + 1}`,
                                                  'count',
                                              ],
                                          ],
                                          columnWidths: [
                                              {
                                                  type: TableColumnWidthType.Flex,
                                                  value: 2,
                                              },
                                              {
                                                  type: TableColumnWidthType.Flex,
                                                  value: 1,
                                              },
                                              {
                                                  type: TableColumnWidthType.Flex,
                                                  value: 1,
                                              },
                                          ],
                                      }),
                                  ]
                                : []),
                        ],
                    }),
                    padding: Layout.EdgeInsets.all(12),
                    margin: Layout.EdgeInsets.only({ bottom: 16 }),
                    decoration: {
                        border: { width: 1, color: '#dee2e6' },
                        color: i % 10 === 0 ? '#e3f2fd' : '#ffffff',
                    },
                })
        );

        const multiPageWidget = new MultiPage({
            children: largeContent,
            header: (pageNum, totalPages) =>
                new Container({
                    child: new Row({
                        mainAxisAlignment: Flex.MainAxisAlignment.SpaceBetween,
                        children: [
                            new TextWidget('Performance Test Document', {
                                style: { fontSize: 12, fontWeight: 700 },
                            }),
                            new TextWidget(
                                `${pageNum}/${totalPages} (${largeContent.length} items)`,
                                {
                                    style: { fontSize: 10, color: '#6c757d' },
                                }
                            ),
                        ],
                    }),
                    padding: Layout.EdgeInsets.all(8),
                    decoration: { color: '#f8f9fa' },
                }),
            pageBreakBehavior: PageBreakBehavior.Auto,
            maxPages: 25, // Reasonable limit for test
        });

        document.addPage({
            format: 'A4',
            margins: Layout.EdgeInsets.all(40),
            build: () => multiPageWidget,
        });

        const layoutTime = Date.now();
        const bytes = document.save();
        const endTime = Date.now();

        const filePath = path.join(
            TEST_OUTPUT_DIR,
            'performance-test-multipage.pdf'
        );
        await fs.writeFile(filePath, bytes);

        console.log(`✅ Performance test PDF generated: ${filePath}`);
        console.log(`  - Total time: ${endTime - startTime}ms`);
        console.log(`  - Layout time: ${layoutTime - startTime}ms`);
        console.log(`  - Generation time: ${endTime - layoutTime}ms`);
        console.log(`  - Content items: ${largeContent.length}`);
        console.log(`  - PDF size: ${(bytes.length / 1024).toFixed(1)}KB`);

        expect(bytes.length).toBeGreaterThan(1000);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should list all generated PDF files', async () => {
        console.log('📋 Listing all generated MultiPage PDF files...');

        try {
            const files = await fs.readdir(TEST_OUTPUT_DIR);
            const pdfFiles = files.filter(file => file.endsWith('.pdf'));

            console.log('✅ Generated PDF files:');
            pdfFiles.forEach(file => {
                console.log(`  - ${path.join(TEST_OUTPUT_DIR, file)}`);
            });

            expect(pdfFiles.length).toBeGreaterThanOrEqual(5);
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    });
});
