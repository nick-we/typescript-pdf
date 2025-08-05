/**
 * Data Visualization System - Consolidated
 *
 * Consolidates all data visualization widgets into a single focused module.
 * Replaces: table.ts + table-helper.ts + chart.ts + bar-chart.ts + line-chart.ts
 *
 * @packageDocumentation
 */

import { TextUtils } from '@/core/text-utils.js';
import type {
    IPdfColor,
    IGraphicsContext,
    IUniversalFont,
} from '@/types/core-interfaces.js';
import { type Geometry, Layout, Theme, Internal } from '@/types.js';
import { BaseWidget, type Widget, type WidgetProps } from '@/widgets/base.js';

/**
 * Table column width types
 */
export enum TableColumnWidthType {
    Fixed = 'fixed',
    Flex = 'flex',
    Intrinsic = 'intrinsic',
    Fraction = 'fraction',
}

/**
 * Table cell vertical alignment
 */
export enum TableCellVerticalAlignment {
    Top = 'top',
    Middle = 'middle',
    Bottom = 'bottom',
}

/**
 * Text overflow behavior for table cells
 */
export enum TextOverflow {
    /** Clip text at cell boundaries (hard cutoff) */
    Clip = 'clip',
    /** Truncate text with ellipsis (...) when it exceeds boundaries */
    Ellipsis = 'ellipsis',
    /** Allow text to extend beyond cell boundaries */
    Visible = 'visible',
}

/**
 * Chart types
 */
export enum ChartType {
    Bar = 'bar',
    Line = 'line',
    Area = 'area',
}

/**
 * Bar chart orientation
 */
export enum BarOrientation {
    Vertical = 'vertical',
    Horizontal = 'horizontal',
}

/**
 * Line marker styles
 */
export enum LineMarker {
    None = 'none',
    Circle = 'circle',
    Square = 'square',
    Diamond = 'diamond',
}

/**
 * Table column width configuration
 */
export interface TableColumnWidth {
    readonly type: TableColumnWidthType;
    readonly value?: number;
}

/**
 * Table border configuration
 */
export interface TableBorder {
    readonly width?: number;
    readonly color?: string;
    readonly style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Table borders configuration
 */
export interface TableBorders {
    readonly top?: TableBorder;
    readonly right?: TableBorder;
    readonly bottom?: TableBorder;
    readonly left?: TableBorder;
    readonly horizontal?: TableBorder;
    readonly vertical?: TableBorder;
}

/**
 * Table properties
 */
export interface TableProps extends WidgetProps {
    /** Table data */
    data?: Internal.TableData;
    /** Column widths */
    columnWidths?: TableColumnWidth[];
    /** Table borders */
    borders?: TableBorders;
    /** Default cell vertical alignment */
    defaultVerticalAlignment?: TableCellVerticalAlignment;
    /** Header row styling */
    headerStyle?: Theme.TextStyle;
    /** Cell padding */
    cellPadding?: Layout.EdgeInsets;
    /** Table rows (alternative to data) */
    children?: TableRow[];
    /** Default text overflow behavior for all cells */
    textOverflow?: TextOverflow;
    /** Maximum lines per cell (works with ellipsis/clip) */
    maxLines?: number;
}

/**
 * Table row properties
 */
export interface TableRowProps extends WidgetProps {
    /** Row cells */
    children: Widget[];
    /** Row decoration */
    decoration?: {
        color?: string;
        border?: TableBorder;
    };
    /** Vertical alignment for this row */
    verticalAlignment?: TableCellVerticalAlignment;
    /** Override text overflow for this row */
    textOverflow?: TextOverflow;
    /** Override max lines for this row */
    maxLines?: number;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
    readonly x: number | string;
    readonly y: number;
    readonly label?: string;
    readonly color?: string;
}

/**
 * Chart data series
 */
export interface ChartDataSeries {
    readonly name: string;
    readonly data: ChartDataPoint[];
    readonly color?: string;
    readonly style?: {
        readonly lineWidth?: number;
        readonly marker?: LineMarker;
        readonly markerSize?: number;
    };
}

/**
 * Chart axis configuration
 */
export interface ChartAxis {
    readonly title?: string;
    readonly min?: number;
    readonly max?: number;
    readonly showGrid?: boolean;
    readonly showLabels?: boolean;
}

/**
 * Chart legend configuration
 */
export interface ChartLegend {
    readonly show?: boolean;
    readonly position?: 'top' | 'bottom' | 'left' | 'right';
    readonly alignment?: Layout.Alignment;
}

/**
 * Base chart properties
 */
export interface ChartProps extends WidgetProps {
    /** Chart title */
    title?: string;
    /** Chart data series */
    series: ChartDataSeries[];
    /** X-axis configuration */
    xAxis?: ChartAxis;
    /** Y-axis configuration */
    yAxis?: ChartAxis;
    /** Legend configuration */
    legend?: ChartLegend;
    /** Chart colors */
    colors?: string[];
    /** Chart width */
    width?: number;
    /** Chart height */
    height?: number;
}

/**
 * Bar chart properties
 */
export interface BarChartProps extends ChartProps {
    /** Bar orientation */
    orientation?: BarOrientation;
    /** Bar width (0-1) */
    barWidth?: number;
    /** Spacing between bars */
    barSpacing?: number;
}

/**
 * Line chart properties
 */
export interface LineChartProps extends ChartProps {
    /** Whether to fill area under line */
    fill?: boolean;
    /** Default line marker */
    marker?: LineMarker;
    /** Default line width */
    lineWidth?: number;
}

/**
 * Table widget for displaying tabular data
 */
export class Table extends BaseWidget {
    private readonly data?: Internal.TableData;
    private readonly columnWidths: TableColumnWidth[];
    private readonly borders?: TableBorders;
    private readonly defaultVerticalAlignment: TableCellVerticalAlignment;
    private readonly headerStyle?: Theme.TextStyle;
    private readonly cellPadding: Layout.EdgeInsets;
    private readonly children?: TableRow[];
    private readonly textOverflow: TextOverflow;
    private readonly maxLines?: number;

    constructor(props: TableProps = {}) {
        super(props);

        if (props.data) {
            this.data = props.data;
        }
        this.columnWidths = props.columnWidths ?? [];
        if (props.borders) {
            this.borders = props.borders;
        }
        this.defaultVerticalAlignment =
            props.defaultVerticalAlignment ?? TableCellVerticalAlignment.Middle;
        if (props.headerStyle) {
            this.headerStyle = props.headerStyle;
        }
        this.cellPadding = props.cellPadding ?? Layout.EdgeInsets.all(8);
        if (props.children) {
            this.children = props.children;
        }
        this.textOverflow = props.textOverflow ?? TextOverflow.Clip;
        if (props.maxLines) {
            this.maxLines = props.maxLines;
        }
    }

