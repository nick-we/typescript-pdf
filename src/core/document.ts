/**
 * Document and Page Management - Consolidated Core
 *
 * Streamlined document and page system combining:
 * - Document creation and management
 * - Simplified page handling
 * - Widget rendering pipeline
 * - Essential page functionality
 *
 * Consolidates document.ts + page.ts (798 lines → ~200 lines)
 *
 * @packageDocumentation
 */

import type { Core, Geometry, Layout } from '@/types.js';
import type { Widget } from '@/widgets/base.js';

import { FontSystem, PdfStandardFont } from '@/core/fonts.js';
import { PdfColor } from '@/core/pdf/color.js';
import type { PdfPage } from '@/core/pdf/document.js';
import { PdfDocument } from '@/core/pdf/document.js';
import type { PdfGraphics } from '@/core/pdf/graphics.js';

// Text direction enum for simplified usage
export enum TextDirection {
    LeftToRight = 'ltr',
    RightToLeft = 'rtl',
}

/**
 * Page format dimensions (points)
 */
export const PAGE_FORMATS = {
    A4: { width: 595, height: 842 },
    Letter: { width: 612, height: 792 },
    Legal: { width: 612, height: 1008 },
    A3: { width: 842, height: 1191 },
    A5: { width: 420, height: 595 },
} as const;

/**
 * Simple page options
 */
export interface PageOptions {
    format?: keyof typeof PAGE_FORMATS;
    width?: number;
    height?: number;
    margins?: Layout.EdgeInsets;
    build?: () => Widget;
}

/**
 * Simple document options
 */
export interface DocumentOptions {
    info?: Core.DocumentInfo;
    verbose?: boolean;
    version?: string;
}

/**
 * Streamlined Page class
 */
export class Page {
    private readonly pdfPage: PdfPage;
    private readonly document: Document;
    public readonly size: Geometry.Size;
    public readonly margins: Layout.EdgeInsets;

    constructor(
        pdfPage: PdfPage,
        document: Document,
        options: PageOptions = {}
    ) {
        this.pdfPage = pdfPage;
        this.document = document;

        // Set page size
        if (options.format) {
            this.size = PAGE_FORMATS[options.format];
        } else {
            this.size = {
                width: options.width ?? 612,
                height: options.height ?? 792,
            };
        }

        // MARGIN FIX: Reduce default page margins to match MultiPage widget (20pts)
        this.margins = options.margins ?? {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        };
    }

    /**
     * Get graphics context for drawing
     */
    getGraphics(): PdfGraphics {
        return this.pdfPage.getGraphics();
    }

    /**
     * Get graphics context (IPage interface compatibility)
     */
    getGraphicsContext(): PdfGraphics {
        return this.getGraphics();
    }

    /**
     * Get page size
     */
    getSize(): Geometry.Size {
        return { ...this.size };
    }

    /**
     * Get page margins
     */
    getMargins(): Layout.EdgeInsets {
        return { ...this.margins };
    }

    /**
     * Get content area (page size minus margins)
     */
    getContentArea(): Geometry.Rect {
        return {
            x: this.margins.left,
            y: this.margins.top,
            width: this.size.width - this.margins.left - this.margins.right,
            height: this.size.height - this.margins.top - this.margins.bottom,
        };
    }

    /**
     * Draw simple text (convenience method)
     */
    drawText(
        text: string,
        x: number,
        y: number,
        options: {
            fontSize?: number;
            font?: PdfStandardFont;
            color?: { red: number; green: number; blue: number };
        } = {}
    ): void {
        const graphics = this.getGraphics();
        const fontSize = options.fontSize ?? 12;
        const font = this.document.fontSystem.getFont(
            options.font ?? PdfStandardFont.Helvetica
        );
        const color = options.color
            ? new PdfColor(
                options.color.red,
                options.color.green,
                options.color.blue
            )
            : PdfColor.black;

        graphics.setFillColor(color);
        const underlyingFont = font.getUnderlyingFont();
        if (
            underlyingFont &&
            typeof underlyingFont === 'object' &&
            'name' in underlyingFont
        ) {
            graphics.drawString(underlyingFont as any, fontSize, text, x, y);
        }
    }

