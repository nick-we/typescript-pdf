/**
 * Flex Layout Examples
 * 
 * Demonstrates the flex layout system capabilities including:
 * - Row and Column layouts
 * - Flexible and Expanded widgets
 * - Different alignment options
 * - Complex nested layouts
 * - Real-world use cases
 */

import { Document } from '../src/core/document.js';
import {
    Row,
    Column,
    Flexible,
    Expanded,
    FlexWidgets,
} from '../src/widgets/flex.js';
import { Text, TextStyles } from '../src/widgets/text.js';
import { Container, ContainerDecorations } from '../src/widgets/container.js';
import {
    MainAxisAlignment,
    CrossAxisAlignment,
    MainAxisSize,
    FlexFit,
} from '../src/types/flex.js';
import { EdgeInsets } from '../src/types/layout.js';

/**
 * Example 1: Basic Row Layout
 */
export async function basicRowExample(): Promise<Uint8Array> {
    const doc = new Document();

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Column({
                crossAxisAlignment: CrossAxisAlignment.Start,
                children: [
                    new Text('Basic Row Layout Examples', { style: TextStyles.h1 }),

                    // Simple horizontal layout
                    new Container({
                        margin: EdgeInsets.symmetric({ vertical: 10 }),
                        child: new Row({
                            children: [
                                new Text('Left'),
                                new Text('Center'),
                                new Text('Right'),
                            ],
                        }),
                    }),

                    // Row with spacing
                    new Container({
                        margin: EdgeInsets.symmetric({ vertical: 10 }),
                        child: new Row({
                            mainAxisSpacing: 20,
                            children: [
                                new Text('Spaced'),
                                new Text('Items'),
                                new Text('Here'),
                            ],
                        }),
                    }),

                    // Row with different alignments
                    new Text('MainAxisAlignment.Center:', { style: TextStyles.h3 }),
                    new Container({
                        decoration: { color: '#f0f0f0' },
                        padding: EdgeInsets.all(10),
                        child: new Row({
                            mainAxisAlignment: MainAxisAlignment.Center,
                            children: [
                                new Text('Centered'),
                                new Text('Content'),
                            ],
                        }),
                    }),

                    new Text('MainAxisAlignment.SpaceBetween:', { style: TextStyles.h3 }),
                    new Container({
                        decoration: { color: '#f0f0f0' },
                        padding: EdgeInsets.all(10),
                        child: new Row({
                            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                            children: [
                                new Text('Start'),
                                new Text('Middle'),
                                new Text('End'),
                            ],
                        }),
                    }),
                ],
            }),
        }),
    });

    return await doc.save();
}

/**
 * Example 2: Basic Column Layout
 */
export async function basicColumnExample(): Promise<Uint8Array> {
    const doc = new Document();

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Column({
                crossAxisAlignment: CrossAxisAlignment.Start,
                children: [
                    new Text('Basic Column Layout Examples', { style: TextStyles.h1 }),

                    // Simple vertical layout
                    new Container({
                        margin: EdgeInsets.symmetric({ vertical: 10 }),
                        decoration: { color: '#f9f9f9' },
                        padding: EdgeInsets.all(10),
                        child: new Column({
                            children: [
                                new Text('First Item'),
                                new Text('Second Item'),
                                new Text('Third Item'),
                            ],
                        }),
                    }),

                    // Column with spacing
                    new Text('With Spacing:', { style: TextStyles.h3 }),
                    new Container({
                        decoration: { color: '#f9f9f9' },
                        padding: EdgeInsets.all(10),
                        child: new Column({
                            mainAxisSpacing: 15,
                            children: [
                                new Text('Spaced Item 1'),
                                new Text('Spaced Item 2'),
                                new Text('Spaced Item 3'),
                            ],
                        }),
                    }),

                    // Cross axis alignment
                    new Text('CrossAxisAlignment.Center:', { style: TextStyles.h3 }),
                    new Container({
                        decoration: { color: '#f9f9f9' },
                        padding: EdgeInsets.all(10),
                        child: new Column({
                            crossAxisAlignment: CrossAxisAlignment.Center,
                            children: [
                                new Text('Centered'),
                                new Text('Text Items'),
                                new Text('Here'),
                            ],
                        }),
                    }),
                ],
            }),
        }),
    });

    return await doc.save();
}

/**
 * Example 3: Flexible and Expanded Widgets
 */
