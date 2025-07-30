/**
 * Example demonstrating the new positioning widgets
 * 
 * This example shows how to use Padding, Margin, Align, Center, 
 * Positioned, and Stack widgets for complex layouts.
 */

import {
    Document,
    Text,
    Container,
    Padding,
    Margin,
    Align,
    Center,
    Positioned,
    Stack,
    StackFit,
    EdgeInsets,
    Alignment,
    BorderRadiusUtils,
    BorderStyle,
    TextStyles,
    ContainerDecorations,
    PaddingHelpers,
    MarginHelpers,
    AlignHelpers,
    CenterHelpers,
    PositionedHelpers,
    StackHelpers,
} from '../src/index.js';

async function createPositioningExample() {
    const doc = new Document();

    // Page 1: Basic Padding and Margin Examples
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Stack({
                children: [
                    // Title
                    new Positioned({
                        child: new Text('Positioning Widgets Demo', {
                            style: TextStyles.h1,
                        }),
                        left: 0,
                        top: 0,
                    }),

                    // Padding example
                    new Positioned({
                        child: new Container({
                            width: 250,
                            decoration: {
                                color: '#f0f8ff',
                                border: {
                                    width: 2,
                                    color: '#4169e1',
                                    style: BorderStyle.Solid,
                                },
                                borderRadius: BorderRadiusUtils.all(8),
                            },
                            child: new Padding({
                                padding: EdgeInsets.all(20),
                                child: new Text('This text has 20pt padding on all sides', {
                                    style: { fontSize: 12, color: '#333333' },
                                }),
                            }),
                        }),
                        left: 0,
                        top: 60,
                    }),

                    // Margin example
                    new Positioned({
                        child: new Container({
                            decoration: {
                                color: '#fff8dc',
                                border: {
                                    width: 1,
                                    color: '#daa520',
                                    style: BorderStyle.Solid,
                                },
                            },
                            child: new Margin({
                                margin: EdgeInsets.symmetric({
                                    horizontal: 30,
                                    vertical: 15,
                                }),
                                child: new Text('This text has asymmetric margins', {
                                    style: { fontSize: 12, color: '#8b4513' },
                                }),
                            }),
                        }),
                        left: 0,
                        top: 150,
                    }),

                    // Align example
                    new Positioned({
                        child: new Container({
                            width: 200,
                            height: 80,
                            decoration: {
                                color: '#f5f5dc',
                                border: {
                                    width: 1,
                                    color: '#d2691e',
                                    style: BorderStyle.Dashed,
                                },
                            },
                            child: new Align({
                                alignment: Alignment.BottomRight,
                                child: new Text('Bottom-right aligned', {
                                    style: { fontSize: 10, color: '#8b0000' },
                                }),
                            }),
                        }),
                        left: 0,
                        top: 230,
                    }),

                    // Center example
                    new Positioned({
                        child: new Container({
                            width: 200,
                            height: 80,
                            decoration: {
                                color: '#e6e6fa',
                                border: {
                                    width: 1,
                                    color: '#9370db',
                                    style: BorderStyle.Solid,
                                },
                            },
                            child: new Center({
                                child: new Text('Perfectly centered!', {
                                    style: { fontSize: 12, fontWeight: 'bold', color: '#4b0082' },
                                }),
                            }),
                        }),
                        left: 220,
                        top: 230,
                    }),
                ],
                fit: StackFit.Expand,
            }),
        }),
    });

    // Page 2: Advanced Stack and Positioning Examples
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Stack({
                children: [
                    // Background layer
                    PositionedHelpers.fill(new Container({
                        decoration: {
                            color: '#f8f8ff',
                        },
                    })),

                    // Title
                    new Positioned({
                        child: new Text('Advanced Layered Layout', {
                            style: TextStyles.h1,
                        }),
                        left: 0,
                        top: 0,
                    }),

                    // Card stack example
                    new Positioned({
                        child: new Stack({
                            children: [
                                // Bottom card
                                PositionedHelpers.at(
                                    new Container({
                                        width: 180,
                                        height: 120,
                                        decoration: {
                                            color: '#ffe4e1',
                                            border: {
                                                width: 2,
                                                color: '#cd5c5c',
                                                style: BorderStyle.Solid,
                                            },
                                            borderRadius: BorderRadiusUtils.all(12),
                                        },
                                        child: CenterHelpers.simple(
                                            new Text('Card 1', {
                                                style: { fontSize: 16, fontWeight: 'bold' },
                                            })
                                        ),
                                    }),
                                    10, 10
                                ),

                                // Middle card
                                PositionedHelpers.at(
                                    new Container({
                                        width: 180,
                                        height: 120,
                                        decoration: {
                                            color: '#e0ffff',
                                            border: {
                                                width: 2,
                                                color: '#20b2aa',
                                                style: BorderStyle.Solid,
                                            },
                                            borderRadius: BorderRadiusUtils.all(12),
                                        },
                                        child: CenterHelpers.simple(
                                            new Text('Card 2', {
                                                style: { fontSize: 16, fontWeight: 'bold' },
                                            })
                                        ),
                                    }),
                                    20, 20
                                ),

                                // Top card
                                PositionedHelpers.at(
                                    new Container({
                                        width: 180,
                                        height: 120,
                                        decoration: {
                                            color: '#f0fff0',
                                            border: {
                                                width: 2,
                                                color: '#32cd32',
                                                style: BorderStyle.Solid,
                                            },
                                            borderRadius: BorderRadiusUtils.all(12),
                                        },
                                        child: CenterHelpers.simple(
                                            new Text('Card 3', {
                                                style: { fontSize: 16, fontWeight: 'bold' },
                                            })
                                        ),
                                    }),
                                    30, 30
                                ),
                            ],
                            fit: StackFit.Loose,
                        }),
                        left: 50,
                        top: 60,
                    }),

                    // Corner positioned elements
                    PositionedHelpers.topLeft(
                        new Container({
                            padding: EdgeInsets.all(8),
                            decoration: ContainerDecorations.card,
                            child: new Text('Top Left', {
                                style: { fontSize: 10 },
                            }),
                        }),
                        10
                    ),

                    PositionedHelpers.topRight(
                        new Container({
                            padding: EdgeInsets.all(8),
                            decoration: ContainerDecorations.card,
                            child: new Text('Top Right', {
                                style: { fontSize: 10 },
                            }),
                        }),
                        10
                    ),

                    PositionedHelpers.bottomLeft(
                        new Container({
                            padding: EdgeInsets.all(8),
                            decoration: ContainerDecorations.card,
                            child: new Text('Bottom Left', {
                                style: { fontSize: 10 },
                            }),
                        }),
                        10
                    ),

                    PositionedHelpers.bottomRight(
                        new Container({
                            padding: EdgeInsets.all(8),
                            decoration: ContainerDecorations.card,
                            child: new Text('Bottom Right', {
                                style: { fontSize: 10 },
                            }),
                        }),
                        10
                    ),

                    // Centered content
                    new Positioned({
                        child: new Center({
                            widthFactor: 0.8,
                            heightFactor: 0.6,
                            child: new Container({
                                padding: EdgeInsets.all(20),
                                decoration: {
                                    color: '#fffaf0',
                                    border: {
                                        width: 3,
                                        color: '#ff6347',
                                        style: BorderStyle.Solid,
                                    },
                                    borderRadius: BorderRadiusUtils.circular(20),
                                },
                                child: new Text('This is centered with\n80% width and 60% height factors', {
                                    style: {
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        color: '#8b0000',
                                    },
                                }),
                            }),
                        }),
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                    }),
                ],
                fit: StackFit.Expand,
            }),
        }),
    });

    // Page 3: Helper Functions Examples
    doc.addPage({
        build: () => new Container({
            padding: EdgeInsets.all(20),
            child: new Stack({
                children: [
                    // Title
                    new Positioned({
                        child: new Text('Helper Functions Showcase', {
                            style: TextStyles.h1,
                        }),
                        left: 0,
                        top: 0,
                    }),

                    // Padding helpers
                    new Positioned({
                        child: new Container({
                            decoration: {
                                color: '#f0f8ff',
                                border: { width: 1, color: '#4682b4', style: BorderStyle.Solid },
                            },
                            child: PaddingHelpers.symmetric(
                                new Text('Symmetric padding (h:20, v:10)', {
                                    style: { fontSize: 11 },
                                }),
                                { horizontal: 20, vertical: 10 }
                            ),
                        }),
                        left: 0,
                        top: 50,
                    }),

                    // Margin helpers
                    new Positioned({
                        child: new Container({
                            decoration: {
                                color: '#fff8dc',
                                border: { width: 1, color: '#daa520', style: BorderStyle.Solid },
                            },
                            child: MarginHelpers.only(
                                new Text('Only left and bottom margins', {
                                    style: { fontSize: 11 },
                                }),
                                { left: 15, bottom: 8 }
                            ),
                        }),
                        left: 0,
                        top: 100,
                    }),

                    // Align helpers
                    new Positioned({
                        child: new Container({
                            width: 200,
                            height: 60,
                            decoration: {
                                color: '#fafad2',
                                border: { width: 1, color: '#bdb76b', style: BorderStyle.Dashed },
                            },
                            child: AlignHelpers.bottomCenter(
                                new Text('Bottom center aligned', {
                                    style: { fontSize: 11, fontWeight: 'bold' },
                                })
                            ),
                        }),
                        left: 0,
                        top: 150,
                    }),

                    // Center helpers
                    new Positioned({
                        child: new Container({
                            width: 180,
                            height: 60,
                            decoration: {
                                color: '#e6e6fa',
                                border: { width: 1, color: '#9370db', style: BorderStyle.Solid },
                            },
                            child: CenterHelpers.withFactors(
                                new Text('Centered with factors', {
                                    style: { fontSize: 11 },
                                }),
                                0.9, 0.8
                            ),
                        }),
                        left: 220,
                        top: 150,
                    }),

                    // Stack helpers showcase
                    new Positioned({
                        child: StackHelpers.layered([
                            new Container({
                                width: 150,
                                height: 100,
                                decoration: {
                                    color: '#ffe4e1',
                                    borderRadius: BorderRadiusUtils.all(10),
                                },
                            }),
                            AlignHelpers.center(
                                new Text('Layered Stack', {
                                    style: {
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        color: '#8b0000',
                                    },
                                })
                            ),
                        ], {
                            alignment: Alignment.Center,
                            fit: StackFit.Loose,
                        }),
                        left: 100,
                        top: 250,
                    }),

                    // Complex composition example
                    new Positioned({
                        child: new Container({
                            decoration: ContainerDecorations.elevated,
                            child: PaddingHelpers.all(
                                MarginHelpers.all(
                                    CenterHelpers.simple(
                                        new Text('Composed: Container + Padding + Margin + Center', {
                                            style: {
                                                fontSize: 10,
                                                color: '#333333',
                                            },
                                        })
                                    ),
                                    5
                                ),
                                15
                            ),
                        }),
                        left: 0,
                        top: 380,
                    }),
                ],
                fit: StackFit.Expand,
            }),
        }),
    });

    return doc;
}

// Example usage
async function main() {
    console.log('Creating positioning widgets example PDF...');

    const doc = await createPositioningExample();
    const pdfBytes = await doc.save();

    console.log(`Generated PDF with ${pdfBytes.length} bytes`);
    console.log('PDF demonstrates:');
    console.log('- Padding widget for internal spacing');
    console.log('- Margin widget for external spacing');
    console.log('- Align widget for flexible positioning');
    console.log('- Center widget for centering content');
    console.log('- Positioned widget for absolute positioning');
    console.log('- Stack widget for layered layouts');
    console.log('- All helper functions and composition patterns');

    // In a real application, you would save or display the PDF
    // For example: fs.writeFileSync('positioning-example.pdf', pdfBytes);
}

// Run example if this file is executed directly
// if (import.meta.main) {
//     main().catch(console.error);
// }

export { createPositioningExample };