    /**
     * Get table data from either data prop or children
     */
    private getTableData(): Internal.TableData {
        if (this.data) {
            return this.data;
        }

        if (this.children) {
            // Convert TableRow children to data format
            return this.children.map(row => {
                return row.children.map((child, index) => {
                    // Try to extract meaningful data from child widgets using proper type checking
                    if (child && typeof child === 'object') {
                        // Define interfaces for widgets that might contain data
                        const dataWidget = child as Widget & {
                            content?: string;
                            data?: unknown;
                            text?: string;
                            value?: unknown;
                        };

                        // Check for Text widget content
                        if (
                            dataWidget.content &&
                            typeof dataWidget.content === 'string'
                        ) {
                            return dataWidget.content;
                        }

                        // Check for common data properties
                        if ('data' in child && child.data) {
                            return String(child.data);
                        }

                        // Check for text property
                        if (
                            'text' in child &&
                            typeof dataWidget.text === 'string'
                        ) {
                            return dataWidget.text;
                        }

                        // Check for value property
                        if (
                            'value' in child &&
                            dataWidget.value !== undefined
                        ) {
                            return String(dataWidget.value);
                        }

                        // Try toString method if available
                        if (
                            'toString' in child &&
                            typeof child.toString === 'function'
                        ) {
                            try {
                                const stringValue = child.toString();
                                if (stringValue !== '[object Object]') {
                                    return stringValue;
                                }
                            } catch (_error) {
                                // Continue to fallback
                            }
                        }
                    }

                    // Fallback to generic cell identifier
                    return `Cell ${index}`;
                });
            });
        }

        return [];
    }

    /**
     * Calculate column widths
     */
    private calculateColumnWidths(
        availableWidth: number,
        columnCount: number
    ): number[] {
        const widths: number[] = [];
        let remainingWidth = availableWidth;
        let flexColumns = 0;

        // First pass: calculate fixed and fraction widths
        for (let i = 0; i < columnCount; i++) {
            const columnWidth = this.columnWidths[i];

            if (
                !columnWidth ||
                columnWidth.type === TableColumnWidthType.Flex
            ) {
                flexColumns++;
                widths[i] = 0; // Will be calculated later
            } else if (columnWidth.type === TableColumnWidthType.Fixed) {
                const width = columnWidth.value ?? 100;
                widths[i] = width;
                remainingWidth -= width;
            } else if (columnWidth.type === TableColumnWidthType.Fraction) {
                const fraction = columnWidth.value ?? 1;
                const width = availableWidth * fraction;
                widths[i] = width;
                remainingWidth -= width;
            } else if (columnWidth.type === TableColumnWidthType.Intrinsic) {
                // Calculate intrinsic width based on actual content
                const intrinsicWidth = this.calculateIntrinsicColumnWidth(
                    i,
                    availableWidth
                );
                widths[i] = intrinsicWidth;
                remainingWidth -= intrinsicWidth;
            }
        }

        // Second pass: distribute remaining width among flex columns
        if (flexColumns > 0 && remainingWidth > 0) {
            const flexWidth = remainingWidth / flexColumns;
            for (let i = 0; i < columnCount; i++) {
                if (widths[i] === 0) {
                    widths[i] = flexWidth;
                }
            }
        }

        return widths;
    }

    /**
     * Calculate intrinsic width for a column based on its content
     */
    private calculateIntrinsicColumnWidth(
        columnIndex: number,
        availableWidth: number
    ): number {
        const tableData = this.getTableData();
        let maxWidth = 60; // Minimum column width
        const maxAllowedWidth = availableWidth * 0.4; // Don't let one column take more than 40% of available width

        // Check each row for content in this column
        tableData.forEach((row, rowIndex) => {
            if (columnIndex < row.length) {
                const cell = row[columnIndex];
                const cellValue = Internal.Utils.getTableCellDisplayValue(cell);

                if (cellValue && cellValue.length > 0) {
                    // Get text style for this cell
                    const isHeader = rowIndex === 0 && this.headerStyle;
                    const fontSize =
                        isHeader && this.headerStyle?.fontSize
                            ? this.headerStyle.fontSize
                            : 12;
                    const fontFamily =
                        isHeader && this.headerStyle?.fontFamily
                            ? this.headerStyle.fontFamily
                            : 'Helvetica';

                    // Use robust text width calculation with proper fallbacks
                    const contentWidth = this.calculateTextContentWidth(
                        cellValue,
                        fontSize,
                        fontFamily
                    );

                    // Add padding
                    const totalWidth =
                        contentWidth +
                        this.cellPadding.left +
                        this.cellPadding.right;
                    maxWidth = Math.max(maxWidth, totalWidth);
                }
            }
        });

        // Constrain to reasonable bounds with better validation
        return Math.min(Math.max(maxWidth, 60), maxAllowedWidth);
    }

    /**
     * Calculate text content width with robust measurement and fallbacks
     */
    private calculateTextContentWidth(
        cellValue: string,
        fontSize: number,
        fontFamily: string = 'Helvetica'
    ): number {
        // Input validation and edge case handling
        if (!cellValue || typeof cellValue !== 'string') {
            return 0;
        }

        const trimmedValue = cellValue.trim();
        if (trimmedValue.length === 0) {
            return 0;
        }

        // Validate fontSize
        if (!fontSize || fontSize <= 0) {
            fontSize = 12; // Fallback to default
        }

        try {
            return TextUtils.measureWidth(trimmedValue, fontSize);
        } catch (_error) {
            // Robust fallback with improved character width estimation
            return this.estimateTextWidth(trimmedValue, fontSize, fontFamily);
        }
    }

    /**
     * Improved fallback text width estimation with character-aware calculations
     */
    private estimateTextWidth(
        text: string,
        fontSize: number,
        fontFamily: string
    ): number {
        // Character width multipliers based on common font families
        const FONT_MULTIPLIERS = new Map([
            ['helvetica', 0.56],
            ['arial', 0.56],
            ['times', 0.52],
            ['courier', 0.6], // Monospace
            ['default', 0.55],
        ]);

        const normalizedFamily =
            fontFamily.toLowerCase().split(',')[0]?.trim() ?? 'default';
        const multiplier =
            FONT_MULTIPLIERS.get(normalizedFamily) ??
            FONT_MULTIPLIERS.get('default') ??
            0.55;

        // Account for different character types for better accuracy
        let adjustedLength = 0;
        for (const char of text) {
            if (/[iIlj1!|]/.test(char)) {
                // Narrow characters
                adjustedLength += 0.4;
            } else if (/[mMwW]/.test(char)) {
                // Wide characters
                adjustedLength += 1.4;
            } else if (/[A-Z]/.test(char)) {
                // Uppercase letters
                adjustedLength += 1.1;
            } else {
                // Regular characters
                adjustedLength += 1.0;
            }
        }

        return Math.ceil(adjustedLength * fontSize * multiplier);
    }