export async function flexibleExpandedExample(): Promise<Uint8Array> {
    const doc = new Document();

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Column({
                crossAxisAlignment: CrossAxisAlignment.Start,
                children: [
                    new Text('Flexible and Expanded Examples', { style: TextStyles.h1 }),

                    // Basic flexible layout
                    new Text('Basic Flexible Layout:', { style: TextStyles.h3 }),
                    new Container({
                        height: 50,
                        decoration: { color: '#e8f4fd' },
                        child: new Row({
                            children: [
                                new Text('Fixed'),
                                new Flexible({
                                    child: new Container({
                                        decoration: { color: '#b3d9ff' },
                                        child: new Text('Flexible'),
                                    }),
                                }),
                                new Text('Fixed'),
                            ],
                        }),
                    }),

                    // Expanded layout
                    new Text('Expanded Layout:', { style: TextStyles.h3 }),
                    new Container({
                        height: 50,
                        decoration: { color: '#f0f8e8' },
                        child: new Row({
                            children: [
                                new Text('Fixed'),
                                new Expanded({
                                    child: new Container({
                                        decoration: { color: '#c8e6c9' },
                                        child: new Text('Expanded'),
                                    }),
                                }),
                                new Text('Fixed'),
                            ],
                        }),
                    }),

                    // Multiple flex values
                    new Text('Different Flex Values:', { style: TextStyles.h3 }),
                    new Container({
                        height: 50,
                        decoration: { color: '#fff3e0' },
                        child: new Row({
                            children: [
                                new Expanded({
                                    flex: 1,
                                    child: new Container({
                                        decoration: { color: '#ffcc02' },
                                        child: new Text('Flex 1'),
                                    }),
                                }),
                                new Expanded({
                                    flex: 2,
                                    child: new Container({
                                        decoration: { color: '#ff9800' },
                                        child: new Text('Flex 2'),
                                    }),
                                }),
                                new Expanded({
                                    flex: 1,
                                    child: new Container({
                                        decoration: { color: '#ffcc02' },
                                        child: new Text('Flex 1'),
                                    }),
                                }),
                            ],
                        }),
                    }),

                    // Flexible vs Expanded
                    new Text('Flexible vs Expanded:', { style: TextStyles.h3 }),
                    new Text('Flexible (can be smaller):', { style: TextStyles.body }),
                    new Container({
                        height: 40,
                        decoration: { color: '#fce4ec' },
                        child: new Row({
                            children: [
                                new Flexible({
                                    child: new Container({
                                        decoration: { color: '#f48fb1' },
                                        child: new Text('Short'),
                                    }),
                                }),
                                new Text('Fixed'),
                            ],
                        }),
                    }),

                    new Text('Expanded (fills space):', { style: TextStyles.body }),
                    new Container({
                        height: 40,
                        decoration: { color: '#e1f5fe' },
                        child: new Row({
                            children: [
                                new Expanded({
                                    child: new Container({
                                        decoration: { color: '#4fc3f7' },
                                        child: new Text('Fills'),
                                    }),
                                }),
                                new Text('Fixed'),
                            ],
                        }),
                    }),
                ],
            }),
        }),
    });

    return await doc.save();
}

/**
 * Example 4: Complex Nested Layouts
 */
