/**
 * Table widget implementation
 * 
 * Implements a comprehensive table system with:
 * - Constraint-based layout following the established widget patterns
 * - Multiple column width strategies (Fixed, Flex, Intrinsic, Fraction)
 * - Header row support with page spanning
 * - Table borders and cell decorations
 * - Integration with the theming system
 * 
 * @packageDocumentation
 */

import { BaseWidget, type Widget, type WidgetProps } from './widget.js';
import { Container } from './container.js';
import { Text } from './text.js';
import type {
    LayoutContext,
    LayoutResult,
    PaintContext,
    EdgeInsets,
} from '../types/layout.js';
import { BoxConstraints, EdgeInsets as EdgeInsetsUtils } from '../types/layout.js';
import type { Size, Point } from '../types/geometry.js';
import type { BoxDecoration } from './container.js';
import { PdfColorRgb, Matrix4 } from '../core/pdf/graphics.js';

/**
 * Table cell vertical alignment options
 */
export enum TableCellVerticalAlignment {
    Top = 'top',
    Middle = 'middle',
    Bottom = 'bottom',
    Full = 'full', // Stretch to fill cell height
}

/**
 * Table width behavior
 */
export enum TableWidth {
    /** Minimize table width to content */
    Min = 'min',
    /** Maximize table width to available space */
    Max = 'max',
}

/**
 * Border side configuration for tables
 */
export interface BorderSide {
    /** Border width in points */
    width: number;
    /** Border color (hex string) */
    color: string;
    /** Border style */
    style: 'solid' | 'dashed' | 'dotted' | 'none';
}

/**
 * Table-specific border configuration
 */
export interface TableBorder {
    /** Left border */
    left?: BorderSide;
    /** Top border */
    top?: BorderSide;
    /** Right border */
    right?: BorderSide;
    /** Bottom border */
    bottom?: BorderSide;
    /** Horizontal borders between rows */
    horizontalInside?: BorderSide;
    /** Vertical borders between columns */
    verticalInside?: BorderSide;
}

/**
 * Column layout result from width calculation
 */
export interface ColumnLayout {
    /** Calculated width in points */
    width: number;
    /** Flex value for remaining space distribution */
    flex: number;
}

/**
 * Abstract base class for table column width strategies
 */
export abstract class TableColumnWidth {
    /**
     * Calculate the layout for this column given constraints
     */
    abstract layout(
        child: Widget,
        context: LayoutContext,
        constraints: BoxConstraints
    ): ColumnLayout;
}

/**
 * Fixed width column - always uses the specified width
 */
export class FixedColumnWidth extends TableColumnWidth {
    constructor(private readonly width: number) {
        super();
    }

    layout(child: Widget, context: LayoutContext, constraints: BoxConstraints): ColumnLayout {
        return {
            width: this.width,
            flex: 0,
        };
    }
}

/**
 * Flexible width column - takes proportional share of remaining space
 */
export class FlexColumnWidth extends TableColumnWidth {
    constructor(private readonly flex: number = 1.0) {
        super();
    }

    layout(child: Widget, context: LayoutContext, constraints: BoxConstraints): ColumnLayout {
        return {
            width: 0, // Will be calculated based on available space
            flex: this.flex,
        };
    }
}

/**
 * Intrinsic width column - sizes to content with optional flex
 */
export class IntrinsicColumnWidth extends TableColumnWidth {
    constructor(private readonly flex?: number) {
        super();
    }