    /**
     * Calculate row heights based on content
     */
    private calculateRowHeights(
        validRows: Internal.TableRowData[],
        columnWidths: number[],
        context: Layout.PaintContext
    ): number[] {
        const rowHeights: number[] = [];
        const defaultRowHeight = 40;
        const minRowHeight = 30;

        validRows.forEach((row, rowIndex) => {
            let maxCellHeight = minRowHeight;

            row.forEach((cell, colIndex) => {
                if (colIndex >= columnWidths.length) {
                    return;
                }

                const cellValue = Internal.Utils.getTableCellDisplayValue(cell);
                const cellWidth = columnWidths[colIndex] ?? 100;
                const availableWidth =
                    cellWidth - this.cellPadding.left - this.cellPadding.right;

                // Get text style for this cell
                const textStyle = this.getCellTextStyle(
                    rowIndex,
                    colIndex,
                    context
                );

                // Calculate required height for text content
                let textHeight = textStyle.fontSize ?? 12;

                // If we have text measurement service, use it for more accurate calculation
                if (context.textMeasurement && cellValue.length > 0) {
                    try {
                        const lines = context.textMeasurement.wrapTextAccurate(
                            cellValue,
                            availableWidth,
                            {
                                fontSize: textStyle.fontSize ?? 12,
                                fontFamily: textStyle.fontFamily ?? 'Helvetica',
                                fontWeight:
                                    textStyle.fontWeight ??
                                    Theme.FontWeight.Normal,
                                fontStyle:
                                    textStyle.fontStyle ??
                                    Theme.FontStyle.Normal,
                                lineSpacing: textStyle.lineSpacing ?? 1.2,
                            }
                        );
                        textHeight =
                            lines.length *
                            (textStyle.fontSize ?? 12) *
                            (textStyle.lineSpacing ?? 1.2);
                    } catch (_error) {
                        // Fallback to simple calculation
                        const estimatedLines = Math.ceil(
                            (cellValue.length *
                                (textStyle.fontSize ?? 12) *
                                0.55) /
                                availableWidth
                        );
                        textHeight =
                            Math.max(1, estimatedLines) *
                            (textStyle.fontSize ?? 12) *
                            1.2;
                    }
                }

                // Add padding to height
                const cellHeight =
                    textHeight + this.cellPadding.top + this.cellPadding.bottom;
                maxCellHeight = Math.max(maxCellHeight, cellHeight);
            });

            rowHeights[rowIndex] = Math.max(defaultRowHeight, maxCellHeight);
        });

        return rowHeights;
    }

    /**
     * Get text style for a specific cell
     */
    private getCellTextStyle(
        rowIndex: number,
        colIndex: number,
        context: Layout.PaintContext
    ): Theme.TextStyle {
        // Use header style for first row if available
        if (rowIndex === 0 && this.headerStyle) {
            return Theme.Utils.mergeTextStyles(
                context.theme.defaultTextStyle,
                this.headerStyle
            );
        }

        return context.theme.defaultTextStyle;
    }

    /**
     * Parse color string to PDF color object
     */
    private parseColor(colorStr: string): IPdfColor {
        // Simple hex color parser
        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { red: r, green: g, blue: b };
        }
        // Default to black
        return { red: 0, green: 0, blue: 0 };
    }

    /**
     * Paint individual cell content with text overflow handling
     */
    private paintCellContent(
        cell: Internal.TableCellData,
        cellRect: { x: number; y: number; width: number; height: number },
        context: Layout.PaintContext,
        isHeader: boolean = false,
        overflowBehavior: TextOverflow = TextOverflow.Clip,
        maxLines?: number
    ): void {
        if (!context.graphics || !context.fontRegistry) {
            return;
        }

        const { graphics, fontRegistry } = context;
        const cellValue = Internal.Utils.getTableCellDisplayValue(cell);

        if (!cellValue) {
            return;
        }

        // Get text style
        const textStyle =
            isHeader && this.headerStyle
                ? Theme.Utils.mergeTextStyles(
                      context.theme.defaultTextStyle,
                      this.headerStyle
                  )
                : context.theme.defaultTextStyle;

        const fontSize = textStyle.fontSize ?? 12;
        const fontFamily = textStyle.fontFamily ?? 'Helvetica';
        const textColor =
            textStyle.color ??
            (isHeader ? '#ffffff' : context.theme.colorScheme.onSurface);

        // Get font
        const font = fontRegistry.getFont(fontFamily);
        if (!font) {
            return;
        }

        // Set text color
        graphics.setFillColor(this.parseColor(textColor));

        // Calculate text positioning based on vertical alignment
        const verticalAlignment = this.defaultVerticalAlignment;
        let textY = cellRect.y;

        switch (verticalAlignment) {
            case TableCellVerticalAlignment.Top:
                textY = cellRect.y + fontSize * 0.8; // Account for baseline
                break;
            case TableCellVerticalAlignment.Middle:
                textY = cellRect.y + cellRect.height / 2 + fontSize * 0.3;
                break;
            case TableCellVerticalAlignment.Bottom:
                textY = cellRect.y + cellRect.height - fontSize * 0.2;
                break;
        }

        // Apply overflow behavior
        switch (overflowBehavior) {
            case TextOverflow.Clip:
                this.paintCellContentClipped(
                    cellValue,
                    cellRect,
                    context,
                    font,
                    fontSize,
                    fontFamily,
                    textY,
                    textStyle,
                    maxLines
                );
                break;
            case TextOverflow.Ellipsis:
                this.paintCellContentEllipsis(
                    cellValue,
                    cellRect,
                    context,
                    font,
                    fontSize,
                    fontFamily,
                    textY,
                    textStyle,
                    maxLines
                );
                break;
            case TextOverflow.Visible:
                this.paintCellContentVisible(
                    cellValue,
                    cellRect,
                    context,
                    font,
                    fontSize,
                    fontFamily,
                    textY,
                    textStyle,
                    maxLines
                );
                break;
        }
    }

