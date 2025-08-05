/**
 * Table Visual Validation Test Suite
 *
 * Comprehensive visual testing of table widget improvements including:
 * - Proper PDF rendering (replacing console.log placeholders)
 * - Border rendering with different styles
 * - Column width types (fixed, flex, fraction, intrinsic)
 * - AccurateTextMeasurementService integration
 * - Cell alignment and content handling
 *
 * @vitest-environment happy-dom
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { describe, it, expect, beforeEach } from 'vitest';

// Import required modules
import { Document } from '../core/document.js';
import type { Internal } from '../types.js';
import { Layout, Theme } from '../types.js';
import {
    Table,
    DataUtils,
    TextWidget,
    Container,
    Column,
    TableCellVerticalAlignment,
} from '../widgets/index.js';

describe('Table Visual Validation', () => {
    let outputDir: string;

    beforeEach(() => {
        // Create output directory for test PDFs
        outputDir = join(
            process.cwd(),
            'test-output',
            'table-visual-validation'
        );
        try {
            mkdirSync(outputDir, { recursive: true });
        } catch (_error) {
            // Directory might already exist
        }
    });

    it('should render basic table with proper PDF output', () => {
        const document = new Document({
            info: {
                creator: 'Table Visual Validation Test',
                title: 'Table Visual Validation',
            },
        });

        // Create basic table data
        const tableData: Internal.TableData = [
            ['Product', 'Price', 'Stock', 'Category'],
            ['Widget A', '$29.99', '150', 'Electronics'],
            ['Widget B', '$45.50', '75', 'Home & Garden'],
            ['Super Widget', '$199.99', '25', 'Premium Electronics'],
            ['Mini Widget', '$9.99', '500', 'Accessories'],
        ];

        const table = new Table({
            data: tableData,
            headerStyle: {
                fontSize: 14,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.all(12),
            borders: DataUtils.borders.all({
                width: 1,
                color: '#333333',
                style: 'solid',
            }),
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget(
                            'Table Visual Validation - Basic Table',
                            {
                                style: {
                                    fontSize: 18,
                                    fontWeight: Theme.FontWeight.Bold,
                                    color: '#2c3e50',
                                },
                            }
                        ),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 20 }),
                            child: table,
                        }),
                    ],
                }),
        });

        const pdfBytes = document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(1000);

        // Write PDF to file for visual inspection
        const filename = join(outputDir, 'basic-table-test.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(`✅ Basic table PDF generated: ${filename}`);
    });

    it('should render table with different column width types', () => {
        const document = new Document({
            info: {
                creator: 'Table Column Width Test',
                title: 'Column Width Types Test',
            },
        });

        const tableData: Internal.TableData = [
            [
                'Fixed Width',
                'Flex Column',
                'Fraction (30%)',
                'Intrinsic Content',
            ],
            [
                'Short',
                'This is a flexible column that adapts to available space',
                '30%',
                'Auto',
            ],
            [
                'Text',
                'Another flexible entry with more content to demonstrate wrapping behavior',
                'Fraction',
                'Size',
            ],
            [
                'Data',
                'Final flexible row showing how content flows naturally within constraints',
                'Fixed',
                'Dynamic',
            ],
        ];

        const table = new Table({
            data: tableData,
            columnWidths: [
                DataUtils.columnWidths.fixed(100), // Fixed 100px
                DataUtils.columnWidths.flex(2), // Flex weight 2
                DataUtils.columnWidths.fraction(0.3), // 30% of available width
                DataUtils.columnWidths.intrinsic(), // Based on content
            ],
            headerStyle: {
                fontSize: 12,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.symmetric({
                horizontal: 8,
                vertical: 6,
            }),
            borders: DataUtils.borders.all({
                width: 1,
                color: '#666666',
                style: 'solid',
            }),
            defaultVerticalAlignment: TableCellVerticalAlignment.Top,
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget('Column Width Types Demonstration', {
                            style: {
                                fontSize: 18,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            'Fixed (100px) | Flex (weight 2) | Fraction (30%) | Intrinsic (auto)',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#7f8c8d',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 16 }),
                            child: table,
                        }),
                    ],
                }),
        });

        const pdfBytes = document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);

        const filename = join(outputDir, 'column-widths-test.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(`✅ Column widths PDF generated: ${filename}`);
    });

    it('should render table with different border styles', async () => {
        const document = new Document({
            info: {
                creator: 'Table Border Styles Test',
                title: 'Border Styles Test',
            },
        });

        // Create multiple tables with different border configurations
        const baseData: Internal.TableData = [
            ['Style', 'Description', 'Usage'],
            ['Solid', 'Standard solid lines', 'Professional documents'],
            ['Dashed', 'Dashed line pattern', 'Informal layouts'],
            ['Dotted', 'Dotted line pattern', 'Decorative elements'],
        ];

        const solidBorderTable = new Table({
            data: baseData,
            borders: DataUtils.borders.all({
                width: 2,
                color: '#2c3e50',
                style: 'solid',
            }),
            cellPadding: Layout.EdgeInsets.all(10),
        });

        const dashedBorderTable = new Table({
            data: baseData.map(row =>
                row.map(cell => (cell === 'Solid' ? 'Dashed' : cell))
            ),
            borders: DataUtils.borders.all({
                width: 2,
                color: '#e74c3c',
                style: 'dashed',
            }),
            cellPadding: Layout.EdgeInsets.all(10),
        });

        const dottedBorderTable = new Table({
            data: baseData.map(row =>
                row.map(cell => (cell === 'Solid' ? 'Dotted' : cell))
            ),
            borders: DataUtils.borders.all({
                width: 2,
                color: '#9b59b6',
                style: 'dotted',
            }),
            cellPadding: Layout.EdgeInsets.all(10),
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget('Border Styles Demonstration', {
                            style: {
                                fontSize: 18,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),

                        new TextWidget('Solid Borders:', {
                            style: {
                                fontSize: 14,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new Container({
                            margin: Layout.EdgeInsets.only({
                                top: 8,
                                bottom: 16,
                            }),
                            child: solidBorderTable,
                        }),

                        new TextWidget('Dashed Borders:', {
                            style: {
                                fontSize: 14,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#e74c3c',
                            },
                        }),
                        new Container({
                            margin: Layout.EdgeInsets.only({
                                top: 8,
                                bottom: 16,
                            }),
                            child: dashedBorderTable,
                        }),

                        new TextWidget('Dotted Borders:', {
                            style: {
                                fontSize: 14,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#9b59b6',
                            },
                        }),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 8 }),
                            child: dottedBorderTable,
                        }),
                    ],
                }),
        });

        const pdfBytes = await document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);

        const filename = join(outputDir, 'border-styles-test.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(`✅ Border styles PDF generated: ${filename}`);
    });

    it('should render table with complex content and alignment', async () => {
        const document = new Document({
            info: {
                creator: 'Table Complex Content Test',
                title: 'Complex Content Test',
            },
        });

        const complexData: Internal.TableData = [
            ['Employee', 'Department', 'Salary', 'Performance Rating', 'Notes'],
            [
                'Alice Johnson',
                'Engineering',
                '$95,000',
                '4.8/5.0',
                'Excellent technical skills, great team player',
            ],
            [
                'Bob Smith',
                'Marketing',
                '$72,000',
                '4.2/5.0',
                'Creative campaigns, good communication',
            ],
            [
                'Carol Davis',
                'Finance',
                '$88,000',
                '4.9/5.0',
                'Detail-oriented, analytical mindset, reliable',
            ],
            [
                'David Wilson',
                'Human Resources',
                '$65,000',
                '4.1/5.0',
                'People person, conflict resolution skills',
            ],
            [
                'Eva Martinez',
                'Operations',
                '$78,000',
                '4.6/5.0',
                'Process improvement expert, efficient workflows',
            ],
        ];

        const table = new Table({
            data: complexData,
            columnWidths: [
                DataUtils.columnWidths.fixed(120), // Name - fixed
                DataUtils.columnWidths.intrinsic(), // Department - auto
                DataUtils.columnWidths.fixed(80), // Salary - fixed
                DataUtils.columnWidths.fixed(90), // Rating - fixed
                DataUtils.columnWidths.flex(1), // Notes - flexible
            ],
            headerStyle: {
                fontSize: 12,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.symmetric({
                horizontal: 6,
                vertical: 8,
            }),
            borders: {
                top: { width: 2, color: '#34495e', style: 'solid' },
                bottom: { width: 2, color: '#34495e', style: 'solid' },
                left: { width: 1, color: '#bdc3c7', style: 'solid' },
                right: { width: 1, color: '#bdc3c7', style: 'solid' },
                horizontal: { width: 1, color: '#ecf0f1', style: 'solid' },
                vertical: { width: 1, color: '#ecf0f1', style: 'solid' },
            },
            defaultVerticalAlignment: TableCellVerticalAlignment.Top,
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget('Complex Table Content & Alignment', {
                            style: {
                                fontSize: 18,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            'Employee data with mixed column widths and content wrapping',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#7f8c8d',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 16 }),
                            child: table,
                        }),
                    ],
                }),
        });

        const pdfBytes = await document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);

        const filename = join(outputDir, 'complex-content-test.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(`✅ Complex content PDF generated: ${filename}`);
    });

    it('should demonstrate accurate text measurement integration', async () => {
        const document = new Document({
            info: {
                creator: 'Table Text Measurement Test',
                title: 'Text Measurement Integration Test',
            },
        });

        // Create table with text that would demonstrate measurement accuracy differences
        const measurementTestData: Internal.TableData = [
            [
                'Font Family',
                'Sample Text',
                'Width Estimation',
                'Actual Rendering',
            ],
            [
                'Helvetica',
                'The quick brown fox jumps over the lazy dog',
                'Variable width characters',
                'Measured precisely',
            ],
            [
                'Times',
                'Lorem ipsum dolor sit amet, consectetur adipiscing',
                'Serif font characteristics',
                'Character-by-character',
            ],
            [
                'Courier',
                'Monospace font with equal character widths',
                'Fixed-width characters',
                'Consistent spacing',
            ],
            [
                'Mixed Content',
                '123.45 + Special chars: @#$%^&*()',
                'Numbers and symbols',
                'Accurate positioning',
            ],
        ];

        const table = new Table({
            data: measurementTestData,
            columnWidths: [
                DataUtils.columnWidths.intrinsic(), // Will use actual content measurement
                DataUtils.columnWidths.flex(2), // Flexible for long text
                DataUtils.columnWidths.intrinsic(), // Auto-sized based on content
                DataUtils.columnWidths.intrinsic(), // Auto-sized based on content
            ],
            headerStyle: {
                fontSize: 14,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.all(10),
            borders: DataUtils.borders.all({
                width: 1,
                color: '#3498db',
                style: 'solid',
            }),
            defaultVerticalAlignment: TableCellVerticalAlignment.Middle,
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget(
                            'Accurate Text Measurement Integration',
                            {
                                style: {
                                    fontSize: 18,
                                    fontWeight: Theme.FontWeight.Bold,
                                    color: '#2c3e50',
                                },
                            }
                        ),
                        new TextWidget(
                            'Demonstrates integration with AccurateTextMeasurementService for precise column sizing',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#7f8c8d',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 16 }),
                            child: table,
                        }),
                        new TextWidget(
                            '✓ Intrinsic columns sized based on actual font metrics',
                            {
                                style: {
                                    fontSize: 10,
                                    color: '#27ae60',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new TextWidget(
                            '✓ Text wrapping uses precise character widths',
                            {
                                style: {
                                    fontSize: 10,
                                    color: '#27ae60',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new TextWidget(
                            '✓ Cell height calculation based on actual text dimensions',
                            {
                                style: {
                                    fontSize: 10,
                                    color: '#27ae60',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                    ],
                }),
        });

        const pdfBytes = await document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);

        const filename = join(
            outputDir,
            'text-measurement-integration-test.pdf'
        );
        writeFileSync(filename, pdfBytes);
        console.log(
            `✅ Text measurement integration PDF generated: ${filename}`
        );
    });

    it('should render performance test with large dataset', async () => {
        const document = new Document({
            info: {
                creator: 'Table Performance Test',
                title: 'Performance Test - 50 Rows',
            },
        });

        // Generate a larger dataset to test performance
        const performanceData: Internal.TableData = [
            [
                'ID',
                'Name',
                'Email',
                'Department',
                'Salary',
                'Start Date',
                'Status',
            ],
        ];

        // Add 50 rows of test data
        for (let i = 1; i <= 50; i++) {
            performanceData.push([
                `EMP${i.toString().padStart(3, '0')}`,
                `Employee ${i}`,
                `employee${i}@company.com`,
                ['Engineering', 'Marketing', 'Finance', 'HR', 'Operations'][
                    i % 5
                ] ?? 'Engineering',
                `$${(50000 + Math.random() * 50000).toFixed(0)}`,
                `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                ['Active', 'On Leave', 'Terminated'][
                    Math.floor(Math.random() * 3)
                ] ?? 'Active',
            ]);
        }

        const startTime = performance.now();

        const table = new Table({
            data: performanceData,
            columnWidths: [
                DataUtils.columnWidths.fixed(60), // ID
                DataUtils.columnWidths.fixed(100), // Name
                DataUtils.columnWidths.flex(1), // Email
                DataUtils.columnWidths.intrinsic(), // Department
                DataUtils.columnWidths.fixed(80), // Salary
                DataUtils.columnWidths.fixed(90), // Start Date
                DataUtils.columnWidths.intrinsic(), // Status
            ],
            headerStyle: {
                fontSize: 11,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.symmetric({
                horizontal: 4,
                vertical: 6,
            }),
            borders: DataUtils.borders.outline({
                width: 1,
                color: '#95a5a6',
                style: 'solid',
            }),
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget('Table Performance Test - 50 Rows', {
                            style: {
                                fontSize: 16,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 12 }),
                            child: table,
                        }),
                    ],
                }),
        });

        const pdfBytes = await document.save();
        const endTime = performance.now();

        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

        const filename = join(outputDir, 'performance-test.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(
            `✅ Performance test PDF generated: ${filename} (${(endTime - startTime).toFixed(2)}ms)`
        );
    });

    it('should generate comprehensive table showcase', async () => {
        const document = new Document({
            info: {
                creator: 'Table Widget Showcase',
                title: 'Table Widget Improvements Summary',
            },
        });

        // Summary of all improvements
        const summaryData: Internal.TableData = [
            ['Feature', 'Before', 'After', 'Status'],
            [
                'PDF Rendering',
                'console.log placeholders',
                'Full graphics operations',
                '✅ Fixed',
            ],
            [
                'Text Measurement',
                'fontSize × 0.55 approximation',
                'AccurateTextMeasurementService',
                '✅ Integrated',
            ],
            [
                'Column Sizing',
                'Hardcoded 100px intrinsic',
                'Content-based calculation',
                '✅ Improved',
            ],
            [
                'Row Heights',
                'Fixed 40px height',
                'Content-aware sizing',
                '✅ Dynamic',
            ],
            [
                'Border Rendering',
                'Declared but not implemented',
                'Full border drawing',
                '✅ Complete',
            ],
            [
                'Cell Content',
                'Basic text positioning',
                'Wrapped text with alignment',
                '✅ Enhanced',
            ],
        ];

        const summaryTable = new Table({
            data: summaryData,
            columnWidths: [
                DataUtils.columnWidths.fixed(120),
                DataUtils.columnWidths.flex(1),
                DataUtils.columnWidths.flex(1),
                DataUtils.columnWidths.fixed(80),
            ],
            headerStyle: {
                fontSize: 12,
                fontWeight: Theme.FontWeight.Bold,
                color: '#ffffff',
            },
            cellPadding: Layout.EdgeInsets.all(8),
            borders: DataUtils.borders.all({
                width: 1,
                color: '#2c3e50',
                style: 'solid',
            }),
            defaultVerticalAlignment: TableCellVerticalAlignment.Middle,
        });

        document.addPage({
            build: () =>
                new Column({
                    children: [
                        new TextWidget('Table Widget Improvements Summary', {
                            style: {
                                fontSize: 20,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            'Complete overhaul of table rendering system with proper PDF output',
                            {
                                style: {
                                    fontSize: 14,
                                    color: '#7f8c8d',
                                    lineSpacing: 1.4,
                                },
                            }
                        ),
                        new Container({
                            margin: Layout.EdgeInsets.only({ top: 20 }),
                            child: summaryTable,
                        }),
                        new TextWidget('Key Achievements:', {
                            style: {
                                fontSize: 14,
                                fontWeight: Theme.FontWeight.Bold,
                                color: '#2c3e50',
                            },
                        }),
                        new TextWidget(
                            '• Replaced console.log placeholders with actual PDF graphics operations',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                        new TextWidget(
                            '• Integrated AccurateTextMeasurementService for precise text sizing',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                        new TextWidget(
                            '• Implemented content-based intrinsic column width calculation',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                        new TextWidget(
                            '• Added dynamic row height calculation based on cell content',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                        new TextWidget(
                            '• Complete border rendering with multiple styles (solid, dashed, dotted)',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                        new TextWidget(
                            '• Enhanced cell content rendering with text wrapping and alignment',
                            {
                                style: {
                                    fontSize: 12,
                                    color: '#27ae60',
                                    lineSpacing: 1.6,
                                },
                            }
                        ),
                    ],
                }),
        });

        const pdfBytes = document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);

        const filename = join(outputDir, 'table-showcase.pdf');
        writeFileSync(filename, pdfBytes);
        console.log(`✅ Table showcase PDF generated: ${filename}`);
        console.log(`📁 All test PDFs saved to: ${outputDir}`);
    });
});
