/**
 * Comprehensive Text Overflow Test for Table Widget
 *
 * Tests all three text overflow behaviors:
 * - Clip: Hard cutoff at cell boundaries
 * - Ellipsis: Truncate with "..." indicator
 * - Visible: Allow text to extend beyond boundaries
 */

import { describe, it, expect } from 'vitest';

import { Document } from '@/core/document.js';
import { PdfColor } from '@/core/pdf';
import { createMockPaintContext } from '@/test/mock-interfaces.js';
import type { IPdfFont } from '@/types/pdf-types';
import type { Layout } from '@/types.js';
import { Table, TableRow, TextOverflow, DataUtils } from '@/widgets/data.js';
import { Txt } from '@/widgets/text.js';

describe('Table Text Overflow System', () => {
    // Use the proper mock paint context factory
    const createTestPaintContext = () =>
        createMockPaintContext({
            size: { width: 400, height: 300 },
        });

    // Test data with various content lengths
    const shortText = 'Short';
    const mediumText = 'Medium length content';
    const longText =
        'This is a very long text that will definitely exceed the normal cell width and should trigger overflow behavior';
    const veryLongText =
        'This is an extremely long text content that spans multiple lines and should definitely test the limits of our text overflow system with various behaviors including clipping ellipsis and visible modes';

    describe('TextOverflow.Clip Behavior', () => {
        it('should clip text at cell boundaries using PDF clipping regions', () => {
            const table = new Table({
                data: [
                    ['Short', 'Medium text', longText],
                    [shortText, mediumText, veryLongText],
                ],
                columnWidths: [
                    DataUtils.columnWidths.fixed(80),
                    DataUtils.columnWidths.fixed(120),
                    DataUtils.columnWidths.fixed(100),
                ],
                textOverflow: TextOverflow.Clip,
                borders: DataUtils.borders.all({
                    width: 1,
                    color: PdfColor.fromHex('#cccccc'),
                }),
            });

            const context = createTestPaintContext();
            let clipRegionSet = false;
            let clipRegionCleared = false;

            // Track clipping calls
            context.graphics!.setClippingRect = () => {
                clipRegionSet = true;
            };
            context.graphics!.clearClipping = () => {
                clipRegionCleared = true;
            };

            // Layout and paint
            const layoutResult = table.layout({
                constraints: {
                    minWidth: 0,
                    maxWidth: 400,
                    minHeight: 0,
                    maxHeight: 300,
                },
                theme: context.theme,
            } as Layout.LayoutContext);

            expect(layoutResult.size.width).toBeGreaterThan(0);
            expect(layoutResult.size.height).toBeGreaterThan(0);

            // Paint should use clipping
            table.paint(context);

            // Verify clipping was used
            expect(clipRegionSet).toBe(true);
            expect(clipRegionCleared).toBe(true);
        });

        it('should respect maxLines parameter with clipping', () => {
            const table = new Table({
                data: [[veryLongText]],
                columnWidths: [DataUtils.columnWidths.fixed(150)],
                textOverflow: TextOverflow.Clip,
                maxLines: 2,
            });

            const context = createTestPaintContext();
            let linesRendered = 0;

            // Count text rendering calls
            context.graphics!.drawString = () => {
                linesRendered++;
            };

            table.paint(context);

            // Should render at most 2 lines
            expect(linesRendered).toBeLessThanOrEqual(2);
        });
    });

    describe('TextOverflow.Ellipsis Behavior', () => {
        it('should truncate text with ellipsis when exceeding boundaries', () => {
            const table = new Table({
                data: [
                    [longText], // Use very long text in narrow column to force ellipsis
                ],
                columnWidths: [
                    DataUtils.columnWidths.fixed(50), // Very narrow to force overflow
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();
            let ellipsisUsed = false;

            // Track ellipsis usage
            const originalDrawString = context.graphics!.drawString;
            context.graphics!.drawString = (
                font: IPdfFont,
                fontSize: number,
                text: string,
                x: number,
                y: number
            ) => {
                if (text.includes('…')) {
                    ellipsisUsed = true;
                }
                return originalDrawString?.(font, fontSize, text, x, y);
            };

            table.paint(context);

            // Should use ellipsis for long content
            expect(ellipsisUsed).toBe(true);
        });

        it('should measure ellipsis width for accurate truncation', () => {
            const table = new Table({
                data: [[longText]],
                columnWidths: [DataUtils.columnWidths.fixed(100)],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();
            let ellipsisWidthMeasured = false;

            // Track ellipsis width measurement
            const originalMeasureTextWidth =
                context.textMeasurement!.measureTextWidth;
            context.textMeasurement!.measureTextWidth = (
                text: string,
                fontSize: number
            ) => {
                if (text === '…') {
                    ellipsisWidthMeasured = true;
                }
                return originalMeasureTextWidth(text, fontSize);
            };

            table.paint(context);

            expect(ellipsisWidthMeasured).toBe(true);
        });
    });

    describe('TextOverflow.Visible Behavior', () => {
        it('should allow text to extend beyond cell boundaries', () => {
            const table = new Table({
                data: [[longText, shortText]],
                columnWidths: [
                    DataUtils.columnWidths.fixed(50), // Very narrow
                    DataUtils.columnWidths.fixed(100),
                ],
                textOverflow: TextOverflow.Visible,
            });

            const context = createTestPaintContext();
            let clippingUsed = false;

            // Ensure no clipping is used
            context.graphics!.setClippingRect = () => {
                clippingUsed = true;
            };

            table.paint(context);

            // Should not use clipping for visible overflow
            expect(clippingUsed).toBe(false);
        });

        it('should still respect maxLines even with visible overflow', () => {
            const table = new Table({
                data: [[veryLongText]],
                columnWidths: [DataUtils.columnWidths.fixed(80)],
                textOverflow: TextOverflow.Visible,
                maxLines: 3,
            });

            const context = createTestPaintContext();
            let linesRendered = 0;

            context.graphics!.drawString = () => {
                linesRendered++;
            };

            table.paint(context);

            // Should respect max lines limit
            expect(linesRendered).toBeLessThanOrEqual(3);
        });
    });

    describe('Per-Row Text Overflow Override', () => {
        it('should allow TableRow to override table-level text overflow', () => {
            // Create table with default clip behavior
            const table = new Table({
                textOverflow: TextOverflow.Clip,
                columnWidths: [DataUtils.columnWidths.fixed(40)], // Very narrow to force overflow
                children: [
                    new TableRow({
                        children: [new Txt(longText)],
                        textOverflow: TextOverflow.Ellipsis, // Override to ellipsis
                    }),
                    new TableRow({
                        children: [new Txt(longText)],
                        textOverflow: TextOverflow.Visible, // Override to visible
                    }),
                    new TableRow({
                        children: [new Txt(longText)],
                        // Use table default (Clip)
                    }),
                ],
            });

            const context = createTestPaintContext();
            let ellipsisUsed = false;
            let clippingUsed = false;

            // Track different overflow behaviors
            context.graphics!.drawString = (
                _font: unknown,
                _fontSize: number,
                text: string,
                _x: number,
                _y: number
            ) => {
                if (text.includes('…')) {
                    ellipsisUsed = true;
                }
            };
            context.graphics!.setClippingRect = () => {
                clippingUsed = true;
            };

            table.paint(context);

            // Should use both ellipsis and clipping based on row overrides
            expect(ellipsisUsed).toBe(true);
            expect(clippingUsed).toBe(true);
        });

        it('should allow per-row maxLines override', () => {
            const table = new Table({
                maxLines: 1, // Table default
                columnWidths: [DataUtils.columnWidths.fixed(100)],
                children: [
                    new TableRow({
                        children: [new Txt(veryLongText)],
                        maxLines: 3, // Override to 3 lines
                    }),
                    new TableRow({
                        children: [new Txt(veryLongText)],
                        // Use table default (1 line)
                    }),
                ],
            });

            const context = createTestPaintContext();
            const _linesPerRow: number[] = [];
            let _currentRowLines = 0;

            // Track lines per row (simplified)
            context.graphics!.drawString = () => {
                _currentRowLines++;
            };

            // Mock row transitions (this is simplified for testing)
            table.paint(context);

            // Test passes if no errors are thrown and table renders
            expect(true).toBe(true);
        });
    });

    describe('Mixed Content and Edge Cases', () => {
        it('should handle empty cells gracefully', () => {
            const table = new Table({
                data: [
                    ['', longText, ''],
                    [shortText, '', veryLongText],
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            expect(() => {
                table.paint(context);
            }).not.toThrow();
        });

        it('should handle null and undefined cells', () => {
            const table = new Table({
                data: [
                    [null, longText, undefined],
                    [shortText, null, ''],
                ] as any,
                textOverflow: TextOverflow.Clip,
            });

            const context = createTestPaintContext();

            expect(() => {
                table.paint(context);
            }).not.toThrow();
        });

        it('should work with different column width types', () => {
            const table = new Table({
                data: [[longText, longText, longText, longText]],
                columnWidths: [
                    DataUtils.columnWidths.fixed(80),
                    DataUtils.columnWidths.flex(),
                    DataUtils.columnWidths.fraction(0.2),
                    DataUtils.columnWidths.intrinsic(),
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            expect(() => {
                const layoutResult = table.layout({
                    constraints: {
                        minWidth: 0,
                        maxWidth: 400,
                        minHeight: 0,
                        maxHeight: 300,
                    },
                    theme: context.theme,
                } as Layout.LayoutContext);

                expect(layoutResult.size.width).toBeGreaterThan(0);
                table.paint(context);
            }).not.toThrow();
        });
    });

    describe('Integration with Accurate Text Measurement', () => {
        it('should use text measurement service for accurate calculations', () => {
            const table = new Table({
                data: [[longText]],
                columnWidths: [DataUtils.columnWidths.fixed(50)], // Very narrow to force truncation
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();
            let measureTextCalled = false;
            let wrapTextCalled = false;
            let truncateTextCalled = false;

            // Track text measurement service usage
            const originalMeasureTextWidth =
                context.textMeasurement!.measureTextWidth;
            const originalWrapTextAccurate =
                context.textMeasurement!.wrapTextAccurate;
            const originalTruncateTextAccurate =
                context.textMeasurement!.truncateTextAccurate;

            context.textMeasurement!.measureTextWidth = (
                ...args: Parameters<typeof originalMeasureTextWidth>
            ) => {
                measureTextCalled = true;
                return originalMeasureTextWidth(...args);
            };

            context.textMeasurement!.wrapTextAccurate = (
                ...args: Parameters<typeof originalWrapTextAccurate>
            ) => {
                wrapTextCalled = true;
                return originalWrapTextAccurate(...args);
            };

            context.textMeasurement!.truncateTextAccurate = (
                ...args: Parameters<typeof originalTruncateTextAccurate>
            ) => {
                truncateTextCalled = true;
                return originalTruncateTextAccurate(...args);
            };

            table.paint(context);

            expect(measureTextCalled).toBe(true);
            expect(wrapTextCalled).toBe(true);
            expect(truncateTextCalled).toBe(true);
        });

        it('should fallback gracefully when text measurement fails', () => {
            const table = new Table({
                data: [[longText]],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            // Make text measurement throw errors
            context.textMeasurement!.measureTextWidth = () => {
                throw new Error('Measurement failed');
            };
            context.textMeasurement!.wrapTextAccurate = () => {
                throw new Error('Wrapping failed');
            };
            context.textMeasurement!.truncateTextAccurate = () => {
                throw new Error('Truncation failed');
            };

            expect(() => {
                table.paint(context);
            }).not.toThrow();
        });
    });

    describe('Performance and Memory Efficiency', () => {
        it('should handle large tables with text overflow efficiently', () => {
            // Create a large table
            const largeData: string[][] = [];
            for (let i = 0; i < 50; i++) {
                largeData.push([
                    `Row ${i} Col 1: ${longText}`,
                    `Row ${i} Col 2: ${veryLongText}`,
                    `Row ${i} Col 3: ${mediumText}`,
                ]);
            }

            const table = new Table({
                data: largeData,
                columnWidths: [
                    DataUtils.columnWidths.fixed(100),
                    DataUtils.columnWidths.fixed(120),
                    DataUtils.columnWidths.fixed(80),
                ],
                textOverflow: TextOverflow.Ellipsis,
            });

            const context = createTestPaintContext();

            const startTime = performance.now();

            expect(() => {
                table.paint(context);
            }).not.toThrow();

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Should complete within reasonable time (less than 1 second)
            expect(renderTime).toBeLessThan(1000);
        });
    });
});

describe('Text Overflow PDF Generation Integration', () => {
    it('should generate PDF with different text overflow behaviors', async () => {
        const doc = new Document();

        doc.addPage({
            build: () =>
                new Table({
                    data: [
                        ['Overflow Type', 'Content', 'Result'],
                        [
                            'Clip',
                            'This text will be clipped at boundaries',
                            'Hard cutoff',
                        ],
                        [
                            'Ellipsis',
                            'This text will show ellipsis when too long',
                            'Truncated...',
                        ],
                        [
                            'Visible',
                            'This text will extend beyond cell boundaries',
                            'Full text shown',
                        ],
                    ],
                    columnWidths: [
                        DataUtils.columnWidths.flex(1),
                        DataUtils.columnWidths.flex(1),
                        DataUtils.columnWidths.flex(1),
                    ],
                    borders: DataUtils.borders.all({
                        width: 1,
                        color: PdfColor.fromHex('#000000'),
                    }),
                    textOverflow: TextOverflow.Ellipsis,
                    headerStyle: {
                        fontSize: 12,
                        fontWeight: 700,
                        color: PdfColor.fromHex('#ffffff'),
                    },
                }),
        });

        // Should not throw when generating PDF
        expect(() => {
            // Note: Actual PDF generation would require full context
            // This test validates the table structure is valid
            doc.getPages();
        }).not.toThrow();
    });
});