    /**
     * Draw rectangle (convenience method)
     */
    drawRect(
        x: number,
        y: number,
        width: number,
        height: number,
        options: {
            fill?: boolean;
            stroke?: boolean;
            color?: { red: number; green: number; blue: number };
            lineWidth?: number;
        } = {}
    ): void {
        const graphics = this.getGraphics();
        const color = options.color
            ? new PdfColor(
                options.color.red,
                options.color.green,
                options.color.blue
            )
            : PdfColor.black;

        graphics.setFillColor(color);
        graphics.setStrokeColor(color);

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

    /**
     * Render widget to page
     */
    renderWidget(widget: Widget): void {
        const contentArea = this.getContentArea();
        const constraints: Layout.BoxConstraints = {
            minWidth: 0,
            maxWidth: contentArea.width,
            minHeight: 0,
            maxHeight: contentArea.height,
        };

        // Simplified layout and paint - focus on core functionality
        const layoutContext: Layout.LayoutContext = {
            constraints,
            textDirection: TextDirection.LeftToRight,
            theme: {
                colorScheme: {
                    primary: '#1976d2',
                    secondary: '#dc004e',
                    background: '#ffffff',
                    surface: '#f5f5f5',
                    onBackground: '#000000',
                    onSurface: '#000000',
                    onPrimary: '#ffffff',
                    onSecondary: '#ffffff',
                    error: '#d32f2f',
                    success: '#388e3c',
                    warning: '#f57c00',
                    info: '#1976d2',
                },
                spacing: {
                    xs: 2,
                    sm: 4,
                    md: 8,
                    lg: 16,
                    xl: 24,
                    xxl: 32,
                },
                defaultTextStyle: {
                    fontSize: 12,
                    color: '#000000',
                    fontFamily: 'Helvetica',
                },
                cornerRadius: {
                    none: 0,
                    small: 4,
                    medium: 8,
                    large: 16,
                },
            },
        };

        // Perform layout (simplified)
        const layoutResult = widget.layout
            ? widget.layout(layoutContext)
            : { size: contentArea };

        // Get graphics context and set up coordinate system transformation
        const graphics = this.getGraphics();

        // Save the original state
        graphics.save();

        // Transform coordinate system: PDF uses bottom-left origin, we use top-left
        // 1. Translate to content area position
        graphics.translate(contentArea.x, contentArea.y);

        // 2. Flip Y-axis to convert from top-left to bottom-left origin
        graphics.translate(0, contentArea.height);
        graphics.scale(1, -1);

        // Create paint context - minimal version to avoid typing conflicts
        const paintContext: Layout.PaintContext = {
            size: layoutResult.size ?? contentArea,
            theme: layoutContext.theme,
            fontRegistry: this.document.fontSystem,
            document: this.document,
        };

        // Extend paint context with additional properties that widgets need
        // This is a workaround for the strict typing while maintaining compatibility
        Object.assign(paintContext, {
            graphics,
            pageHeight: this.size.height,
            pageSize: this.size,
            pageMargins: this.margins,
            contentArea: contentArea,
        });

        // Paint widget
        if (widget.paint) {
            widget.paint(paintContext);
        }

        // Restore the original graphics state
        graphics.restore();
    }
}

/**
 * Main Document class - streamlined version
 */
export class Document {
    private readonly pdfDocument: PdfDocument;
    public readonly fontSystem: FontSystem;
    private readonly pages: Page[] = [];

    constructor(options: DocumentOptions = {}) {
        this.pdfDocument = new PdfDocument({
            verbose: options.verbose ?? false,
            version: options.version ?? '1.4',
        });

        this.fontSystem = new FontSystem(this.pdfDocument);

        if (options.info) {
            // TODO: Set document info if provided
            // In a complete implementation, this would be passed to PdfDocument constructor
        }
    }

    /**
     * Add a new page to the document
     */
    addPage(options: PageOptions = {}): Page {
        // Determine page size
        let size: Geometry.Size;
        if (options.format) {
            size = PAGE_FORMATS[options.format];
        } else {
            size = {
                width: options.width ?? 612,
                height: options.height ?? 792,
            };
        }

        // Create PDF page
        const pdfPage = this.pdfDocument.addPage({
            pageSize: { width: size.width, height: size.height },
        });

        // Create page wrapper
        const page = new Page(pdfPage, this, options);
        this.pages.push(page);

        // If build function provided, render content
        if (options.build) {
            const content = options.build();
            page.renderWidget(content);
        }

        return page;
    }

    /**
     * Get all pages
     */
    getPages(): readonly Page[] {
        return [...this.pages];
    }

    /**
     * Get page count
     */
    getPageCount(): number {
        return this.pages.length;
    }

    /**
     * Generate PDF output
     */
    save(): Uint8Array {
        return this.pdfDocument.save();
    }

    /**
     * Get document statistics
     */
    getStats() {
        return {
            pageCount: this.pages.length,
            fontStats: this.fontSystem.getStats(),
        };
    }
}

/**
 * Document factory for common document types
 */
export const DocumentFactory = {
    /**
     * Create a standard A4 document
     */
    a4(options: Omit<DocumentOptions, 'format'> = {}): Document {
        return new Document(options);
    },

    /**
     * Create a letter-size document
     */
    letter(options: Omit<DocumentOptions, 'format'> = {}): Document {
        return new Document(options);
    },

    /**
     * Create a custom document
     */
    custom(options: DocumentOptions = {}): Document {
        return new Document(options);
    },
};

/**
 * Page factory for common page types
 */
export const PageFactory = {
    /**
     * Create an A4 page
     */
    a4(
        options: Omit<PageOptions, 'format'> = {}
    ): PageOptions & { format: 'A4' } {
        return { format: 'A4', width: 595, height: 842, ...options };
    },

    /**
     * Create a letter page
     */
    letter(
        options: Omit<PageOptions, 'format'> = {}
    ): PageOptions & { format: 'Letter' } {
        return { format: 'Letter', width: 612, height: 792, ...options };
    },

    /**
     * Create a custom size page
     */
    custom(
        width: number,
        height: number,
        options: Omit<PageOptions, 'width' | 'height'> = {}
    ): PageOptions {
        return { width, height, ...options };
    },
};