    /**
     * Paint cell content with clipping (hard cutoff at boundaries)
     */
    private paintCellContentClipped(
        cellValue: string,
        cellRect: { x: number; y: number; width: number; height: number },
        context: Layout.PaintContext,
        font: IUniversalFont,
        fontSize: number,
        fontFamily: string,
        textY: number,
        textStyle: Theme.TextStyle,
        maxLines?: number
    ): void {
        const { graphics } = context;
        if (!graphics) {
            return;
        }

        // Set clipping region
        graphics.setClippingRect(
            cellRect.x,
            cellRect.y,
            cellRect.width,
            cellRect.height
        );

        // Render text with wrapping
        if (context.textMeasurement) {
            try {
                const lines = context.textMeasurement.wrapTextAccurate(
                    cellValue,
                    cellRect.width,
                    {
                        fontSize,
                        fontFamily,
                        lineSpacing: textStyle.lineSpacing ?? 1.2,
                    }
                );
                const lineHeight = fontSize * (textStyle.lineSpacing ?? 1.2);
                const maxLinesLimit =
                    maxLines ?? Math.floor(cellRect.height / lineHeight);

                lines
                    .slice(0, maxLinesLimit)
                    .forEach((line: string, lineIndex: number) => {
                        const lineY = textY + lineIndex * lineHeight;
                        graphics.save();
                        graphics.scale(1, -1); // Flip for text
                        graphics.drawString(
                            font.getUnderlyingFont(),
                            fontSize,
                            line,
                            cellRect.x,
                            -lineY
                        );
                        graphics.restore();
                    });
            } catch (_error) {
                // Fallback to simple text rendering
                graphics.save();
                graphics.scale(1, -1);
                graphics.drawString(
                    font.getUnderlyingFont(),
                    fontSize,
                    cellValue,
                    cellRect.x,
                    -textY
                );
                graphics.restore();
            }
        } else {
            // Simple text rendering without wrapping
            graphics.save();
            graphics.scale(1, -1);
            graphics.drawString(
                font.getUnderlyingFont(),
                fontSize,
                cellValue,
                cellRect.x,
                -textY
            );
            graphics.restore();
        }

        // Clear clipping
        graphics.clearClipping();
    }

    /**
     * Paint cell content with ellipsis truncation
     */
    private paintCellContentEllipsis(
        cellValue: string,
        cellRect: { x: number; y: number; width: number; height: number },
        context: Layout.PaintContext,
        font: IUniversalFont,
        fontSize: number,
        fontFamily: string,
        textY: number,
        textStyle: Theme.TextStyle,
        maxLines?: number
    ): void {
        const { graphics, textMeasurement } = context;

        if (textMeasurement) {
            try {
                const lines = textMeasurement.wrapTextAccurate(
                    cellValue,
                    cellRect.width,
                    {
                        fontSize,
                        fontFamily,
                        lineSpacing: textStyle.lineSpacing ?? 1.2,
                    }
                );
                const lineHeight = fontSize * (textStyle.lineSpacing ?? 1.2);
                const maxLinesLimit =
                    maxLines ?? Math.floor(cellRect.height / lineHeight);
                const ellipsisWidth = textMeasurement.measureTextWidth(
                    '…',
                    fontSize,
                    fontFamily
                );

                lines
                    .slice(0, maxLinesLimit)
                    .forEach((line: string, lineIndex: number) => {
                        let displayLine = line;

                        // For the last line (if we're at max lines and there are more lines), add ellipsis
                        if (
                            lineIndex === maxLinesLimit - 1 &&
                            lines.length > maxLinesLimit
                        ) {
                            const availableWidth =
                                cellRect.width - ellipsisWidth;
                            displayLine =
                                textMeasurement.truncateTextAccurate(
                                    line,
                                    availableWidth,
                                    {
                                        fontSize,
                                        fontFamily,
                                    }
                                ) + '…';
                        }
                        // For any line that's too wide, truncate with ellipsis
                        else if (
                            textMeasurement.measureTextWidth(
                                line,
                                fontSize,
                                fontFamily
                            ) > cellRect.width
                        ) {
                            const availableWidth =
                                cellRect.width - ellipsisWidth;
                            displayLine =
                                textMeasurement.truncateTextAccurate(
                                    line,
                                    availableWidth,
                                    {
                                        fontSize,
                                        fontFamily,
                                    }
                                ) + '…';
                        }

                        const lineY = textY + lineIndex * lineHeight;
                        if (graphics) {
                            graphics.save();
                            graphics.scale(1, -1); // Flip for text
                            graphics.drawString(
                                font.getUnderlyingFont(),
                                fontSize,
                                displayLine,
                                cellRect.x,
                                -lineY
                            );
                            graphics.restore();
                        }
                    });
            } catch (_error) {
                // Fallback to clipped behavior
                this.paintCellContentClipped(
                    cellValue,
                    cellRect,
                    context,
                    font,
                    fontSize,
                    fontFamily,
                    textY,
                    textStyle,
                    maxLines
                );
            }
        } else {
            // Fallback to clipped behavior
            this.paintCellContentClipped(
                cellValue,
                cellRect,
                context,
                font,
                fontSize,
                fontFamily,
                textY,
                textStyle,
                maxLines
            );
        }
    }

    /**
     * Paint cell content without clipping (allows overflow)
     */
    private paintCellContentVisible(
        cellValue: string,
        cellRect: { x: number; y: number; width: number; height: number },
        context: Layout.PaintContext,
        font: IUniversalFont,
        fontSize: number,
        fontFamily: string,
        textY: number,
        textStyle: Theme.TextStyle,
        maxLines?: number
    ): void {
        const { graphics } = context;

        // Render text with wrapping but no clipping
        if (context.textMeasurement) {
            try {
                const lines = context.textMeasurement.wrapTextAccurate(
                    cellValue,
                    cellRect.width,
                    {
                        fontSize,
                        fontFamily,
                        lineSpacing: textStyle.lineSpacing ?? 1.2,
                    }
                );
                const lineHeight = fontSize * (textStyle.lineSpacing ?? 1.2);
                const maxLinesLimit = maxLines ?? lines.length; // Use all lines if no limit

                lines
                    .slice(0, maxLinesLimit)
                    .forEach((line: string, lineIndex: number) => {
                        const lineY = textY + lineIndex * lineHeight;
                        if (graphics) {
                            graphics.save();
                            graphics.scale(1, -1); // Flip for text
                            graphics.drawString(
                                font.getUnderlyingFont(),
                                fontSize,
                                line,
                                cellRect.x,
                                -lineY
                            );
                            graphics.restore();
                        }
                    });
            } catch (_error) {
                // Fallback to simple text rendering
                if (graphics) {
                    graphics.save();
                    graphics.scale(1, -1);
                    graphics.drawString(
                        font.getUnderlyingFont(),
                        fontSize,
                        cellValue,
                        cellRect.x,
                        -textY
                    );
                    graphics.restore();
                }
            }
        } else {
            // Simple text rendering without wrapping
            if (graphics) {
                graphics.save();
                graphics.scale(1, -1);
                graphics.drawString(
                    font.getUnderlyingFont(),
                    fontSize,
                    cellValue,
                    cellRect.x,
                    -textY
                );
                graphics.restore();
            }
        }
    }

