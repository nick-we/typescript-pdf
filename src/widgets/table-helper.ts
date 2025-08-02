/**
 * Table Helper utility for advanced data-to-table conversion
 *
 * Provides utilities for converting data arrays into fully formatted
 * tables with headers, cell decorations, styling, and formatting.
 *
 * Based on the Dart PDF TableHelper implementation.
 *
 * @packageDocumentation
 */

import { Container } from './container.js';
import { Text, type TextAlign } from './text.js';
import {
    Table,
    TableRow,
    type TableBorder,
    type TableColumnWidth,
    TableCellVerticalAlignment,
    type TableWidth,
    TableBorders,
    IntrinsicColumnWidth,
} from './table.js';
import type { BoxDecoration } from './container.js';
import type { EdgeInsets } from '../types/layout.js';
import { EdgeInsets as EdgeInsetsUtils, Alignment } from '../types/layout.js';
import { type Widget } from './widget.js';
import { FontStyle, FontWeight, TextDecoration, type TextStyle, TextStyleUtils } from '../types/theming.js';
import { TextDirection } from '@/core/text-layout.js';
import { PdfStandardFont } from '@/core/index.js';
import { PdfColor } from '../core/pdf/color.js';
import type { TableData, TableRowData, TableCellData } from '../types/internal.js';
import { getTableCellDisplayValue } from '../types/internal.js';

/**
 * Callback for custom cell formatting
 */
export type OnCellFormat = (columnIndex: number, data: TableCellData, rowIndex: number) => string;

/**
 * Callback for custom cell decoration
 */
export type OnCellDecoration = (columnIndex: number, data: TableCellData, rowIndex: number) => BoxDecoration | undefined;

/**
 * Callback for custom cell widget creation
 */
export type OnCellBuilder = (columnIndex: number, data: TableCellData, rowIndex: number) => Widget | undefined;

/**
 * Callback for custom text style
 */
export type OnCellTextStyle = (columnIndex: number, data: TableCellData, rowIndex: number) => TextStyle | undefined;

/**
 * Alignment geometry for table cells
 */
export type AlignmentGeometry = Alignment;

/**
 * Table helper utility class
 */
export class TableHelper {
    /**
     * Convert text alignment to appropriate cell alignment
     */
    private static textAlignToAlignment(align: Alignment): TextAlign {
        switch (align) {
            case Alignment.CenterLeft:
            case Alignment.TopLeft:
            case Alignment.BottomLeft:
                return 'left' as TextAlign;
            case Alignment.Center:
            case Alignment.TopCenter:
            case Alignment.BottomCenter:
                return 'center' as TextAlign;
            case Alignment.CenterRight:
            case Alignment.TopRight:
            case Alignment.BottomRight:
                return 'right' as TextAlign;
            default:
                return 'left' as TextAlign;
        }
    }