    layout(child: Widget, context: LayoutContext, constraints: BoxConstraints): ColumnLayout {
        if (this.flex !== undefined) {
            return {
                width: 0,
                flex: this.flex,
            };
        }

        const looseConstraints = BoxConstraints.expand();
        const childContext: LayoutContext = {
            ...context,
            constraints: looseConstraints,
        };
        const childLayout = child.layout(childContext);
        const childWidth = childLayout.size.width === Number.POSITIVE_INFINITY ? 0 : childLayout.size.width;

        // Determine flex based on child type (similar to Dart implementation)
        let childFlex = 0;
        if ((child as any).flexData?.flex) {
            childFlex = (child as any).flexData.flex;
        } else if (childLayout.size.width === Number.POSITIVE_INFINITY) {
            childFlex = 1;
        }

        return {
            width: childWidth,
            flex: childFlex,
        };
    }
}

/**
 * Fraction width column - takes percentage of total table width
 */
export class FractionColumnWidth extends TableColumnWidth {
    constructor(private readonly fraction: number) {
        super();
        if (fraction < 0 || fraction > 1) {
            throw new Error('Fraction must be between 0 and 1');
        }
    }

    layout(child: Widget, context: LayoutContext, constraints: BoxConstraints): ColumnLayout {
        return {
            width: constraints.maxWidth * this.fraction,
            flex: 0,
        };
    }
}

/**
 * Table row configuration
 */
export interface TableRowProps extends WidgetProps {
    /** Child widgets for each cell in the row */
    children: Widget[];
    /** Whether this row should repeat on new pages */
    repeat?: boolean;
    /** Vertical alignment for cells in this row */
    verticalAlignment?: TableCellVerticalAlignment;
    /** Row decoration (background, etc.) */
    decoration?: BoxDecoration;
}

/**
 * Table row widget
 */
export class TableRow extends BaseWidget {
    readonly children: Widget[];
    readonly repeat: boolean;
    readonly verticalAlignment?: TableCellVerticalAlignment;
    readonly decoration?: BoxDecoration;

    constructor(props: TableRowProps) {
        super(props);
        this.children = props.children;
        this.repeat = props.repeat ?? false;
        props.verticalAlignment && (this.verticalAlignment = props.verticalAlignment);
        props.decoration && (this.decoration = props.decoration);
    }

    layout(context: LayoutContext): LayoutResult {
        // TableRow layout is handled by the parent Table widget
        // This is just a container for row configuration
        return this.createLayoutResult({ width: 0, height: 0 });
    }

    paint(context: PaintContext): void {
        // TableRow painting is handled by the parent Table widget
    }
}

/**
 * Table context for spanning across pages
 */
interface TableContext {
    /** First row index to render */
    firstRow: number;
    /** Last row index to render */
    lastRow: number;
}

/**
 * Table widget properties
 */
export interface TableProps extends WidgetProps {
    /** Table rows */
    children?: TableRow[];
    /** Table border configuration */
    border?: TableBorder;
    /** Default vertical alignment for cells */
    defaultVerticalAlignment?: TableCellVerticalAlignment;
    /** Column width specifications */
    columnWidths?: Map<number, TableColumnWidth>;
    /** Default column width for unspecified columns */
    defaultColumnWidth?: TableColumnWidth;
    /** Table width behavior */
    tableWidth?: TableWidth;
}

/**
 * Child layout information for table cells
 */
interface CellLayoutInfo {
    widget: Widget;
    size: Size;
    position: Point;
    layoutResult: LayoutResult;
    rowIndex: number;
    columnIndex: number;
}

/**
 * Main Table widget implementation
 */
export class Table extends BaseWidget {
    public readonly children: TableRow[];
    private readonly border?: TableBorder;
    private readonly defaultVerticalAlignment: TableCellVerticalAlignment;
    private readonly columnWidths: Map<number, TableColumnWidth>;
    private readonly defaultColumnWidth: TableColumnWidth;
    private readonly tableWidth: TableWidth;

    // Layout calculation results
    private calculatedColumnWidths: number[] = [];
    private calculatedRowHeights: number[] = [];
    private cellLayouts: CellLayoutInfo[] = [];
    private tableContext: TableContext = { firstRow: 0, lastRow: 0 };