    /**
     * Paint table borders
     */
    private paintTableBorders(
        columnWidths: number[],
        rowHeights: number[],
        context: Layout.PaintContext
    ): void {
        if (!context.graphics || !this.borders) {
            return;
        }

        const { graphics } = context;

        // Calculate cumulative positions
        const columnPositions = [0];
        columnWidths.forEach(width => {
            const lastPos = columnPositions[columnPositions.length - 1];
            if (lastPos !== undefined) {
                columnPositions.push(lastPos + width);
            }
        });

        const rowPositions = [0];
        rowHeights.forEach(height => {
            const lastPos = rowPositions[rowPositions.length - 1];
            if (lastPos !== undefined) {
                rowPositions.push(lastPos + height);
            }
        });

        const tableWidth = columnPositions[columnPositions.length - 1] ?? 0;
        const tableHeight = rowPositions[rowPositions.length - 1] ?? 0;

        graphics.save();

        // Draw outer borders
        if (this.borders.top) {
            this.drawBorder(this.borders.top, 0, 0, tableWidth, 0, graphics);
        }
        if (this.borders.bottom) {
            this.drawBorder(
                this.borders.bottom,
                0,
                tableHeight,
                tableWidth,
                tableHeight,
                graphics
            );
        }
        if (this.borders.left) {
            this.drawBorder(this.borders.left, 0, 0, 0, tableHeight, graphics);
        }
        if (this.borders.right) {
            this.drawBorder(
                this.borders.right,
                tableWidth,
                0,
                tableWidth,
                tableHeight,
                graphics
            );
        }

        // Draw horizontal internal borders
        if (this.borders.horizontal) {
            for (let i = 1; i < rowPositions.length - 1; i++) {
                const y = rowPositions[i];
                if (y !== undefined) {
                    this.drawBorder(
                        this.borders.horizontal,
                        0,
                        y,
                        tableWidth,
                        y,
                        graphics
                    );
                }
            }
        }

        // Draw vertical internal borders
        if (this.borders.vertical) {
            for (let i = 1; i < columnPositions.length - 1; i++) {
                const x = columnPositions[i];
                if (x !== undefined) {
                    this.drawBorder(
                        this.borders.vertical,
                        x,
                        0,
                        x,
                        tableHeight,
                        graphics
                    );
                }
            }
        }

        graphics.restore();
    }

    /**
     * Draw a single border line
     */
    private drawBorder(
        border: TableBorder,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        graphics: IGraphicsContext
    ): void {
        const width = border.width ?? 1;
        const color = border.color ?? '#000000';

        graphics.setStrokeColor(this.parseColor(color));
        graphics.setLineWidth(width);

        // Handle different border styles
        switch (border.style) {
            case 'dashed':
                graphics.setLineDash([5, 3], 0);
                break;
            case 'dotted':
                graphics.setLineDash([2, 2], 0);
                break;
            default:
                graphics.setLineDash([], 0);
                break;
        }

        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        const tableData = this.getTableData();

        if (tableData.length === 0) {
            return this.createLayoutResult({ width: 0, height: 0 });
        }

        // Filter out null/undefined rows to prevent errors
        const validRows = tableData.filter(
            row => row !== null && row !== undefined
        );

        if (validRows.length === 0) {
            return this.createLayoutResult({ width: 0, height: 0 });
        }

        const columnCount = Math.max(...validRows.map(row => row.length));
        const rowCount = validRows.length;

        // Calculate available width
        const availableWidth =
            context.constraints.maxWidth === Number.POSITIVE_INFINITY
                ? 600 // Default table width
                : context.constraints.maxWidth;

        const columnWidths = this.calculateColumnWidths(
            availableWidth,
            columnCount
        );
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);

        // Calculate row heights (simplified)
        const defaultRowHeight = 40;
        const totalHeight = rowCount * defaultRowHeight;

        const size: Geometry.Size = {
            width: totalWidth,
            height: totalHeight,
        };

        const constrainedSize = this.constrainSize(context.constraints, size);
        return this.createLayoutResult(constrainedSize);
    }

    paint(context: Layout.PaintContext): void {
        const tableData = this.getTableData();

        if (tableData.length === 0) {
            return;
        }

        // Filter out null/undefined rows for safe processing
        const validRows = tableData.filter(
            row => row !== null && row !== undefined
        );

        if (validRows.length === 0) {
            return;
        }

        if (!context.graphics || !context.fontRegistry) {
            // Fallback for testing environments
            return;
        }

        const { graphics } = context;
        const columnCount = Math.max(...validRows.map(row => row.length));

        // Calculate available width
        const availableWidth = context.size.width;
        const columnWidths = this.calculateColumnWidths(
            availableWidth,
            columnCount
        );

        // Calculate row heights based on content
        const rowHeights = this.calculateRowHeights(
            validRows,
            columnWidths,
            context
        );

        graphics.save();

        // Draw table background if needed
        if (
            context.theme.colorScheme.surface !==
            context.theme.colorScheme.background
        ) {
            graphics.setFillColor(
                this.parseColor(context.theme.colorScheme.surface)
            );
            graphics.drawRect(0, 0, context.size.width, context.size.height);
            graphics.fillPath();
        }

        let currentY = 0;

        // Paint each row
        validRows.forEach((row, rowIndex) => {
            const rowHeight = rowHeights[rowIndex] ?? 40;
            let currentX = 0;

            // Draw row background if it's a header row and has header style
            if (rowIndex === 0 && this.headerStyle) {
                graphics.setFillColor(
                    this.parseColor(context.theme.colorScheme.primary)
                );
                graphics.drawRect(0, currentY, context.size.width, rowHeight);
                graphics.fillPath();
            }

            // Paint each cell in the row
            row.forEach((cell, colIndex) => {
                if (colIndex >= columnWidths.length) {
                    return;
                }

                const cellWidth = columnWidths[colIndex] ?? 0;
                const cellRect = {
                    x: currentX,
                    y: currentY,
                    width: cellWidth,
                    height: rowHeight,
                };

                // Apply cell padding
                const paddedRect = {
                    x: cellRect.x + this.cellPadding.left,
                    y: cellRect.y + this.cellPadding.top,
                    width:
                        cellRect.width -
                        this.cellPadding.left -
                        this.cellPadding.right,
                    height:
                        cellRect.height -
                        this.cellPadding.top -
                        this.cellPadding.bottom,
                };

                // Determine text overflow behavior (row-level overrides table-level)
                let textOverflow = this.textOverflow;
                let maxLines = this.maxLines;

                // Check if this row has override settings (when using TableRow children)
                if (this.children && rowIndex < this.children.length) {
                    const tableRow = this.children[rowIndex];
                    if (tableRow) {
                        const rowTextOverflow = tableRow.getTextOverflow();
                        const rowMaxLines = tableRow.getMaxLines();

                        if (rowTextOverflow !== undefined) {
                            textOverflow = rowTextOverflow;
                        }
                        if (rowMaxLines !== undefined) {
                            maxLines = rowMaxLines;
                        }
                    }
                }

                // Render cell content with overflow behavior
                this.paintCellContent(
                    cell,
                    paddedRect,
                    context,
                    rowIndex === 0 && !!this.headerStyle,
                    textOverflow,
                    maxLines
                );

                currentX += cellWidth;
            });

            currentY += rowHeight;
        });

        // Draw table borders
        if (this.borders) {
            this.paintTableBorders(columnWidths, rowHeights, context);
        }

        graphics.restore();
    }
}

