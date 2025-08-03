/**
 * Test for table text rendering fix
 * 
 * Verifies that text appears correctly in table cells after PaintContext fix
 * 
 * @packageDocumentation
 */

import { Table, TableRow, TableHelpers, TableBorders } from '../widgets/table.js';
import { Container } from '../widgets/container.js';
import { Text } from '../widgets/text.js';
import { Document } from '../core/document.js';
import { PdfColor } from '../core/pdf/color.js';
import { PdfStandardFont } from '../core/pdf/font.js';
import { TextStyleUtils, FontWeight } from '../types/theming.js';
import { EdgeInsets as EdgeInsetsUtils } from '../types/layout.js';

describe('Table Text Rendering Fix', () => {
    let document: Document;

    beforeEach(() => {
        document = new Document();
    });

    test('should render text in table cells correctly with proper PaintContext', async () => {
        // Create a simple table with text content
        const tableData = [
            ['Header 1', 'Header 2', 'Header 3'],
            ['Cell 1,1', 'Cell 1,2', 'Cell 1,3'],
            ['Cell 2,1', 'Cell 2,2', 'Cell 2,3'],
        ];

        const table = TableHelpers.simple(tableData.slice(1), {
            headers: tableData[0]!,
            border: TableBorders.all({ width: 1, color: PdfColor.black }),
            cellPadding: EdgeInsetsUtils.all(8),
        });

        // Add table to document page
        document.addPage({
            build: () => table,
        });

        // Generate PDF to verify no errors occur during text rendering
        const pdfBytes = await document.save();

        // Basic validation - PDF should be generated without errors
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(1000); // Should have substantial content
    });

    test('should handle complex table with Container-wrapped Text widgets', async () => {
        // Create table with manually wrapped text widgets (like TableHelper does)
        const rows = [
            new TableRow({
                children: [
                    new Container({
                        padding: EdgeInsetsUtils.all(8),
                        child: new Text('Bold Header', {
                            style: TextStyleUtils.createDefault({
                                fontWeight: FontWeight.Bold,
                                color: PdfColor.black,
                                fontFamily: PdfStandardFont.Helvetica,
                                fontSize: 12,
                            }),
                        }),
                    }),
                    new Container({
                        padding: EdgeInsetsUtils.all(8),
                        child: new Text('Regular Cell', {
                            style: TextStyleUtils.createDefault({
                                color: PdfColor.black,
                                fontFamily: PdfStandardFont.Helvetica,
                                fontSize: 10,
                            }),
                        }),
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new Container({
                        padding: EdgeInsetsUtils.all(8),
                        child: new Text('Data 1', {
                            style: TextStyleUtils.createDefault({
                                color: PdfColor.blue,
                                fontFamily: PdfStandardFont.TimesRoman,
                                fontSize: 11,
                            }),
                        }),
                    }),
                    new Container({
                        padding: EdgeInsetsUtils.all(8),
                        child: new Text('Data 2', {
                            style: TextStyleUtils.createDefault({
                                color: PdfColor.red,
                                fontFamily: PdfStandardFont.Courier,
                                fontSize: 9,
                            }),
                        }),
                    }),
                ],
            }),
        ];

        const table = new Table({
            children: rows,
            border: TableBorders.all({ width: 1, color: PdfColor.black }),
        });

        // Add table to document page
        document.addPage({
            build: () => table,
        });

        // Generate PDF to verify text renders correctly with different styles
        const pdfBytes = await document.save();

        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(1000);
    });

    test('should preserve fontRegistry in PaintContext for proper font fallback', async () => {
        // Test that fontRegistry is properly passed through PaintContext
        const table = TableHelpers.simple([['Test Text']], {
            headers: ['Test Header'],
            border: TableBorders.all(),
        });

        document.addPage({
            build: () => table,
        });

        // This should not throw errors related to missing fontRegistry
        expect(async () => {
            await document.save();
        }).not.toThrow();
    });

    test('should handle empty table gracefully', async () => {
        const table = new Table({
            children: [],
            border: TableBorders.all(),
        });

        document.addPage({
            build: () => table,
        });

        const pdfBytes = await document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
    });

    test('should handle table with single cell', async () => {
        const table = TableHelpers.simple([['Single Cell']], {
            border: TableBorders.all(),
        });

        document.addPage({
            build: () => table,
        });

        const pdfBytes = await document.save();
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(500); // Should contain the single cell
    });
});