    constructor(props: TableProps = {}) {
        super(props);

        this.children = props.children ?? [];
        props.border && (this.border = props.border);
        this.defaultVerticalAlignment = props.defaultVerticalAlignment ?? TableCellVerticalAlignment.Top;
        this.columnWidths = props.columnWidths ?? new Map();
        this.defaultColumnWidth = props.defaultColumnWidth ?? new IntrinsicColumnWidth();
        this.tableWidth = props.tableWidth ?? TableWidth.Max;
    }

    /**
     * Get column width strategy for a specific column
     */
    private getColumnWidth(columnIndex: number): TableColumnWidth {
        return this.columnWidths.get(columnIndex) ?? this.defaultColumnWidth;
    }

    /**
     * Calculate optimal column widths using constraint-based approach
     */
    private calculateColumnWidths(context: LayoutContext): number[] {
        if (this.children.length === 0) {
            return [];
        }

        // Determine number of columns from first row
        const columnCount = Math.max(...this.children.map(row => row.children.length));
        const flexValues: number[] = new Array(columnCount).fill(0);
        const fixedWidths: number[] = new Array(columnCount).fill(0);

        // First pass: calculate intrinsic widths and collect flex values
        for (const row of this.children) {
            row.children.forEach((child, columnIndex) => {
                if (columnIndex >= columnCount) return;

                const columnWidth = this.getColumnWidth(columnIndex);
                const columnLayout = columnWidth.layout(child, context, context.constraints);

                if (columnLayout.flex > 0) {
                    flexValues[columnIndex] = Math.max(flexValues[columnIndex] ?? 0, columnLayout.flex);
                }
                fixedWidths[columnIndex] = Math.max(fixedWidths[columnIndex] ?? 0, columnLayout.width);
            });
        }

        // Calculate available space for flex columns
        const totalFixedWidth = fixedWidths.reduce((sum, width) => sum + width, 0);
        const totalFlex = flexValues.reduce((sum, flex) => sum + flex, 0);

        let availableWidth = context.constraints.maxWidth;
        if (availableWidth === Number.POSITIVE_INFINITY) {
            availableWidth = 800; // Default fallback
        }

        const remainingSpace = Math.max(0, availableWidth - totalFixedWidth);
        const flexUnit = totalFlex > 0 ? remainingSpace / totalFlex : 0;

        // Final column widths
        const finalWidths: number[] = [];
        for (let i = 0; i < columnCount; i++) {
            const flexValue = flexValues[i] ?? 0;
            if (flexValue > 0) {
                finalWidths[i] = flexValue * flexUnit;
            } else {
                let width = fixedWidths[i] ?? 0;
                // For TableWidth.Max, proportionally expand fixed columns if needed
                if (this.tableWidth === TableWidth.Max && totalFlex === 0) {
                    const scale = totalFixedWidth > 0 ? availableWidth / totalFixedWidth : 1;
                    width = Math.min(width, width * scale);
                }
                finalWidths[i] = width;
            }
        }

        return finalWidths;
    }