/**
 * Table row widget
 */
export class TableRow extends BaseWidget {
    readonly children: Widget[];
    private readonly decoration?: {
        color?: string;
        border?: TableBorder;
    };
    private readonly verticalAlignment: TableCellVerticalAlignment;
    private readonly textOverflow?: TextOverflow;
    private readonly maxLines?: number;

    constructor(props: TableRowProps) {
        super(props);

        this.children = props.children;
        if (props.decoration) {
            this.decoration = props.decoration;
        }
        this.verticalAlignment =
            props.verticalAlignment ?? TableCellVerticalAlignment.Middle;
        if (props.textOverflow) {
            this.textOverflow = props.textOverflow;
        }
        if (props.maxLines) {
            this.maxLines = props.maxLines;
        }
    }

    /**
     * Get text overflow setting for this row
     */
    getTextOverflow(): TextOverflow | undefined {
        return this.textOverflow;
    }

    /**
     * Get max lines setting for this row
     */
    getMaxLines(): number | undefined {
        return this.maxLines;
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        // Layout each child cell
        let totalWidth = 0;
        let maxHeight = 0;

        for (const child of this.children) {
            const childResult = child.layout(context);
            totalWidth += childResult.size.width;
            maxHeight = Math.max(maxHeight, childResult.size.height);
        }

        const size: Geometry.Size = { width: totalWidth, height: maxHeight };
        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize);
    }

    paint(context: Layout.PaintContext): void {
        if (!context.graphics) {
            // Fallback for testing environments
            return;
        }

        const { graphics } = context;

        graphics.save();

        // Draw row decoration if specified
        if (this.decoration) {
            if (this.decoration.color) {
                graphics.setFillColor(this.parseColor(this.decoration.color));
                graphics.drawRect(
                    0,
                    0,
                    context.size.width,
                    context.size.height
                );
                graphics.fillPath();
            }

            if (this.decoration.border) {
                this.drawRowBorder(this.decoration.border, context);
            }
        }

        // Paint each cell - children will handle their own positioning and content
        this.children.forEach(child => {
            child.paint(context);
        });

        graphics.restore();
    }

    /**
     * Parse color string to PDF color object
     */
    private parseColor(colorStr: string): IPdfColor {
        // Simple hex color parser
        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { red: r, green: g, blue: b };
        }
        // Default to black
        return { red: 0, green: 0, blue: 0 };
    }

    /**
     * Draw row border decoration
     */
    private drawRowBorder(
        border: TableBorder,
        context: Layout.PaintContext
    ): void {
        if (!context.graphics) {
            return;
        }

        const { graphics } = context;
        const width = border.width ?? 1;
        const color = border.color ?? '#000000';

        graphics.setStrokeColor(this.parseColor(color));
        graphics.setLineWidth(width);

        // Handle different border styles
        switch (border.style) {
            case 'dashed':
                graphics.setLineDash([5, 3], 0);
                break;
            case 'dotted':
                graphics.setLineDash([2, 2], 0);
                break;
            default:
                graphics.setLineDash([], 0);
                break;
        }

        // Draw border around the entire row
        graphics.drawRect(0, 0, context.size.width, context.size.height);
        graphics.strokePath();
    }
}

/**
 * Base chart widget
 */
export class Chart extends BaseWidget {
    protected readonly title?: string;
    protected readonly series: ChartDataSeries[];
    protected readonly xAxis?: ChartAxis;
    protected readonly yAxis?: ChartAxis;
    protected readonly legend?: ChartLegend;
    protected readonly colors: string[];
    protected readonly width?: number;
    protected readonly height?: number;

    constructor(props: ChartProps) {
        super(props);

        if (props.title) {
            this.title = props.title;
        }
        this.series = props.series;
        if (props.xAxis) {
            this.xAxis = props.xAxis;
        }
        if (props.yAxis) {
            this.yAxis = props.yAxis;
        }
        if (props.legend) {
            this.legend = props.legend;
        }
        this.colors = props.colors ?? [
            '#1f77b4',
            '#ff7f0e',
            '#2ca02c',
            '#d62728',
            '#9467bd',
        ];
        if (props.width) {
            this.width = props.width;
        }
        if (props.height) {
            this.height = props.height;
        }
    }

    /**
     * Calculate chart dimensions
     */
    protected calculateChartSize(
        constraints: Layout.BoxConstraints
    ): Geometry.Size {
        const width = this.width ?? Math.min(400, constraints.maxWidth);
        const height = this.height ?? Math.min(300, constraints.maxHeight);

        return { width, height };
    }