    /**
     * Create a table from a 2D array of data
     */
    static fromTextArray(options: {
        /** 2D array of data for table content */
        data: TableData;
        /** Cell padding for all cells */
        cellPadding?: EdgeInsets;
        /** Minimum cell height */
        cellHeight?: number;
        /** Default cell alignment */
        cellAlignment?: AlignmentGeometry;
        /** Per-column cell alignments */
        cellAlignments?: Map<number, AlignmentGeometry>;
        /** Default cell text style */
        cellStyle?: TextStyle;
        /** Text style for odd rows */
        oddCellStyle?: TextStyle;
        /** Custom cell formatting function */
        cellFormat?: OnCellFormat;
        /** Custom cell decoration function */
        cellDecoration?: OnCellDecoration;
        /** Number of header rows (starting from top) */
        headerCount?: number;
        /** Custom header row data (if different from data) */
        headers?: TableRowData;
        /** Header cell padding */
        headerPadding?: EdgeInsets;
        /** Minimum header cell height */
        headerHeight?: number;
        /** Default header cell alignment */
        headerAlignment?: AlignmentGeometry;
        /** Per-column header alignments */
        headerAlignments?: Map<number, AlignmentGeometry>;
        /** Header text style */
        headerStyle?: TextStyle;
        /** Custom header formatting function */
        headerFormat?: OnCellFormat;
        /** Table border configuration */
        border?: TableBorder;
        /** Column width specifications */
        columnWidths?: Map<number, TableColumnWidth>;
        /** Default column width strategy */
        defaultColumnWidth?: TableColumnWidth;
        /** Table width behavior */
        tableWidth?: TableWidth;
        /** Header decoration (background, etc.) */
        headerDecoration?: BoxDecoration;
        /** Individual header cell decoration */
        headerCellDecoration?: BoxDecoration;
        /** Row decoration for data rows */
        rowDecoration?: BoxDecoration;
        /** Row decoration for odd rows */
        oddRowDecoration?: BoxDecoration;
        /** Text direction for headers */
        headerDirection?: TextDirection;
        /** Text direction for table content */
        tableDirection?: TextDirection;
        /** Custom cell widget builder */
        cellBuilder?: OnCellBuilder;
        /** Custom text style builder */
        textStyleBuilder?: OnCellTextStyle;
    }): Table {
        const {
            data,
            cellPadding = EdgeInsetsUtils.all(5),
            cellHeight = 0,
            cellAlignment = Alignment.TopLeft,
            cellAlignments = new Map(),
            cellStyle,
            oddCellStyle,
            cellFormat,
            cellDecoration,
            headerCount = 1,
            headers,
            headerPadding = cellPadding,
            headerHeight = cellHeight,
            headerAlignment = Alignment.Center,
            headerAlignments = cellAlignments,
            headerStyle,
            headerFormat,
            border = TableBorders.all(),
            columnWidths,
            defaultColumnWidth = new IntrinsicColumnWidth(),
            tableWidth,
            headerDecoration,
            headerCellDecoration,
            rowDecoration,
            oddRowDecoration = rowDecoration,
            headerDirection = TextDirection.LeftToRight,
            tableDirection = TextDirection.LeftToRight,
            cellBuilder,
            textStyleBuilder,
        } = options;

        if (headerCount < 0) {
            throw new Error('headerCount must be >= 0');
        }

        const rows: TableRow[] = [];
        let rowIndex = 0;

        // Add custom header row if provided
        if (headers) {
            const headerRow: Widget[] = [];

            for (let columnIndex = 0; columnIndex < headers.length; columnIndex++) {
                const cellData = headers[columnIndex];
                const alignment = headerAlignments.get(columnIndex) ?? headerAlignment;
                const textAlign = TableHelper.textAlignToAlignment(alignment);

                // Check if cellData is a Widget (has layout and paint methods)
                const isWidget = (obj: any): obj is Widget => {
                    return obj && typeof obj === 'object' && 'layout' in obj && 'paint' in obj;
                };

                const cellContent = isWidget(cellData)
                    ? cellData
                    : new Text(
                        headerFormat ? headerFormat(columnIndex, cellData, rowIndex) : getTableCellDisplayValue(cellData),
                        {
                            style: headerStyle ?? { fontWeight: FontWeight.Bold, color: PdfColor.black },
                            textAlign: textAlign,
                        }
                    );

                const cellContainer = new Container({
                    alignment: alignment,
                    padding: headerPadding,
                    ...(headerCellDecoration && { decoration: headerCellDecoration }),
                    minHeight: headerHeight,
                    child: cellContent,
                });

                headerRow.push(cellContainer);
            }

            rows.push(new TableRow({
                children: headerRow,
                repeat: true,
                ...(headerDecoration && { decoration: headerDecoration }),
            }));
            rowIndex++;
        }

        // Process data rows
        for (let dataRowIndex = 0; dataRowIndex < data.length; dataRowIndex++) {
            const rowData = data[dataRowIndex]!;
            const tableRowCells: Widget[] = [];
            const isHeader = rowIndex < headerCount;
            const isOddDataRow = !isHeader && ((rowIndex - headerCount) % 2 !== 0);

            for (let columnIndex = 0; columnIndex < rowData.length; columnIndex++) {
                const cellData = rowData[columnIndex];

                if (isHeader) {
                    // Header row processing
                    const alignment = headerAlignments.get(columnIndex) ?? headerAlignment;
                    const textAlign = TableHelper.textAlignToAlignment(alignment);

                    // Check if cellData is a Widget (has layout and paint methods)
                    const isWidget = (obj: any): obj is Widget => {
                        return obj && typeof obj === 'object' && 'layout' in obj && 'paint' in obj;
                    };

                    const cellContent = isWidget(cellData)
                        ? cellData
                        : new Text(
                            headerFormat ? headerFormat(columnIndex, cellData, rowIndex) : getTableCellDisplayValue(cellData),
                            {
                                style: headerStyle ?? { fontWeight: FontWeight.Bold, color: PdfColor.black },
                                textAlign: textAlign,
                            }
                        );

                    const cellContainer = new Container({
                        alignment: alignment,
                        padding: headerPadding,
                        minHeight: headerHeight,
                        child: cellContent,
                    });

                    tableRowCells.push(cellContainer);
                } else {
                    // Data row processing
                    const alignment = cellAlignments.get(columnIndex) ?? cellAlignment;
                    const textAlign = TableHelper.textAlignToAlignment(alignment);

                    // Try custom cell builder first
                    let cellContent: Widget | undefined = cellBuilder?.(columnIndex, cellData, rowIndex);

                    if (!cellContent) {
                        // Check if cellData is a Widget (has layout and paint methods)
                        const isWidget = (obj: any): obj is Widget => {
                            return obj && typeof obj === 'object' && 'layout' in obj && 'paint' in obj;
                        };

                        if (isWidget(cellData)) {
                            cellContent = cellData;
                        } else {
                            // Get text style (custom or default)
                            const customTextStyle = textStyleBuilder?.(columnIndex, cellData, rowIndex);
                            const defaultTextStyle = isOddDataRow ? oddCellStyle : cellStyle;

                            // Create a proper TextStyle using the theming system for maximum compatibility
                            const baseTextStyle = TextStyleUtils.createDefault({
                                fontSize: 12,
                                fontFamily: PdfStandardFont.Helvetica,
                                fontWeight: FontWeight.Normal,
                                color: PdfColor.black,
                                letterSpacing: 0,
                                wordSpacing: 1,
                                lineSpacing: 1.2,
                            });

                            // Merge styles properly using the theming system
                            let finalTextStyle;
                            if (customTextStyle) {
                                // Merge custom style with base style using TextStyleUtils
                                finalTextStyle = TextStyleUtils.merge(baseTextStyle, customTextStyle);
                            } else if (defaultTextStyle) {
                                // Merge default style with base style using TextStyleUtils
                                finalTextStyle = TextStyleUtils.merge(baseTextStyle, defaultTextStyle);
                            } else {
                                // Use complete base style
                                finalTextStyle = baseTextStyle;
                            }

                            cellContent = new Text(
                                cellFormat ? cellFormat(columnIndex, cellData, rowIndex) : getTableCellDisplayValue(cellData),
                                { style: finalTextStyle, textAlign: textAlign }
                            );
                        }
                    }

                    const decoration = cellDecoration?.(columnIndex, cellData, rowIndex);
                    const cellContainer = new Container({
                        alignment: alignment,
                        padding: cellPadding,
                        ...(decoration && { decoration }),
                        minHeight: cellHeight,
                        child: cellContent!,
                    });

                    tableRowCells.push(cellContainer);
                }
            }

            // Determine row decoration
            let decoration: BoxDecoration | undefined;
            if (isHeader) {
                decoration = headerDecoration;
            } else {
                decoration = isOddDataRow ? oddRowDecoration : rowDecoration;
            }

            rows.push(new TableRow({
                children: tableRowCells,
                repeat: isHeader,
                ...(decoration && { decoration }),
            }));

            rowIndex++;
        }

        return new Table({
            children: rows,
            border: border,
            ...(tableWidth && { tableWidth }),
            ...(columnWidths && { columnWidths }),
            defaultColumnWidth: defaultColumnWidth,
            defaultVerticalAlignment: TableCellVerticalAlignment.Full,
        });
    }

