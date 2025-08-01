# Table Foundation Guide

The typescript-pdf Table Foundation provides comprehensive table functionality with constraint-based layout, advanced styling, and data-driven table generation. This guide covers all table features from basic usage to advanced customization.

## Table of Contents

1. [Basic Tables](#basic-tables)
2. [Column Width Strategies](#column-width-strategies)
3. [Table Borders and Styling](#table-borders-and-styling)
4. [Data-Driven Tables](#data-driven-tables)
5. [Table Helper Utilities](#table-helper-utilities)
6. [Advanced Features](#advanced-features)
7. [Page Spanning](#page-spanning)
8. [Theming Integration](#theming-integration)
9. [API Reference](#api-reference)

## Basic Tables

### Simple Table Creation

```typescript
import { Table, TableRow, Container, Text, EdgeInsets } from 'typescript-pdf';

// Create a basic table
const table = new Table({
    children: [
        new TableRow({
            children: [
                new Container({
                    padding: EdgeInsets.all(8),
                    child: new Text('Name'),
                }),
                new Container({
                    padding: EdgeInsets.all(8),
                    child: new Text('Age'),
                }),
            ],
        }),
        new TableRow({
            children: [
                new Container({
                    padding: EdgeInsets.all(8),
                    child: new Text('John Doe'),
                }),
                new Container({
                    padding: EdgeInsets.all(8),
                    child: new Text('30'),
                }),
            ],
        }),
    ],
});
```

### Using TableHelper for Quick Tables

```typescript
import { TableHelper } from 'typescript-pdf';

// Simple data-driven table
const table = TableHelper.simple([
    ['Name', 'Age', 'City'],
    ['John Doe', '30', 'New York'],
    ['Jane Smith', '25', 'Los Angeles'],
], {
    headers: ['Name', 'Age', 'City'],
    cellPadding: EdgeInsets.all(12),
});
```

## Column Width Strategies

The table system supports four column width strategies:

### FixedColumnWidth
Fixed pixel width columns:

```typescript
import { FixedColumnWidth } from 'typescript-pdf';

const columnWidths = new Map([
    [0, new FixedColumnWidth(100)], // First column: 100 points
    [1, new FixedColumnWidth(150)], // Second column: 150 points
]);
```

### FlexColumnWidth
Proportional space distribution:

```typescript
import { FlexColumnWidth } from 'typescript-pdf';

const columnWidths = new Map([
    [0, new FlexColumnWidth(1)], // Takes 1/3 of remaining space
    [1, new FlexColumnWidth(2)], // Takes 2/3 of remaining space
]);
```

### IntrinsicColumnWidth
Content-driven sizing:

```typescript
import { IntrinsicColumnWidth } from 'typescript-pdf';

const columnWidths = new Map([
    [0, new IntrinsicColumnWidth()], // Sizes to content
    [1, new IntrinsicColumnWidth(1)], // Sizes to content + flex
]);
```

### FractionColumnWidth
Percentage-based width:

```typescript
import { FractionColumnWidth } from 'typescript-pdf';

const columnWidths = new Map([
    [0, new FractionColumnWidth(0.3)], // 30% of table width
    [1, new FractionColumnWidth(0.7)], // 70% of table width
]);
```

### Mixed Column Strategies

```typescript
const columnWidths = new Map([
    [0, new FixedColumnWidth(80)],      // Fixed width for ID column
    [1, new FlexColumnWidth(2)],        // Flexible for description
    [2, new FractionColumnWidth(0.15)], // 15% for status
    [3, new IntrinsicColumnWidth()],    // Content-driven for actions
]);

const table = new Table({
    columnWidths,
    children: [...rows],
});
```

## Table Borders and Styling

### Basic Borders

```typescript
import { TableBorders } from 'typescript-pdf';

// Uniform borders
const uniformBorder = TableBorders.all({
    width: 1,
    color: '#000000',
    style: 'solid',
});

// Different inside/outside borders
const symmetricBorder = TableBorders.symmetric({
    outside: { width: 2, color: '#333333', style: 'solid' },
    inside: { width: 1, color: '#cccccc', style: 'solid' },
});

// No borders
const noBorder = TableBorders.none;
```

### Row Decorations

```typescript
const table = new Table({
    children: [
        new TableRow({
            children: [...cells],
            decoration: { color: '#f8f8f8' }, // Row background
            verticalAlignment: TableCellVerticalAlignment.Middle,
        }),
    ],
});
```

## Data-Driven Tables

### Custom Cell Formatting

```typescript
const table = TableHelper.fromTextArray({
    data: [
        [1200, 15.5, 'Growth'],
        [1350, 12.5, 'Growth'],
        [1180, -12.6, 'Decline'],
    ],
    headers: ['Revenue', 'Change %', 'Trend'],
    
    // Custom formatting
    cellFormat: (columnIndex, data, rowIndex) => {
        if (columnIndex === 0) {
            return `$${data.toLocaleString()}`; // Format as currency
        } else if (columnIndex === 1) {
            return `${data > 0 ? '+' : ''}${data}%`; // Add + for positive
        }
        return String(data);
    },
});
```

### Custom Cell Styling

```typescript
const table = TableHelper.fromTextArray({
    data: salesData,
    
    // Custom text styling
    textStyleBuilder: (columnIndex, data, rowIndex) => {
        if (columnIndex === 1 && typeof data === 'number') {
            return {
                color: data > 0 ? '#28a745' : '#dc3545',
                fontWeight: FontWeight.Bold,
            };
        }
        return undefined;
    },
    
    // Custom cell decorations
    cellDecoration: (columnIndex, data, rowIndex) => {
        if (columnIndex === 2) {
            return {
                color: data === 'Growth' ? '#e8f5e8' : '#ffe8e8'
            };
        }
        return undefined;
    },
});
```

## Table Helper Utilities

### Simple Tables
Quick tables with automatic formatting:

```typescript
const table = TableHelper.simple(data, {
    headers: ['Col1', 'Col2'],
    border: TableBorders.all(),
    cellPadding: EdgeInsets.all(8),
});
```

### Striped Tables
Alternating row colors:

```typescript
const table = TableHelper.striped(data, {
    headers: ['Task', 'Status'],
    evenRowColor: '#ffffff',
    oddRowColor: '#f8f9fa',
    headerColor: '#343a40',
});
```

### Bordered Tables
Heavy borders with header styling:

```typescript
const table = TableHelper.bordered(data, {
    headers: ['Feature', 'Status'],
    borderWidth: 2,
    borderColor: '#000000',
    headerBackgroundColor: '#cccccc',
});
```

### Minimal Tables
Clean, borderless design:

```typescript
const table = TableHelper.minimal(data, {
    headers: ['Item', 'Value'],
    cellPadding: EdgeInsets.symmetric({ horizontal: 16, vertical: 8 }),
});
```

## Advanced Features

### Header Row Repetition

```typescript
const table = new Table({
    children: [
        new TableRow({
            children: [...headerCells],
            repeat: true, // Repeat on each page
        }),
        ...dataRows,
    ],
});
```

### Vertical Cell Alignment

```typescript
const table = new Table({
    defaultVerticalAlignment: TableCellVerticalAlignment.Middle,
    children: [
        new TableRow({
            verticalAlignment: TableCellVerticalAlignment.Top, // Override default
            children: [...cells],
        }),
    ],
});
```

### Cell Alignment Options

```typescript
// Available alignment options:
TableCellVerticalAlignment.Top      // Align to top of cell
TableCellVerticalAlignment.Middle   // Center vertically
TableCellVerticalAlignment.Bottom   // Align to bottom
TableCellVerticalAlignment.Full     // Stretch to fill cell height
```

### Table Width Behavior

```typescript
const table = new Table({
    tableWidth: TableWidth.Max, // Expand to fill available width
    // tableWidth: TableWidth.Min, // Minimize to content width
});
```

## Page Spanning

### Basic Page Spanning Support

```typescript
// Tables automatically handle page breaks
const largeTable = new Table({
    children: manyRows, // Will span across pages as needed
});

// Check if table has more content
if (table.hasMoreContent()) {
    // Handle continuation on next page
}

// Manual context management
const context = table.getTableContext();
table.setTableContext({ firstRow: 0, lastRow: 50 });
```

### Header Repetition on Page Breaks

```typescript
const table = TableHelper.fromTextArray({
    data: largeDataset,
    headerCount: 2, // First 2 rows are headers
    headers: ['Month', 'Revenue'],
    // Headers automatically repeat on new pages
});
```

## Theming Integration

Tables integrate seamlessly with the theming system:

```typescript
import { ThemeUtils, FontWeight } from 'typescript-pdf';

// Create themed table
const professionalTheme = ThemeUtils.professional();

const table = TableHelper.fromTextArray({
    data: financialData,
    headers: ['Quarter', 'Revenue'],
    
    // Use theme colors
    headerStyle: {
        fontWeight: FontWeight.Bold,
        color: professionalTheme.colorScheme.onPrimary,
    },
    headerDecoration: {
        color: professionalTheme.colorScheme.primary,
    },
    
    // Themed cell styling
    textStyleBuilder: (columnIndex, data, rowIndex) => ({
        color: professionalTheme.colorScheme.onSurface,
        fontFamily: professionalTheme.typography.bodyMedium.fontFamily,
    }),
});
```

## API Reference

### Core Classes

#### Table
Main table widget with constraint-based layout.

```typescript
interface TableProps {
    children?: TableRow[];
    border?: TableBorder;
    defaultVerticalAlignment?: TableCellVerticalAlignment;
    columnWidths?: Map<number, TableColumnWidth>;
    defaultColumnWidth?: TableColumnWidth;
    tableWidth?: TableWidth;
}
```

#### TableRow
Container for table row with decoration and alignment options.

```typescript
interface TableRowProps {
    children: Widget[];
    repeat?: boolean;
    verticalAlignment?: TableCellVerticalAlignment;
    decoration?: BoxDecoration;
}
```

#### TableHelper
Utility class for data-driven table creation.

```typescript
class TableHelper {
    static fromTextArray(options: FromTextArrayOptions): Table;
    static simple(data: any[][], options?: SimpleOptions): Table;
    static striped(data: any[][], options?: StripedOptions): Table;
    static bordered(data: any[][], options?: BorderedOptions): Table;
    static minimal(data: any[][], options?: MinimalOptions): Table;
}
```

### Column Width Strategies

```typescript
abstract class TableColumnWidth {
    abstract layout(child: Widget, context: LayoutContext, constraints: BoxConstraints): ColumnLayout;
}

class FixedColumnWidth extends TableColumnWidth {
    constructor(width: number);
}

class FlexColumnWidth extends TableColumnWidth {
    constructor(flex?: number);
}

class IntrinsicColumnWidth extends TableColumnWidth {
    constructor(flex?: number);
}

class FractionColumnWidth extends TableColumnWidth {
    constructor(fraction: number); // 0.0 to 1.0
}
```

### Border Configuration

```typescript
interface TableBorder {
    left?: BorderSide;
    top?: BorderSide;
    right?: BorderSide;
    bottom?: BorderSide;
    horizontalInside?: BorderSide;
    verticalInside?: BorderSide;
}

interface BorderSide {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
}
```

## Examples

See the comprehensive examples in:
- [`examples/table-showcase.ts`](../examples/table-showcase.ts) - Complete table feature demonstrations
- [`src/test/table.test.ts`](../src/test/table.test.ts) - Unit tests showing all functionality

## Migration from Other Libraries

### From dart-pdf
The Table implementation closely follows dart-pdf patterns:

```dart
// Dart PDF
Table(
  children: [
    TableRow(children: [...])
  ],
  border: TableBorder.all(),
)

// typescript-pdf equivalent
new Table({
  children: [
    new TableRow({ children: [...] })
  ],
  border: TableBorders.all(),
})
```

### From HTML Tables
HTML table concepts map directly to typescript-pdf:

```html
<!-- HTML -->
<table border="1">
  <tr><th>Header</th></tr>
  <tr><td>Data</td></tr>
</table>
```

```typescript
// typescript-pdf
TableHelper.simple([['Data']], {
  headers: ['Header'],
  border: TableBorders.all(),
})
```

## Performance Considerations

- **Large Tables**: Use page spanning for tables with many rows
- **Column Width**: Fixed and Fraction widths are most performant
- **Cell Content**: Simple text performs better than complex widgets
- **Borders**: Minimize border complexity for better performance
- **Memory**: Tables cache layout calculations for efficiency

## Best Practices

1. **Use TableHelper** for data-driven tables
2. **Set explicit column widths** for consistent layouts
3. **Use header repetition** for multi-page tables
4. **Apply consistent cell padding** for readable layouts
5. **Leverage theming** for consistent styling
6. **Test with large datasets** to ensure performance
7. **Use appropriate vertical alignment** for cell content

The Table Foundation provides enterprise-grade table functionality with the flexibility and type safety expected from a modern TypeScript library.