    layout(context: Layout.LayoutContext): Layout.LayoutResult {
        this.validateConstraints(context.constraints);

        const size = this.calculateChartSize(context.constraints);
        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize);
    }

    paint(context: Layout.PaintContext): void {
        if (!context.graphics) {
            return;
        }

        const { graphics, fontRegistry } = context;

        // Chart layout constants
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartArea = {
            x: margin.left,
            y: margin.top,
            width: context.size.width - margin.left - margin.right,
            height: context.size.height - margin.top - margin.bottom,
        };

        // Draw chart background
        graphics.save();
        graphics.setFillColor(this.parseColor('#ffffff'));
        graphics.drawRect(0, 0, context.size.width, context.size.height);
        graphics.fillPath();

        // Draw chart border
        graphics.setStrokeColor(this.parseColor('#e0e0e0'));
        graphics.setLineWidth(1);
        graphics.drawRect(
            chartArea.x,
            chartArea.y,
            chartArea.width,
            chartArea.height
        );
        graphics.strokePath();

        // Draw title if present
        if (this.title && fontRegistry) {
            const font = fontRegistry.getFont('Helvetica');
            const titleFontSize = 16;

            graphics.save();
            graphics.setFillColor(this.parseColor('#333333'));
            graphics.scale(1, -1); // Flip for text

            // Center title - use accurate measurement if available
            let titleWidth = this.title.length * titleFontSize * 0.55; // Fallback
            if (context.textMeasurement) {
                try {
                    titleWidth = context.textMeasurement.measureTextWidth(
                        this.title,
                        titleFontSize,
                        'Helvetica'
                    );
                } catch (_error) {
                    // Keep fallback value
                }
            }
            const titleX = (context.size.width - titleWidth) / 2;
            const titleY = -20; // Negative because flipped

            graphics.drawString(
                font.getUnderlyingFont(),
                titleFontSize,
                this.title,
                titleX,
                titleY
            );
            graphics.restore();
        }

        // Draw axis labels if present
        if (this.xAxis?.title && fontRegistry) {
            const font = fontRegistry.getFont('Helvetica');
            const axisFontSize = 12;

            graphics.save();
            graphics.setFillColor(this.parseColor('#666666'));
            graphics.scale(1, -1);

            let labelWidth = this.xAxis.title.length * axisFontSize * 0.55; // Fallback
            if (context.textMeasurement) {
                try {
                    labelWidth = context.textMeasurement.measureTextWidth(
                        this.xAxis.title,
                        axisFontSize,
                        'Helvetica'
                    );
                } catch (_error) {
                    // Keep fallback value
                }
            }
            const labelX = chartArea.x + (chartArea.width - labelWidth) / 2;
            const labelY = -(context.size.height - 15);

            graphics.drawString(
                font.getUnderlyingFont(),
                axisFontSize,
                this.xAxis.title,
                labelX,
                labelY
            );
            graphics.restore();
        }

        if (this.yAxis?.title && fontRegistry) {
            const font = fontRegistry.getFont('Helvetica');
            const axisFontSize = 12;

            graphics.save();
            graphics.setFillColor(this.parseColor('#666666'));
            graphics.translate(15, chartArea.y + chartArea.height / 2);
            graphics.rotate(-Math.PI / 2); // Rotate for vertical text
            graphics.scale(1, -1);

            let labelWidth = this.yAxis.title.length * axisFontSize * 0.55; // Fallback
            if (context.textMeasurement) {
                try {
                    labelWidth = context.textMeasurement.measureTextWidth(
                        this.yAxis.title,
                        axisFontSize,
                        'Helvetica'
                    );
                } catch (_error) {
                    // Keep fallback value
                }
            }
            const labelX = -labelWidth / 2;
            const labelY = -axisFontSize * 0.3;

            graphics.drawString(
                font.getUnderlyingFont(),
                axisFontSize,
                this.yAxis.title,
                labelX,
                labelY
            );
            graphics.restore();
        }

        graphics.restore();

        // Series rendering would be handled by specific chart implementations
    }

    /**
     * Parse color string to color object
     */
    protected parseColor(colorStr: string): IPdfColor {
        // Simple hex color parser
        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return { red: r, green: g, blue: b };
        }
        // Default to black
        return { red: 0, green: 0, blue: 0 };
    }
}

/**
 * Bar chart widget
 */
export class BarChart extends Chart {
    private readonly orientation: BarOrientation;
    private readonly barWidth: number;
    private readonly barSpacing: number;

    constructor(props: BarChartProps) {
        super(props);

        this.orientation = props.orientation ?? BarOrientation.Vertical;
        this.barWidth = props.barWidth ?? 0.8;
        this.barSpacing = props.barSpacing ?? 0.2;
    }

    override paint(context: Layout.PaintContext): void {
        // First paint base chart (background, borders, title, axes)
        super.paint(context);

        if (!context.graphics || !context.fontRegistry) {
            // Fallback for testing - bar chart rendering not available
            return;
        }

        const { graphics, fontRegistry } = context;

        // Chart layout constants (same as parent)
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartArea = {
            x: margin.left,
            y: margin.top,
            width: context.size.width - margin.left - margin.right,
            height: context.size.height - margin.top - margin.bottom,
        };

        // Calculate data ranges
        const allValues = this.series.flatMap(s => s.data.map(d => d.y));
        const minValue = Math.min(0, ...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;

        // Calculate bar dimensions
        const totalDataPoints = Math.max(
            ...this.series.map(s => s.data.length)
        );
        const barGroupWidth = chartArea.width / totalDataPoints;
        const barWidth = (barGroupWidth * this.barWidth) / this.series.length;
        const barSpacing = barGroupWidth * this.barSpacing;

        graphics.save();

        // Draw bars for each series
        this.series.forEach((series, seriesIndex) => {
            const seriesColor =
                series.color ??
                this.colors[seriesIndex % this.colors.length] ??
                '#1f77b4';
            graphics.setFillColor(this.parseColor(seriesColor));

            series.data.forEach((point, pointIndex) => {
                // Calculate bar position and size
                const x =
                    chartArea.x +
                    pointIndex * barGroupWidth +
                    seriesIndex * (barWidth + barSpacing);
                const barHeight =
                    (Math.abs(point.y - minValue) / valueRange) *
                    chartArea.height;
                const y = chartArea.y + chartArea.height - barHeight;

                // Draw bar
                graphics.drawRect(x, y, barWidth, barHeight);
                graphics.fillPath();

                // Draw value label on top of bar
                const font = fontRegistry.getFont('Helvetica');
                const labelFontSize = 10;
                const label = String(point.y);

                graphics.save();
                graphics.setFillColor(this.parseColor('#333333'));
                graphics.scale(1, -1); // Flip for text

                // Position label above bar - use accurate measurement if available
                let labelWidth = label.length * labelFontSize * 0.55; // Fallback
                if (context.textMeasurement) {
                    try {
                        labelWidth = context.textMeasurement.measureTextWidth(
                            label,
                            labelFontSize,
                            'Helvetica'
                        );
                    } catch (_error) {
                        // Keep fallback value
                    }
                }
                const labelX = x + barWidth / 2 - labelWidth / 2;
                const labelY = -(y - 5); // Above bar (negative because flipped)

                graphics.drawString(
                    font.getUnderlyingFont(),
                    labelFontSize,
                    label,
                    labelX,
                    labelY
                );
                graphics.restore();
            });
        });

        graphics.restore();
    }
}

/**
 * Line chart widget
 */
export class LineChart extends Chart {
    private readonly fill: boolean;
    private readonly marker: LineMarker;
    private readonly lineWidth: number;

    constructor(props: LineChartProps) {
        super(props);

        this.fill = props.fill ?? false;
        this.marker = props.marker ?? LineMarker.Circle;
        this.lineWidth = props.lineWidth ?? 2;
    }

