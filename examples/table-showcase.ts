/**
 * Table Showcase Example
 * 
 * Demonstrates the comprehensive table functionality including:
 * - Basic tables with headers
 * - Column width strategies
 * - Table borders and styling
 * - Data-driven tables with formatting
 * - Complex layouts with decorations
 * 
 * @packageDocumentation
 */

import { Document, Table, TableRow, TableBorders, TableHelper, Container, Text } from '../src/index.js';
import {
    FixedColumnWidth,
    FlexColumnWidth,
    IntrinsicColumnWidth,
    FractionColumnWidth,
    TableCellVerticalAlignment,
    TableWidth,
    type TableColumnWidth,
} from '../src/widgets/table.js';
import { EdgeInsets } from '../src/types/layout.js';
import { FontWeight } from '../src/types/theming.js';

async function createTableShowcase() {
    const doc = new Document();

    // Example 1: Simple Table with Headers
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: TableHelper.simple([
                ['Product', 'Price', 'Stock'],
                ['Laptop', '$999', '15'],
                ['Mouse', '$25', '50'],
                ['Keyboard', '$75', '30'],
            ], {
                headers: ['Product', 'Price', 'Stock'],
                border: TableBorders.all({ width: 1, color: '#000000' }),
                cellPadding: EdgeInsets.all(12),
            }),
        }),
    });

    // Example 2: Advanced Table with Column Width Strategies
    const columnWidths = new Map<number, TableColumnWidth>([
        [0, new FixedColumnWidth(150)],      // Fixed width for names
        [1, new FlexColumnWidth(2)],         // Flex for descriptions
        [2, new FractionColumnWidth(0.15)],  // 15% for numbers
        [3, new IntrinsicColumnWidth()],     // Content-driven
    ]);

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Table({
                columnWidths,
                border: TableBorders.symmetric({
                    outside: { width: 2, color: '#333333', style: 'solid' },
                    inside: { width: 1, color: '#cccccc', style: 'solid' },
                }),
                children: [
                    new TableRow({
                        children: [
                            new Container({
                                padding: EdgeInsets.all(8),
                                decoration: { color: '#f0f0f0' },
                                child: new Text('Name', {
                                    style: { fontWeight: FontWeight.Bold }
                                }),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                decoration: { color: '#f0f0f0' },
                                child: new Text('Description', {
                                    style: { fontWeight: FontWeight.Bold }
                                }),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                decoration: { color: '#f0f0f0' },
                                child: new Text('Score', {
                                    style: { fontWeight: FontWeight.Bold }
                                }),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                decoration: { color: '#f0f0f0' },
                                child: new Text('Status', {
                                    style: { fontWeight: FontWeight.Bold }
                                }),
                            }),
                        ],
                        repeat: true,
                    }),
                    new TableRow({
                        children: [
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('John Smith'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('Senior Developer with expertise in TypeScript and PDF generation'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('95%'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('Active'),
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('Jane Doe'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('UI/UX Designer focused on creating beautiful interfaces'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('88%'),
                            }),
                            new Container({
                                padding: EdgeInsets.all(8),
                                child: new Text('Away'),
                            }),
                        ],
                        decoration: { color: '#f8f8f8' },
                    }),
                ],
            }),
        }),
    });

    // Example 3: Data-Driven Table with Custom Formatting
    const salesData = [
        ['January', 1200, 15.5, 'Growth'],
        ['February', 1350, 12.5, 'Growth'],
        ['March', 1180, -12.6, 'Decline'],
        ['April', 1420, 20.3, 'Growth'],
        ['May', 1380, -2.8, 'Decline'],
    ];

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: TableHelper.fromTextArray({
                data: salesData,
                headers: ['Month', 'Revenue', 'Change %', 'Trend'],
                border: TableBorders.all({ width: 1, color: '#ddd', style: 'solid' }),
                headerStyle: {
                    fontWeight: FontWeight.Bold,
                    color: '#ffffff'
                },
                headerDecoration: { color: '#4a90e2' },
                cellPadding: EdgeInsets.all(10),

                // Custom cell formatting
                cellFormat: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex === 1) {
                        // Format revenue as currency
                        return `$${data.toLocaleString()}`;
                    } else if (columnIndex === 2) {
                        // Format percentage with sign
                        return `${data > 0 ? '+' : ''}${data}%`;
                    }
                    return String(data);
                },

                // Custom cell decorations
                cellDecoration: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex === 3) {
                        // Color-code trend column
                        return {
                            color: data === 'Growth' ? '#e8f5e8' : '#ffe8e8'
                        };
                    }
                    return undefined;
                },

                // Custom text styling
                textStyleBuilder: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex === 2) {
                        // Color-code percentage changes
                        return {
                            color: data > 0 ? '#28a745' : '#dc3545',
                            fontWeight: FontWeight.Bold,
                        };
                    } else if (columnIndex === 3) {
                        return {
                            fontWeight: FontWeight.Bold,
                            color: data === 'Growth' ? '#28a745' : '#dc3545',
                        };
                    }
                    return undefined;
                },
            }),
        }),
    });

    // Example 4: Striped Table with Alternating Colors
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: TableHelper.striped([
                ['Task', 'Assignee', 'Priority', 'Due Date'],
                ['Design UI mockups', 'Alice Johnson', 'High', '2024-01-15'],
                ['Implement authentication', 'Bob Smith', 'Critical', '2024-01-10'],
                ['Write unit tests', 'Charlie Brown', 'Medium', '2024-01-20'],
                ['Deploy to staging', 'Diana Prince', 'Low', '2024-01-25'],
                ['Code review', 'Eve Wilson', 'High', '2024-01-12'],
            ], {
                headers: ['Task', 'Assignee', 'Priority', 'Due Date'],
                border: TableBorders.all({ width: 1, color: '#e0e0e0' }),
                evenRowColor: '#ffffff',
                oddRowColor: '#f8f9fa',
                headerColor: '#343a40',
                cellPadding: EdgeInsets.all(12),
            }),
        }),
    });

    // Example 5: Minimal Table (No Borders)
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: TableHelper.minimal([
                ['Feature', 'Status'],
                ['User Authentication', '✓ Complete'],
                ['Data Validation', '✓ Complete'],
                ['File Upload', '⏳ In Progress'],
                ['Email Notifications', '⏳ In Progress'],
                ['API Documentation', '❌ Pending'],
            ], {
                headers: ['Feature', 'Status'],
                cellPadding: EdgeInsets.symmetric({ horizontal: 16, vertical: 8 }),
                headerStyle: {
                    fontWeight: FontWeight.Bold,
                    fontSize: 14,
                    color: '#2c3e50'
                },
            }),
        }),
    });

    // Example 6: Complex Financial Report Table
    const financialData = [
        ['Q1 2023', 125000, 95000, 30000, 24.0],
        ['Q2 2023', 138000, 102000, 36000, 26.1],
        ['Q3 2023', 145000, 108000, 37000, 25.5],
        ['Q4 2023', 162000, 118000, 44000, 27.2],
    ];

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: TableHelper.fromTextArray({
                data: financialData,
                headers: ['Quarter', 'Revenue', 'Expenses', 'Profit', 'Margin %'],

                // Custom column widths for financial data
                columnWidths: new Map<number, TableColumnWidth>([
                    [0, new FixedColumnWidth(80)],   // Quarter
                    [1, new FlexColumnWidth(1)],     // Revenue
                    [2, new FlexColumnWidth(1)],     // Expenses
                    [3, new FlexColumnWidth(1)],     // Profit
                    [4, new FixedColumnWidth(70)],   // Margin %
                ]),

                border: TableBorders.all({ width: 1, color: '#dee2e6' }),
                headerStyle: {
                    fontWeight: FontWeight.Bold,
                    color: '#ffffff',
                    fontSize: 12,
                },
                headerDecoration: { color: '#495057' },
                cellPadding: EdgeInsets.all(10),

                // Format financial numbers
                cellFormat: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex >= 1 && columnIndex <= 3) {
                        // Format as currency
                        return `$${(data / 1000).toFixed(0)}K`;
                    } else if (columnIndex === 4) {
                        // Format as percentage
                        return `${data.toFixed(1)}%`;
                    }
                    return String(data);
                },

                // Highlight profitable quarters
                rowDecoration: { color: '#f8f9fa' },
                oddRowDecoration: { color: '#ffffff' },

                // Color-code profit margins
                textStyleBuilder: (columnIndex: number, data: any, rowIndex: number) => {
                    if (columnIndex === 4) {
                        if (data >= 26.0) {
                            return { color: '#28a745', fontWeight: FontWeight.Bold };
                        } else if (data >= 25.0) {
                            return { color: '#ffc107', fontWeight: FontWeight.Bold };
                        } else {
                            return { color: '#dc3545', fontWeight: FontWeight.Bold };
                        }
                    }
                    return undefined;
                },
            }),
        }),
    });

    return doc.save();
}

// Export for use in other examples
export { createTableShowcase };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createTableShowcase()
        .then(pdfBytes => {
            console.log(`Generated table showcase PDF: ${pdfBytes.length} bytes`);
        })
        .catch(console.error);
}