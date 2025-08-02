/**
 * Table widget tests
 * 
 * Comprehensive test suite for table functionality including:
 * - Basic table creation and layout
 * - Column width strategies
 * - Table borders and styling
 * - Header row functionality
 * - Page spanning capabilities
 * 
 * @packageDocumentation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
    Table,
    TableRow,
    TableBorders,
    TableHelpers,
    FixedColumnWidth,
    FlexColumnWidth,
    IntrinsicColumnWidth,
    FractionColumnWidth,
    TableCellVerticalAlignment,
    TableWidth,
    createTable,
    createTableRow,
    type TableColumnWidth,
} from '../widgets/table.js';
import { TableHelper } from '../widgets/table-helper.js';
import { Text } from '../widgets/text.js';
import { Container } from '../widgets/container.js';
import { BoxConstraints, EdgeInsets as EdgeInsetsUtils, TextDirection, defaultTheme } from '../types/layout.js';
import type { LayoutContext, PaintContext } from '../types/layout.js';
import { FontWeight } from '../types/theming.js';
import { PdfColor } from '@/core/pdf/color.js';

describe('Table Widget', () => {
    let layoutContext: LayoutContext;
    let paintContext: PaintContext;

    beforeEach(() => {
        layoutContext = {
            constraints: BoxConstraints.loose({ width: 800, height: 600 }),
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        paintContext = {
            graphics: {
                saveContext: () => { },
                restoreContext: () => { },
                setColor: () => { },
                setFillColor: () => { },
                setStrokeColor: () => { },
                clipPath: () => { },
                setLineWidth: () => { },
                drawLine: () => { },
                drawRect: () => { },
                strokePath: () => { },
                fillPath: () => { },
                setTransform: () => { },
                beginText: () => { },
                endText: () => { },
                moveTextPosition: () => { },
                showText: () => { },
                setFont: () => { },
                drawString: (font: any, fontSize: number, text: string, x: number, y: number, options: any) => { },
            } as any,
            size: { width: 800, height: 600 },
            theme: defaultTheme,
        };
    });

    describe('Basic Table Creation', () => {
        test('should create empty table', () => {
            const table = new Table();
            expect(table).toBeDefined();

            const result = table.layout(layoutContext);
            expect(result.size.width).toBe(0);
            expect(result.size.height).toBe(0);
        });

        test('should create table with convenience function', () => {
            const table = createTable({
                children: [
                    createTableRow({
                        children: [new Text('Cell 1'), new Text('Cell 2')],
                    }),
                ],
            });

            expect(table).toBeInstanceOf(Table);
            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle single row table', () => {
            const table = new Table({
                children: [
                    new TableRow({
                        children: [
                            new Container({
                                child: new Text('A'),
                                padding: EdgeInsetsUtils.all(8),
                            }),
                            new Container({
                                child: new Text('B'),
                                padding: EdgeInsetsUtils.all(8),
                            }),
                        ],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
            expect(result.needsRepaint).toBe(true);
        });

        test('should handle multiple row table', () => {
            const table = new Table({
                children: [
                    new TableRow({
                        children: [new Text('A1'), new Text('B1')],
                    }),
                    new TableRow({
                        children: [new Text('A2'), new Text('B2')],
                    }),
                    new TableRow({
                        children: [new Text('A3'), new Text('B3')],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Column Width Strategies', () => {
        test('FixedColumnWidth should use specified width', () => {
            const fixedWidth = new FixedColumnWidth(100);
            const layout = fixedWidth.layout(new Text('Test'), layoutContext, layoutContext.constraints);

            expect(layout.width).toBe(100);
            expect(layout.flex).toBe(0);
        });

        test('FlexColumnWidth should use flex value', () => {
            const flexWidth = new FlexColumnWidth(2.0);
            const layout = flexWidth.layout(new Text('Test'), layoutContext, layoutContext.constraints);

            expect(layout.width).toBe(0);
            expect(layout.flex).toBe(2.0);
        });

        test('IntrinsicColumnWidth should calculate content width', () => {
            const intrinsicWidth = new IntrinsicColumnWidth();
            const layout = intrinsicWidth.layout(new Text('Test Content'), layoutContext, layoutContext.constraints);

            expect(layout.width).toBeGreaterThan(0);
            expect(layout.flex).toBeGreaterThanOrEqual(0);
        });

        test('FractionColumnWidth should use percentage of total width', () => {
            const fractionWidth = new FractionColumnWidth(0.3);
            const constraints = { ...layoutContext.constraints, maxWidth: 600 };
            const layout = fractionWidth.layout(new Text('Test'), layoutContext, constraints);

            expect(layout.width).toBe(180); // 30% of 600
            expect(layout.flex).toBe(0);
        });

        test('FractionColumnWidth should validate fraction range', () => {
            expect(() => new FractionColumnWidth(-0.1)).toThrow('Fraction must be between 0 and 1');
            expect(() => new FractionColumnWidth(1.1)).toThrow('Fraction must be between 0 and 1');
            expect(() => new FractionColumnWidth(0.5)).not.toThrow();
        });

        test('should use column width strategies in table', () => {
            const columnWidths = new Map<number, TableColumnWidth>([
                [0, new FixedColumnWidth(100)],
                [1, new FlexColumnWidth(1)],
                [2, new FractionColumnWidth(0.2)],
            ]);

            const table = new Table({
                columnWidths,
                children: [
                    new TableRow({
                        children: [
                            new Text('Fixed'),
                            new Text('Flex'),
                            new Text('Fraction'),
                        ],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });
    });

    describe('Table Borders', () => {
        test('should create uniform borders', () => {
            const border = TableBorders.all({ width: 2, color: PdfColor.fromHex('#ff0000'), style: 'solid' });

            expect(border.left?.width).toBe(2);
            expect(border.top?.width).toBe(2);
            expect(border.right?.width).toBe(2);
            expect(border.bottom?.width).toBe(2);
            expect(border.horizontalInside?.width).toBe(2);
            expect(border.verticalInside?.width).toBe(2);

            expect(border.left?.color).toStrictEqual(PdfColor.fromHex('#ff0000'));
            expect(border.left?.style).toBe('solid');
        });

        test('should create symmetric borders', () => {
            const border = TableBorders.symmetric({
                inside: { width: 1, color: PdfColor.fromHex('#cccccc'), style: 'solid' },
                outside: { width: 3, color: PdfColor.fromHex('#000000'), style: 'solid' },
            });

            expect(border.left?.width).toBe(3);
            expect(border.horizontalInside?.width).toBe(1);
            expect(border.left?.color).toStrictEqual(PdfColor.fromHex('#000000'));
            expect(border.horizontalInside?.color).toStrictEqual(PdfColor.fromHex('#cccccc'));
        });

        test('should create table with borders', () => {
            const table = new Table({
                border: TableBorders.all(),
                children: [
                    new TableRow({
                        children: [new Text('A'), new Text('B')],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });
    });

    describe('Table Row Functionality', () => {
        test('should create table row with repeat option', () => {
            const row = new TableRow({
                children: [new Text('Header 1'), new Text('Header 2')],
                repeat: true,
            });

            expect(row.repeat).toBe(true);
            expect(row.children.length).toBe(2);
        });

        test('should support row decorations', () => {
            const decoration = { color: PdfColor.fromHex('#f0f0f0') };
            const row = new TableRow({
                children: [new Text('A'), new Text('B')],
                decoration,
            });

            expect(row.decoration).toBe(decoration);
        });

        test('should support vertical alignment', () => {
            const row = new TableRow({
                children: [new Text('A'), new Text('B')],
                verticalAlignment: TableCellVerticalAlignment.Middle,
            });

            expect(row.verticalAlignment).toBe(TableCellVerticalAlignment.Middle);
        });
    });

    describe('Table Width Behavior', () => {
        test('should handle TableWidth.Max', () => {
            const table = new Table({
                tableWidth: TableWidth.Max,
                children: [
                    new TableRow({
                        children: [new Text('A'), new Text('B')],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });

        test('should handle TableWidth.Min', () => {
            const table = new Table({
                tableWidth: TableWidth.Min,
                children: [
                    new TableRow({
                        children: [new Text('A'), new Text('B')],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
        });
    });

    describe('Table Context and Page Spanning', () => {
        test('should provide table context methods', () => {
            const table = new Table();

            const context = table.getTableContext();
            expect(context.firstRow).toBe(0);
            expect(context.lastRow).toBe(0);

            table.setTableContext({ firstRow: 1, lastRow: 5 });
            const updatedContext = table.getTableContext();
            expect(updatedContext.firstRow).toBe(1);
            expect(updatedContext.lastRow).toBe(5);
        });

        test('should detect if table has more content', () => {
            const table = new Table({
                children: [
                    new TableRow({ children: [new Text('Row 1')] }),
                    new TableRow({ children: [new Text('Row 2')] }),
                    new TableRow({ children: [new Text('Row 3')] }),
                ],
            });

            // Initially no content processed
            expect(table.hasMoreContent()).toBe(true);

            // After setting context to show all rows processed
            table.setTableContext({ firstRow: 0, lastRow: 3 });
            expect(table.hasMoreContent()).toBe(false);

            // Partially processed
            table.setTableContext({ firstRow: 0, lastRow: 2 });
            expect(table.hasMoreContent()).toBe(true);
        });
    });

    describe('Table Layout Edge Cases', () => {
        test('should handle empty rows', () => {
            const table = new Table({
                children: [
                    new TableRow({ children: [] }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThanOrEqual(0);
            expect(result.size.height).toBeGreaterThanOrEqual(0);
        });

        test('should handle rows with different column counts', () => {
            const table = new Table({
                children: [
                    new TableRow({
                        children: [new Text('A'), new Text('B'), new Text('C')],
                    }),
                    new TableRow({
                        children: [new Text('D'), new Text('E')],
                    }),
                    new TableRow({
                        children: [new Text('F')],
                    }),
                ],
            });

            const result = table.layout(layoutContext);
            expect(result.size.width).toBeGreaterThan(0);
            expect(result.size.height).toBeGreaterThan(0);
        });

        test('should handle constrained layout', () => {
            const table = new Table({
                children: [
                    new TableRow({
                        children: [
                            new Text('Very long text content that might exceed constraints'),
                            new Text('Another long cell content'),
                        ],
                    }),
                ],
            });

            const constrainedContext = {
                ...layoutContext,
                constraints: BoxConstraints.tight({ width: 200, height: 100 }),
            };

            const result = table.layout(constrainedContext);
            expect(result.size.width).toBeLessThanOrEqual(200);
            expect(result.size.height).toBeLessThanOrEqual(100);
        });
    });

    describe('Table Painting', () => {
        test('should paint without errors', () => {
            const table = new Table({
                border: TableBorders.all(),
                children: [
                    new TableRow({
                        children: [new Text('A'), new Text('B')],
                        decoration: { color: PdfColor.fromHex('#f8f8f8') },
                    }),
                ],
            });

            // Layout first
            table.layout(layoutContext);

            // Should not throw when painting
            expect(() => table.paint(paintContext)).not.toThrow();
        });
    });
});

describe('TableHelper Utilities', () => {
    describe('Basic Table Creation', () => {
        test('should create simple table from data', () => {
            const data = [
                ['A1', 'B1', 'C1'],
                ['A2', 'B2', 'C2'],
                ['A3', 'B3', 'C3'],
            ];

            const table = TableHelper.simple(data, {
                headers: ['Col A', 'Col B', 'Col C'],
            });

            expect(table).toBeInstanceOf(Table);
            expect(table.children.length).toBe(4); // 1 header + 3 data rows
        });

        test('should create table without headers', () => {
            const data = [
                ['A1', 'B1'],
                ['A2', 'B2'],
            ];

            const table = TableHelper.simple(data);
            expect(table.children.length).toBe(2); // Only data rows
        });
    });

    describe('Advanced Table Creation', () => {
        test('should create striped table', () => {
            const data = [
                ['Row 1 A', 'Row 1 B'],
                ['Row 2 A', 'Row 2 B'],
                ['Row 3 A', 'Row 3 B'],
            ];

            const table = TableHelper.striped(data, {
                headers: ['Column A', 'Column B'],
                evenRowColor: PdfColor.fromHex('#ffffff'),
                oddRowColor: PdfColor.fromHex('#f8f8f8'),
                headerColor: PdfColor.fromHex('#e8e8e8'),
            });

            expect(table).toBeInstanceOf(Table);
            expect(table.children.length).toBe(4); // header + 3 rows
        });

        test('should create bordered table', () => {
            const data = [['A', 'B'], ['C', 'D']];

            const table = TableHelper.bordered(data, {
                headers: ['H1', 'H2'],
                borderWidth: 2,
                borderColor: PdfColor.fromHex('#000000'),
                headerBackgroundColor: PdfColor.fromHex('#cccccc'),
            });

            expect(table).toBeInstanceOf(Table);
        });

        test('should create minimal table', () => {
            const data = [['A', 'B'], ['C', 'D']];

            const table = TableHelper.minimal(data, {
                headers: ['H1', 'H2'],
            });

            expect(table).toBeInstanceOf(Table);
        });
    });

    describe('Complex Table Creation with fromTextArray', () => {
        test('should handle custom cell formatting', () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
            ];

            const table = TableHelper.fromTextArray({
                data,
                cellFormat: (columnIndex: number, data: any, rowIndex: number) => `Cell(${rowIndex},${columnIndex}): ${data}`,
            });

            expect(table).toBeInstanceOf(Table);
        });

        test('should handle custom decorations', () => {
            const data = [['A', 'B'], ['C', 'D']];

            const table = TableHelper.fromTextArray({
                data,
                cellDecoration: (columnIndex: number, data: any, rowIndex: number) => {
                    if (rowIndex % 2 === 0) {
                        return { color: PdfColor.fromHex('#f0f0f0') };
                    }
                    return undefined;
                },
                rowDecoration: { color: PdfColor.white },
            });

            expect(table).toBeInstanceOf(Table);
        });

        test('should handle custom text styling', () => {
            const data = [['A', 'B'], ['C', 'D']];

            const table = TableHelper.fromTextArray({
                data,
                textStyleBuilder: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex === 0) {
                        return { fontWeight: FontWeight.Bold };
                    }
                    return undefined;
                },
                headerStyle: { fontWeight: FontWeight.Bold },
            });

            expect(table).toBeInstanceOf(Table);
        });

        test('should handle cell alignments', () => {
            const data = [['Left', 'Center', 'Right']];
            const cellAlignments = new Map([
                [0, 'topLeft' as any],
                [1, 'center' as any],
                [2, 'topRight' as any],
            ]);

            const table = TableHelper.fromTextArray({
                data,
                cellAlignments,
            });

            expect(table).toBeInstanceOf(Table);
        });

        test('should handle header count and repetition', () => {
            const data = [
                ['Header 1', 'Header 2'],
                ['Header 1b', 'Header 2b'], // Second header row
                ['Data 1', 'Data 2'],
            ];

            const table = TableHelper.fromTextArray({
                data,
                headerCount: 2,
                headerStyle: { fontWeight: FontWeight.Bold },
            });

            expect(table).toBeInstanceOf(Table);
            expect(table.children.length).toBe(3);
            expect(table.children[0]?.repeat).toBe(true);
            expect(table.children[1]?.repeat).toBe(true);
            expect(table.children[2]?.repeat).toBe(false);
        });
    });

    describe('TableHelpers exports', () => {
        test('should provide all helper methods', () => {
            expect(TableHelpers.simple).toBeDefined();
            expect(TableHelper.striped).toBeDefined();
            expect(TableHelper.bordered).toBeDefined();
            expect(TableHelper.minimal).toBeDefined();
            expect(TableHelper.fromTextArray).toBeDefined();
        });

        test('should work through TableHelpers object', () => {
            const data = [['A', 'B']];
            const table = TableHelpers.simple(data);
            expect(table).toBeInstanceOf(Table);
        });
    });
});