    override paint(context: Layout.PaintContext): void {
        // First paint base chart (background, borders, title, axes)
        super.paint(context);

        if (!context.graphics || !context.fontRegistry) {
            // Fallback for testing - line chart rendering not available
            return;
        }

        const { graphics, fontRegistry } = context;

        // Chart layout constants (same as parent)
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartArea = {
            x: margin.left,
            y: margin.top,
            width: context.size.width - margin.left - margin.right,
            height: context.size.height - margin.top - margin.bottom,
        };

        // Calculate data ranges
        const allValues = this.series.flatMap(s => s.data.map(d => d.y));
        const minValue = Math.min(0, ...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;

        graphics.save();

        // Draw lines for each series
        this.series.forEach((series, seriesIndex) => {
            const seriesColor =
                series.color ??
                this.colors[seriesIndex % this.colors.length] ??
                '#1f77b4';
            graphics.setStrokeColor(this.parseColor(seriesColor));
            graphics.setLineWidth(this.lineWidth);

            if (series.data.length > 1) {
                // Draw line segments
                for (let i = 1; i < series.data.length; i++) {
                    const prevPoint = series.data[i - 1];
                    const currPoint = series.data[i];

                    if (prevPoint && currPoint) {
                        // Calculate positions
                        const x1 =
                            chartArea.x +
                            (i - 1) *
                                (chartArea.width / (series.data.length - 1));
                        const y1 =
                            chartArea.y +
                            chartArea.height -
                            ((prevPoint.y - minValue) / valueRange) *
                                chartArea.height;
                        const x2 =
                            chartArea.x +
                            i * (chartArea.width / (series.data.length - 1));
                        const y2 =
                            chartArea.y +
                            chartArea.height -
                            ((currPoint.y - minValue) / valueRange) *
                                chartArea.height;

                        // Draw line segment
                        graphics.moveTo(x1, y1);
                        graphics.lineTo(x2, y2);
                        graphics.strokePath();
                    }
                }
            }

            // Draw markers if enabled
            if (this.marker !== LineMarker.None) {
                graphics.setFillColor(this.parseColor(seriesColor));
                const markerSize = 4;

                series.data.forEach((point, pointIndex) => {
                    const x =
                        chartArea.x +
                        pointIndex *
                            (chartArea.width / (series.data.length - 1));
                    const y =
                        chartArea.y +
                        chartArea.height -
                        ((point.y - minValue) / valueRange) * chartArea.height;

                    // Draw marker based on style
                    switch (this.marker) {
                        case LineMarker.Circle:
                            // Approximate circle with rounded square for now
                            graphics.drawRect(
                                x - markerSize / 2,
                                y - markerSize / 2,
                                markerSize,
                                markerSize
                            );
                            graphics.fillPath();
                            break;
                        case LineMarker.Square:
                            graphics.drawRect(
                                x - markerSize / 2,
                                y - markerSize / 2,
                                markerSize,
                                markerSize
                            );
                            graphics.fillPath();
                            break;
                        case LineMarker.Diamond:
                            // Simple diamond as rotated square
                            graphics.save();
                            graphics.translate(x, y);
                            graphics.rotate(Math.PI / 4);
                            graphics.drawRect(
                                -markerSize / 2,
                                -markerSize / 2,
                                markerSize,
                                markerSize
                            );
                            graphics.fillPath();
                            graphics.restore();
                            break;
                    }

                    // Draw value label near marker
                    const font = fontRegistry.getFont('Helvetica');
                    const labelFontSize = 9;
                    const label = String(point.y);

                    graphics.save();
                    graphics.setFillColor(this.parseColor('#333333'));
                    graphics.scale(1, -1); // Flip for text

                    let labelWidth = label.length * labelFontSize * 0.55; // Fallback
                    if (context.textMeasurement) {
                        try {
                            labelWidth =
                                context.textMeasurement.measureTextWidth(
                                    label,
                                    labelFontSize,
                                    'Helvetica'
                                );
                        } catch (_error) {
                            // Keep fallback value
                        }
                    }
                    const labelX = x - labelWidth / 2;
                    const labelY = -(y - 15); // Above marker (negative because flipped)

                    graphics.drawString(
                        font.getUnderlyingFont(),
                        labelFontSize,
                        label,
                        labelX,
                        labelY
                    );
                    graphics.restore();
                });
            }
        });

        graphics.restore();
    }
}

/**
 * Data visualization utilities - consolidated from various helpers
 */
export const DataUtils = {
    /**
     * Create table column width configurations
     */
    columnWidths: {
        fixed: (width: number): TableColumnWidth => ({
            type: TableColumnWidthType.Fixed,
            value: width,
        }),
        flex: (flex?: number): TableColumnWidth => {
            const result: TableColumnWidth & { value?: number } = {
                type: TableColumnWidthType.Flex,
            };
            if (flex !== undefined) {
                result.value = flex;
            }
            return result;
        },
        fraction: (fraction: number): TableColumnWidth => ({
            type: TableColumnWidthType.Fraction,
            value: fraction,
        }),
        intrinsic: (): TableColumnWidth => ({
            type: TableColumnWidthType.Intrinsic,
        }),
    },

    /**
     * Create table borders
     */
    borders: {
        all: (border: TableBorder): TableBorders => ({
            top: border,
            right: border,
            bottom: border,
            left: border,
            horizontal: border,
            vertical: border,
        }),
        outline: (border: TableBorder): TableBorders => ({
            top: border,
            right: border,
            bottom: border,
            left: border,
        }),
        horizontal: (border: TableBorder): TableBorders => ({
            horizontal: border,
        }),
        vertical: (border: TableBorder): TableBorders => ({
            vertical: border,
        }),
    },

    /**
     * Create chart data series
     */
    createSeries: (
        name: string,
        data: Array<{ x: number | string; y: number }>,
        color?: string
    ): ChartDataSeries => {
        const series: ChartDataSeries = {
            name,
            data: data.map(point => ({ ...point, label: String(point.x) })),
            ...(color && { color }), // Only include color if provided
        };
        return series;
    },

    /**
     * Create chart data from simple array
     */
    arrayToSeries: (
        name: string,
        values: number[],
        color?: string
    ): ChartDataSeries => {
        const series: ChartDataSeries = {
            name,
            data: values.map((y, x) => ({ x, y, label: String(x) })),
            ...(color && { color }), // Only include color if provided
        };
        return series;
    },

    /**
     * Generate chart color palette
     */
    generateColors: (count: number): string[] => {
        const baseColors = [
            '#1f77b4',
            '#ff7f0e',
            '#2ca02c',
            '#d62728',
            '#9467bd',
            '#8c564b',
            '#e377c2',
            '#7f7f7f',
        ];
        const colors: string[] = [];

        for (let i = 0; i < count; i++) {
            const color = baseColors[i % baseColors.length];
            if (color) {
                colors.push(color);
            }
        }

        return colors;
    },
};

/**
 * Convenience functions for creating data widgets
 */
export function createTable(props: TableProps = {}): Table {
    return new Table(props);
}

export function createTableRow(props: TableRowProps): TableRow {
    return new TableRow(props);
}

export function createChart(props: ChartProps): Chart {
    return new Chart(props);
}

export function createBarChart(props: BarChartProps): BarChart {
    return new BarChart(props);
}

export function createLineChart(props: LineChartProps): LineChart {
    return new LineChart(props);
}