    /**
     * Layout all table cells and calculate positions
     */
    private layoutCells(context: LayoutContext): void {
        this.calculatedColumnWidths = this.calculateColumnWidths(context);
        this.calculatedRowHeights = [];
        this.cellLayouts = [];

        if (this.calculatedColumnWidths.length === 0) {
            return;
        }

        let currentY = 0;
        const rowCount = this.children.length;

        // Layout each row
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = this.children[rowIndex]!;
            let maxRowHeight = 0;
            let currentX = 0;

            // Layout each cell in the row
            for (let columnIndex = 0; columnIndex < row.children.length; columnIndex++) {
                const child = row.children[columnIndex]!;
                const columnWidth = this.calculatedColumnWidths[columnIndex] ?? 0;

                // Create constraints for this cell
                const cellConstraints: BoxConstraints = {
                    minWidth: columnWidth,
                    maxWidth: columnWidth,
                    minHeight: 0,
                    maxHeight: context.constraints.maxHeight - currentY,
                };

                const cellContext: LayoutContext = {
                    ...context,
                    constraints: cellConstraints,
                };

                // Layout the cell
                const cellLayout = child.layout(cellContext);
                maxRowHeight = Math.max(maxRowHeight, cellLayout.size.height);

                // Store cell layout info
                this.cellLayouts.push({
                    widget: child,
                    size: cellLayout.size,
                    position: { x: currentX, y: currentY },
                    layoutResult: cellLayout,
                    rowIndex,
                    columnIndex,
                });

                currentX += columnWidth;
            }

            // Handle vertical alignment within row
            const verticalAlignment = row.verticalAlignment ?? this.defaultVerticalAlignment;

            if (verticalAlignment === TableCellVerticalAlignment.Full) {
                // Re-layout cells with full height
                let tempX = 0;
                for (let columnIndex = 0; columnIndex < row.children.length; columnIndex++) {
                    const child = row.children[columnIndex]!;
                    const columnWidth = this.calculatedColumnWidths[columnIndex] ?? 0;

                    const fullHeightConstraints: BoxConstraints = {
                        minWidth: columnWidth,
                        maxWidth: columnWidth,
                        minHeight: maxRowHeight,
                        maxHeight: maxRowHeight,
                    };

                    const cellContext: LayoutContext = {
                        ...context,
                        constraints: fullHeightConstraints,
                    };

                    const cellLayout = child.layout(cellContext);

                    // Update the stored layout info
                    const cellInfo = this.cellLayouts.find(
                        c => c.rowIndex === rowIndex && c.columnIndex === columnIndex
                    );
                    if (cellInfo) {
                        cellInfo.size = cellLayout.size;
                        cellInfo.layoutResult = cellLayout;
                    }

                    tempX += columnWidth;
                }
            } else {
                // Adjust Y positions for vertical alignment
                for (const cellInfo of this.cellLayouts) {
                    if (cellInfo.rowIndex === rowIndex) {
                        switch (verticalAlignment) {
                            case TableCellVerticalAlignment.Middle:
                                cellInfo.position.y = currentY + (maxRowHeight - cellInfo.size.height) / 2;
                                break;
                            case TableCellVerticalAlignment.Bottom:
                                cellInfo.position.y = currentY + (maxRowHeight - cellInfo.size.height);
                                break;
                            case TableCellVerticalAlignment.Top:
                            default:
                                // Already positioned at top
                                break;
                        }
                    }
                }
            }

            this.calculatedRowHeights.push(maxRowHeight);
            currentY += maxRowHeight;

            // Check if we exceed available height (for page spanning)
            if (currentY > context.constraints.maxHeight) {
                this.tableContext.lastRow = rowIndex;
                break;
            }
        }