    /**
     * Create a simple data table with automatic formatting
     */
    static simple(data: TableData, options: {
        headers?: string[];
        border?: TableBorder;
        cellPadding?: EdgeInsets;
        headerStyle?: TextStyle;
        cellStyle?: TextStyle;
    } = {}): Table {
        return TableHelper.fromTextArray({
            data,
            ...(options.headers && { headers: options.headers }),
            border: options.border ?? TableBorders.all(),
            cellPadding: options.cellPadding ?? EdgeInsetsUtils.all(8),
            headerStyle: options.headerStyle ?? { fontWeight: FontWeight.Bold },
            ...(options.cellStyle && { cellStyle: options.cellStyle }),
            headerCount: options.headers ? 1 : 0,
        });
    }

    /**
     * Create a striped table with alternating row colors
     */
    static striped(data: TableData, options: {
        headers?: string[];
        border?: TableBorder;
        cellPadding?: EdgeInsets;
        evenRowColor?: PdfColor;
        oddRowColor?: PdfColor;
        headerColor?: PdfColor;
    } = {}): Table {
        const evenDecoration = options.evenRowColor ? { color: options.evenRowColor } : undefined;
        const oddDecoration = options.oddRowColor ? { color: options.oddRowColor } : undefined;
        const headerDecoration = options.headerColor ? { color: options.headerColor } : undefined;

        return TableHelper.fromTextArray({
            data,
            ...(options.headers && { headers: options.headers }),
            border: options.border ?? TableBorders.all(),
            cellPadding: options.cellPadding ?? EdgeInsetsUtils.all(8),
            headerStyle: { fontWeight: FontWeight.Bold },
            headerCount: options.headers ? 1 : 0,
            ...(headerDecoration && { headerDecoration }),
            ...(evenDecoration && { rowDecoration: evenDecoration }),
            ...(oddDecoration && { oddRowDecoration: oddDecoration }),
        });
    }

