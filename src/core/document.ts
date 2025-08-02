/**
 * Document class - Core PDF document representation
 *
 * Main entry point for creating PDF documents.
 * Based on the dart-pdf Document class structure.
 *
 * @packageDocumentation
 */

import { PdfDocument, PdfPage } from './pdf/document.js';
import { PdfStandardFont } from './pdf/font.js';
import type { PageOptions, DocumentInfo } from '../types/index.js';
import type { Widget } from '../widgets/widget.js';
import { BoxConstraints, TextDirection, defaultTheme, type LayoutContext, type PaintContext } from '../types/layout.js';
import type { Size } from '../types/geometry.js';
import { PdfColor } from './pdf/color.js';

/**
 * Main Document class for PDF generation
 */
export class Document {
    /** Internal PDF document */
    private readonly pdfDocument: PdfDocument;

    constructor(options: {
        info?: DocumentInfo;
        verbose?: boolean;
        version?: string;
    } = {}) {
        this.pdfDocument = new PdfDocument({
            verbose: options.verbose ?? false,
            version: options.version ?? '1.4',
        });

        // Set document info if provided
        if (options.info) {
            // Document info is automatically created in PdfDocument constructor
            // In a more complete implementation, we'd pass info to the constructor
        }
    }

    /**
     * Add a new page to the document
     *
     * @param options - Page configuration options
     */
    addPage(options: PageOptions = {}): Page {
        let mediaBox: [number, number, number, number] | undefined;

        if (options.margin) {
            const width = options.width || 612;
            const height = options.height || 792;
            mediaBox = [
                options.margin.left || 0,
                options.margin.bottom || 0,
                width - (options.margin.right || 0),
                height - (options.margin.top || 0)
            ];
        }

        const pageOptions: { width?: number; height?: number; mediaBox?: [number, number, number, number] } = {};

        if (options.width !== undefined) {
            pageOptions.width = options.width;
        }

        if (options.height !== undefined) {
            pageOptions.height = options.height;
        }

        if (mediaBox) {
            pageOptions.mediaBox = mediaBox;
        }

        const pdfPage = this.pdfDocument.addPage(pageOptions);

        const page = new Page(pdfPage, this.pdfDocument);

        // If build function is provided, call it and render the widget
        if (options.build) {
            const content = options.build();
            this.renderWidgetToPage(content, page, {
                width: options.width || 612,
                height: options.height || 792
            });
        }

        return page;
    }

    /**
     * Generate PDF output
     *
     * @returns PDF bytes as Uint8Array
     */
    async save(): Promise<Uint8Array> {
        return await this.pdfDocument.save();
    }

    /**
     * Render a widget tree to a PDF page
     */
    private renderWidgetToPage(widget: Widget, page: Page, pageSize: Size): void {
        // Create layout context with page constraints
        const constraints: any = {
            minWidth: 0,
            maxWidth: pageSize.width,
            minHeight: 0,
            maxHeight: pageSize.height,
        };

        const layoutContext: LayoutContext = {
            constraints,
            textDirection: TextDirection.LeftToRight,
            theme: defaultTheme,
        };

        // Perform layout
        const layoutResult = widget.layout(layoutContext);

        // Create paint context
        const graphics = page.getGraphics();
        const paintContext: PaintContext = {
            graphics,
            size: layoutResult.size,
            theme: defaultTheme,
            fontRegistry: this.pdfDocument.fontRegistry,
        };

        // Paint the widget
        widget.paint(paintContext);
    }
}

/**
 * Page class - represents a single page in the document
 */
export class Page {
    constructor(
        private readonly pdfPage: PdfPage,
        private readonly pdfDocument: PdfDocument
    ) { }

    /**
     * Get a graphics context for drawing on this page
     */
    getGraphics() {
        return this.pdfPage.getGraphics();
    }

    /**
     * Draw simple text on the page (convenience method)
     */
    drawText(text: string, x: number, y: number, options: {
        fontSize?: number;
        font?: PdfStandardFont;
        color?: { red: number; green: number; blue: number };
    } = {}): void {
        const graphics = this.getGraphics();
        const font = this.pdfDocument.fontRegistry.getFont(options.font || PdfStandardFont.Helvetica);
        const color = options.color ? new PdfColor(options.color.red, options.color.green, options.color.blue) : PdfColor.black;

        this.pdfPage.addFont(font);
        graphics.setColor(color);
        graphics.drawString(font, options.fontSize || 12, text, x, y);
    }

    /**
     * Draw a rectangle on the page (convenience method)
     */
    drawRect(x: number, y: number, width: number, height: number, options: {
        fill?: boolean;
        stroke?: boolean;
        color?: { red: number; green: number; blue: number };
        lineWidth?: number;
    } = {}): void {
        const graphics = this.getGraphics();
        const color = options.color ? new PdfColor(options.color.red, options.color.green, options.color.blue) : PdfColor.black;

        graphics.setColor(color);

        if (options.lineWidth !== undefined) {
            graphics.setLineWidth(options.lineWidth);
        }

        graphics.drawRect(x, y, width, height);

        if (options.fill && options.stroke) {
            graphics.fillAndStrokePath();
        } else if (options.fill) {
            graphics.fillPath();
        } else {
            graphics.strokePath();
        }
    }

}