        if (this.tableContext.lastRow === 0) {
            this.tableContext.lastRow = rowCount;
        }
    }

    layout(context: LayoutContext): LayoutResult {
        this.validateConstraints(context.constraints);

        // Perform table layout calculations
        this.layoutCells(context);

        // Calculate final table size
        const totalWidth = this.calculatedColumnWidths.reduce((sum, width) => sum + width, 0);
        const totalHeight = this.calculatedRowHeights.reduce((sum, height) => sum + height, 0);

        const size: Size = {
            width: Math.min(totalWidth, context.constraints.maxWidth),
            height: Math.min(totalHeight, context.constraints.maxHeight),
        };

        const constrainedSize = this.constrainSize(context.constraints, size);

        return this.createLayoutResult(constrainedSize, {
            needsRepaint: true,
        });
    }

    /**
     * Parse color string to RGB values
     */
    private parseColor(color: string): PdfColorRgb {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 6) {
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                return new PdfColorRgb(r, g, b);
            } else if (hex.length === 3) {
                const r = parseInt(hex[0]! + hex[0]!, 16) / 255;
                const g = parseInt(hex[1]! + hex[1]!, 16) / 255;
                const b = parseInt(hex[2]! + hex[2]!, 16) / 255;
                return new PdfColorRgb(r, g, b);
            }
        }
        return PdfColorRgb.black;
    }

    /**
     * Paint table borders
     */
    private paintBorders(context: PaintContext): void {
        if (!this.border) return;

        const { graphics, size } = context;
        const { left, top, right, bottom, horizontalInside, verticalInside } = this.border;

        // Paint outer borders
        if (left?.style !== 'none' && left) {
            const color = this.parseColor(left.color);
            graphics.setColor(color);
            graphics.setLineWidth(left.width);
            graphics.drawLine(0, 0, 0, size.height);
            graphics.strokePath();
        }

        if (top?.style !== 'none' && top) {
            const color = this.parseColor(top.color);
            graphics.setColor(color);
            graphics.setLineWidth(top.width);
            graphics.drawLine(0, size.height, size.width, size.height);
            graphics.strokePath();
        }

        if (right?.style !== 'none' && right) {
            const color = this.parseColor(right.color);
            graphics.setColor(color);
            graphics.setLineWidth(right.width);
            graphics.drawLine(size.width, 0, size.width, size.height);
            graphics.strokePath();
        }

        if (bottom?.style !== 'none' && bottom) {
            const color = this.parseColor(bottom.color);
            graphics.setColor(color);
            graphics.setLineWidth(bottom.width);
            graphics.drawLine(0, 0, size.width, 0);
            graphics.strokePath();
        }

        // Paint vertical inside borders
        if (verticalInside?.style !== 'none' && verticalInside) {
            const color = this.parseColor(verticalInside.color);
            graphics.setColor(color);
            graphics.setLineWidth(verticalInside.width);

            let x = 0;
            for (let i = 0; i < this.calculatedColumnWidths.length - 1; i++) {
                x += this.calculatedColumnWidths[i]!;
                graphics.drawLine(x, 0, x, size.height);
            }
            graphics.strokePath();
        }

        // Paint horizontal inside borders
        if (horizontalInside?.style !== 'none' && horizontalInside) {
            const color = this.parseColor(horizontalInside.color);
            graphics.setColor(color);
            graphics.setLineWidth(horizontalInside.width);

            let y = size.height;
            for (let i = 0; i < this.calculatedRowHeights.length - 1; i++) {
                y -= this.calculatedRowHeights[i]!;
                graphics.drawLine(0, y, size.width, y);
            }
            graphics.strokePath();
        }
    }

    paint(context: PaintContext): void {
        if (this.children.length === 0) {
            return;
        }

        const { graphics } = context;

        graphics.saveContext();

        // Paint row decorations first (backgrounds)
        for (let rowIndex = this.tableContext.firstRow; rowIndex < this.tableContext.lastRow; rowIndex++) {
            const row = this.children[rowIndex];
            if (!row?.decoration) continue;

            // Find cells in this row to determine row bounds
            const rowCells = this.cellLayouts.filter(cell => cell.rowIndex === rowIndex);
            if (rowCells.length === 0) continue;

            const rowY = Math.min(...rowCells.map(cell => cell.position.y));
            const rowHeight = this.calculatedRowHeights[rowIndex] ?? 0;
            const rowWidth = this.calculatedColumnWidths.reduce((sum, width) => sum + width, 0);

            // Paint row background if decoration has a color
            if (row.decoration.color) {
                const bgColor = this.parseColor(row.decoration.color);
                graphics.setColor(bgColor);
                graphics.drawRect(0, rowY, rowWidth, rowHeight);
                graphics.fillPath();
            }
        }

        // Paint cells
        for (const cellInfo of this.cellLayouts) {
            if (cellInfo.rowIndex < this.tableContext.firstRow ||
                cellInfo.rowIndex >= this.tableContext.lastRow) {
                continue;
            }

            graphics.saveContext();

            // Transform to cell position
            const transform = new Matrix4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                cellInfo.position.x, cellInfo.position.y, 0, 1
            ]);
            graphics.setTransform(transform);

            // Clip to cell bounds
            graphics.drawRect(0, 0, cellInfo.size.width, cellInfo.size.height);
            // TODO: Implement clipping when graphics API supports it
            // graphics.clipPath();

            // Paint cell content
            const cellPaintContext: PaintContext = {
                ...context,
                size: cellInfo.size,
            };

            cellInfo.widget.paint(cellPaintContext);

            graphics.restoreContext();
        }

        // Paint borders on top
        this.paintBorders(context);

        graphics.restoreContext();
    }

    /**
     * Get table context for page spanning
     */
    getTableContext(): TableContext {
        return { ...this.tableContext };
    }

    /**
     * Set table context for page spanning
     */
    setTableContext(context: TableContext): void {
        this.tableContext = { ...context };
    }

    /**
     * Check if table has more content to render on next page
     */
    hasMoreContent(): boolean {
        return this.tableContext.lastRow < this.children.length;
    }
}