export async function nestedLayoutExample(): Promise<Uint8Array> {
    const doc = new Document();

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Column({
                children: [
                    new Text('Complex Nested Layout', { style: TextStyles.h1 }),

                    // Header section
                    new Container({
                        decoration: ContainerDecorations.card,
                        padding: EdgeInsets.all(15),
                        margin: EdgeInsets.symmetric({ vertical: 10 }),
                        child: new Row({
                            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                            children: [
                                new Column({
                                    crossAxisAlignment: CrossAxisAlignment.Start,
                                    children: [
                                        new Text('Document Title', { style: TextStyles.h2 }),
                                        new Text('Subtitle', { style: TextStyles.body }),
                                    ],
                                }),
                                new Column({
                                    crossAxisAlignment: CrossAxisAlignment.End,
                                    children: [
                                        new Text('Date: 2024-01-01', { style: TextStyles.caption }),
                                        new Text('Page 1', { style: TextStyles.caption }),
                                    ],
                                }),
                            ],
                        }),
                    }),

                    // Main content area
                    new Expanded({
                        child: new Row({
                            crossAxisAlignment: CrossAxisAlignment.Stretch,
                            children: [
                                // Left sidebar
                                new Container({
                                    width: 150,
                                    decoration: { color: '#f5f5f5' },
                                    padding: EdgeInsets.all(10),
                                    child: new Column({
                                        crossAxisAlignment: CrossAxisAlignment.Start,
                                        children: [
                                            new Text('Navigation', { style: TextStyles.h3 }),
                                            new Text('• Overview', { style: TextStyles.body }),
                                            new Text('• Details', { style: TextStyles.body }),
                                            new Text('• Settings', { style: TextStyles.body }),
                                        ],
                                    }),
                                }),

                                // Main content
                                new Expanded({
                                    child: new Container({
                                        padding: EdgeInsets.all(20),
                                        child: new Column({
                                            crossAxisAlignment: CrossAxisAlignment.Start,
                                            children: [
                                                new Text('Main Content Area', { style: TextStyles.h2 }),

                                                // Content cards
                                                new Row({
                                                    children: [
                                                        new Expanded({
                                                            child: new Container({
                                                                decoration: ContainerDecorations.outlined,
                                                                padding: EdgeInsets.all(15),
                                                                margin: EdgeInsets.only({ right: 10 }),
                                                                child: new Column({
                                                                    children: [
                                                                        new Text('Card 1', { style: TextStyles.h3 }),
                                                                        new Text('Some content here', { style: TextStyles.body }),
                                                                    ],
                                                                }),
                                                            }),
                                                        }),
                                                        new Expanded({
                                                            child: new Container({
                                                                decoration: ContainerDecorations.outlined,
                                                                padding: EdgeInsets.all(15),
                                                                margin: EdgeInsets.only({ left: 10 }),
                                                                child: new Column({
                                                                    children: [
                                                                        new Text('Card 2', { style: TextStyles.h3 }),
                                                                        new Text('More content here', { style: TextStyles.body }),
                                                                    ],
                                                                }),
                                                            }),
                                                        }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    }),
                                }),
                            ],
                        }),
                    }),

                    // Footer
                    new Container({
                        decoration: { color: '#f0f0f0' },
                        padding: EdgeInsets.all(10),
                        child: new Row({
                            mainAxisAlignment: MainAxisAlignment.Center,
                            children: [
                                new Text('Footer Content', { style: TextStyles.caption }),
                            ],
                        }),
                    }),
                ],
            }),
        }),
    });

    return await doc.save();
}

/**
 * Example 5: Real-world Invoice Layout
 */
export async function invoiceLayoutExample(): Promise<Uint8Array> {
    const doc = new Document();

    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(30),
            child: new Column({
                children: [
                    // Invoice header
                    new Row({
                        mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.Start,
                        children: [
                            new Column({
                                crossAxisAlignment: CrossAxisAlignment.Start,
                                children: [
                                    new Text('INVOICE', { style: TextStyles.h1 }),
                                    new Text('Invoice #: INV-2024-001', { style: TextStyles.body }),
                                    new Text('Date: January 15, 2024', { style: TextStyles.body }),
                                ],
                            }),
                            new Column({
                                crossAxisAlignment: CrossAxisAlignment.End,
                                children: [
                                    new Text('Your Company', { style: TextStyles.h2 }),
                                    new Text('123 Business Street', { style: TextStyles.body }),
                                    new Text('City, State 12345', { style: TextStyles.body }),
                                    new Text('phone@company.com', { style: TextStyles.body }),
                                ],
                            }),
                        ],
                    }),

                    // Spacing
                    new Container({ height: 30 }),

                    // Bill to section
                    new Row({
                        crossAxisAlignment: CrossAxisAlignment.Start,
                        children: [
                            new Expanded({
                                child: new Column({
                                    crossAxisAlignment: CrossAxisAlignment.Start,
                                    children: [
                                        new Text('Bill To:', { style: TextStyles.h3 }),
                                        new Text('Client Name', { style: TextStyles.body }),
                                        new Text('456 Client Avenue', { style: TextStyles.body }),
                                        new Text('Client City, State 67890', { style: TextStyles.body }),
                                    ],
                                }),
                            }),
                            new Expanded({
                                child: new Column({
                                    crossAxisAlignment: CrossAxisAlignment.Start,
                                    children: [
                                        new Text('Project:', { style: TextStyles.h3 }),
                                        new Text('Website Development', { style: TextStyles.body }),
                                        new Text('Duration: 2 weeks', { style: TextStyles.body }),
                                        new Text('Due Date: Feb 1, 2024', { style: TextStyles.body }),
                                    ],
                                }),
                            }),
                        ],
                    }),

                    // Spacing
                    new Container({ height: 30 }),

                    // Invoice items header
                    new Container({
                        decoration: { color: '#f0f0f0' },
                        padding: EdgeInsets.symmetric({ horizontal: 15, vertical: 10 }),
                        child: new Row({
                            children: [
                                new Expanded({
                                    flex: 3,
                                    child: new Text('Description', { style: TextStyles.h3 }),
                                }),
                                new Expanded({
                                    child: new Text('Qty', { style: TextStyles.h3 }),
                                }),
                                new Expanded({
                                    child: new Text('Rate', { style: TextStyles.h3 }),
                                }),
                                new Expanded({
                                    child: new Text('Amount', { style: TextStyles.h3 }),
                                }),
                            ],
                        }),
                    }),

                    // Invoice items
                    ...[
                        { desc: 'Frontend Development', qty: '80', rate: '$75.00', amount: '$6,000.00' },
                        { desc: 'Backend API Development', qty: '40', rate: '$75.00', amount: '$3,000.00' },
                        { desc: 'Database Setup', qty: '8', rate: '$75.00', amount: '$600.00' },
                        { desc: 'Testing & QA', qty: '16', rate: '$65.00', amount: '$1,040.00' },
                    ].map(item => new Container({
                        padding: EdgeInsets.symmetric({ horizontal: 15, vertical: 8 }),
                        decoration: { border: { width: 0.5, color: '#e0e0e0' } },
                        child: new Row({
                            children: [
                                new Expanded({
                                    flex: 3,
                                    child: new Text(item.desc, { style: TextStyles.body }),
                                }),
                                new Expanded({
                                    child: new Text(item.qty, { style: TextStyles.body }),
                                }),
                                new Expanded({
                                    child: new Text(item.rate, { style: TextStyles.body }),
                                }),
                                new Expanded({
                                    child: new Text(item.amount, { style: TextStyles.body }),
                                }),
                            ],
                        }),
                    })),

                    // Spacing
                    new Container({ height: 20 }),

                    // Total section
                    new Row({
                        mainAxisAlignment: MainAxisAlignment.End,
                        children: [
                            new Container({
                                width: 200,
                                child: new Column({
                                    children: [
                                        new Row({
                                            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                                            children: [
                                                new Text('Subtotal:', { style: TextStyles.body }),
                                                new Text('$10,640.00', { style: TextStyles.body }),
                                            ],
                                        }),
                                        new Row({
                                            mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                                            children: [
                                                new Text('Tax (8.5%):', { style: TextStyles.body }),
                                                new Text('$904.40', { style: TextStyles.body }),
                                            ],
                                        }),
                                        new Container({
                                            decoration: { border: { width: 1, color: '#000000' } },
                                            padding: EdgeInsets.symmetric({ vertical: 5 }),
                                            child: new Row({
                                                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                                                children: [
                                                    new Text('Total:', { style: TextStyles.h3 }),
                                                    new Text('$11,544.40', { style: TextStyles.h3 }),
                                                ],
                                            }),
                                        }),
                                    ],
                                }),
                            }),
                        ],
                    }),

                    // Footer notes
                    new Container({
                        margin: EdgeInsets.only({ top: 30 }),
                        child: new Column({
                            crossAxisAlignment: CrossAxisAlignment.Start,
                            children: [
                                new Text('Payment Terms:', { style: TextStyles.h3 }),
                                new Text('Payment is due within 30 days of invoice date.', { style: TextStyles.body }),
                                new Text('Late payments may incur a 1.5% monthly service charge.', { style: TextStyles.body }),
                            ],
                        }),
                    }),
                ],
            }),
        }),
    });

    return await doc.save();
}

/**
 * Helper function to create all examples
 */
export async function createAllFlexExamples(): Promise<{
    basicRow: Uint8Array;
    basicColumn: Uint8Array;
    flexibleExpanded: Uint8Array;
    nestedLayout: Uint8Array;
    invoiceLayout: Uint8Array;
}> {
    return {
        basicRow: await basicRowExample(),
        basicColumn: await basicColumnExample(),
        flexibleExpanded: await flexibleExpandedExample(),
        nestedLayout: await nestedLayoutExample(),
        invoiceLayout: await invoiceLayoutExample(),
    };
}

// Usage example (uncomment to run):
/*
createAllFlexExamples().then(examples => {
    console.log('Generated flex layout examples:');
    console.log(`- Basic Row: ${examples.basicRow.length} bytes`);
    console.log(`- Basic Column: ${examples.basicColumn.length} bytes`);
    console.log(`- Flexible/Expanded: ${examples.flexibleExpanded.length} bytes`);
    console.log(`- Nested Layout: ${examples.nestedLayout.length} bytes`);
    console.log(`- Invoice Layout: ${examples.invoiceLayout.length} bytes`);
}).catch(console.error);
*/