    /**
     * Create a bordered table with custom styling
     */
    static bordered(data: TableData, options: {
        headers?: string[];
        borderWidth?: number;
        borderColor?: PdfColor;
        cellPadding?: EdgeInsets;
        headerBackgroundColor?: PdfColor;
    } = {}): Table {
        const border = TableBorders.all({
            width: options.borderWidth ?? 1,
            color: options.borderColor ?? PdfColor.black,
            style: 'solid',
        });

        const headerDecoration = options.headerBackgroundColor
            ? { color: options.headerBackgroundColor }
            : undefined;

        return TableHelper.fromTextArray({
            data,
            ...(options.headers && { headers: options.headers }),
            border: border,
            cellPadding: options.cellPadding ?? EdgeInsetsUtils.all(12),
            headerStyle: { fontWeight: FontWeight.Bold },
            headerCount: options.headers ? 1 : 0,
            ...(headerDecoration && { headerDecoration }),
        });
    }

    /**
     * Create a minimal table with no borders
     */
    static minimal(data: TableData, options: {
        headers?: string[];
        cellPadding?: EdgeInsets;
        headerStyle?: TextStyle;
        cellStyle?: TextStyle;
    } = {}): Table {
        return TableHelper.fromTextArray({
            data,
            ...(options.headers && { headers: options.headers }),
            border: TableBorders.none,
            cellPadding: options.cellPadding ?? EdgeInsetsUtils.all(6),
            headerStyle: options.headerStyle ?? { fontWeight: FontWeight.Bold },
            ...(options.cellStyle && { cellStyle: options.cellStyle }),
            headerCount: options.headers ? 1 : 0,
        });
    }
}

/**
 * Export convenience functions that match existing TableHelpers pattern
 */
export const TableHelpers = {
    /**
     * Create table from text array data
     */
    fromTextArray: TableHelper.fromTextArray.bind(TableHelper),

    /**
     * Create simple table
     */
    simple: TableHelper.simple.bind(TableHelper),

    /**
     * Create striped table
     */
    striped: TableHelper.striped.bind(TableHelper),

    /**
     * Create bordered table
     */
    bordered: TableHelper.bordered.bind(TableHelper),

    /**
     * Create minimal table
     */
    minimal: TableHelper.minimal.bind(TableHelper),
};