/**
 * Table border helper functions
 */
export const TableBorders = {
    /**
     * Create uniform border for all sides
     */
    all(options: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' } = {}): TableBorder {
        const borderSide: BorderSide = {
            width: options.width ?? 1,
            color: options.color ?? '#000000',
            style: options.style ?? 'solid',
        };

        return {
            left: borderSide,
            top: borderSide,
            right: borderSide,
            bottom: borderSide,
            horizontalInside: borderSide,
            verticalInside: borderSide,
        };
    },

    /**
     * Create border with different inside/outside styles
     */
    symmetric(options: {
        inside?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
        outside?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };
    } = {}): TableBorder {
        const outsideBorder: BorderSide = {
            width: options.outside?.width ?? 1,
            color: options.outside?.color ?? '#000000',
            style: options.outside?.style ?? 'solid',
        };

        const insideBorder: BorderSide = {
            width: options.inside?.width ?? 1,
            color: options.inside?.color ?? '#000000',
            style: options.inside?.style ?? 'solid',
        };

        return {
            left: outsideBorder,
            top: outsideBorder,
            right: outsideBorder,
            bottom: outsideBorder,
            horizontalInside: insideBorder,
            verticalInside: insideBorder,
        };
    },

    /**
     * No borders
     */
    none: {} as TableBorder,
};

/**
 * Convenience functions for creating table widgets
 */
export const TableHelpers = {
    /**
     * Create a simple table with text content
     */
    simple(data: string[][], options: {
        headers?: string[];
        border?: TableBorder;
        cellPadding?: EdgeInsets;
    } = {}): Table {
        const rows: TableRow[] = [];

        // Add header row if provided
        if (options.headers) {
            const headerCells = options.headers.map(header =>
                new Container({
                    padding: options.cellPadding ?? EdgeInsetsUtils.all(8),
                    child: new Text(header, {
                        style: { fontWeight: 'bold' as any },
                    }),
                })
            );
            rows.push(new TableRow({ children: headerCells, repeat: true }));
        }

        // Add data rows
        for (const rowData of data) {
            const cells = rowData.map(cellData =>
                new Container({
                    padding: options.cellPadding ?? EdgeInsetsUtils.all(8),
                    child: new Text(cellData),
                })
            );
            rows.push(new TableRow({ children: cells }));
        }

        return new Table({
            children: rows,
            border: options.border ?? TableBorders.all(),
        });
    },
};

/**
 * Convenience function to create a Table widget
 */
export function createTable(props: TableProps = {}): Table {
    return new Table(props);
}

/**
 * Convenience function to create a TableRow widget
 */
export function createTableRow(props: TableRowProps): TableRow {
    return new TableRow(props);
}