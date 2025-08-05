/**
 * PDF Document Core - Basic PDF Document and Page Implementation
 * 
 * Provides essential PDF document structure and page management
 * for the consolidated typescript-pdf system.
 * 
 * @packageDocumentation
 */

import { FontRegistry } from './font-engine.js';
import { PdfGraphics } from './graphics.js';

/**
 * PDF object interface for type safety
 */
export interface PdfObject {
    readonly id?: number;
    readonly type?: string;
    readonly content?: string | Record<string, unknown>;
    readonly data?: Uint8Array;
}

/**
 * Basic PDF page size interface
 */
export interface PageSize {
    width: number;
    height: number;
}

/**
 * PDF page options
 */
export interface PdfPageOptions {
    pageSize: PageSize;
}

/**
 * PDF document options
 */
export interface PdfDocumentOptions {
    verbose?: boolean;
    version?: string;
}

// Remove the interface since we'll use PdfGraphics directly

/**
 * Basic PDF Page implementation
 */
export class PdfPage {
    private readonly size: PageSize;
    private readonly graphics: PdfGraphics;
    private readonly id: number;

    constructor(options: PdfPageOptions, id: number) {
        this.size = options.pageSize;
        this.id = id;
        this.graphics = new PdfGraphics();
    }

    /**
     * Get graphics context
     */
    getGraphics(): PdfGraphics {
        return this.graphics;
    }

    /**
     * Get page size
     */
    getSize(): PageSize {
        return { ...this.size };
    }

    /**
     * Get page ID
     */
    getId(): number {
        return this.id;
    }
}

/**
 * Basic PDF Document implementation
 */
export class PdfDocument {
    private readonly options: PdfDocumentOptions;
    private readonly pages: PdfPage[] = [];
    private readonly _objects: PdfObject[] = [];
    private serialCounter = 1;
    public readonly fontRegistry: FontRegistry;

    constructor(options: PdfDocumentOptions = {}) {
        this.options = {
            verbose: options.verbose ?? false,
            version: options.version ?? '1.4',
        };

        this.fontRegistry = new FontRegistry(this as PdfDocument);
    }

    /**
     * Generate unique serial number
     */
    genSerial(): number {
        return this.serialCounter++;
    }

    /**
     * Objects collection (for font registration)
     */
    get objects() {
        return {
            add: (obj: PdfObject) => {
                this._objects.push(obj);
            }
        };
    }

    /**
     * Add a new page
     */
    addPage(options: PdfPageOptions): PdfPage {
        const page = new PdfPage(options, this.genSerial());
        this.pages.push(page);
        return page;
    }

    /**
     * Get all pages
     */
    getPages(): readonly PdfPage[] {
        return [...this.pages];
    }

    /**
     * Get page count
     */
    getPageCount(): number {
        return this.pages.length;
    }

    /**
     * Save document to bytes (improved implementation with content streams)
     */
    save(): Uint8Array {
        if (this.pages.length === 0) {
            throw new Error('Cannot save document with no pages');
        }

        const objects: string[] = [];
        let objNum = 1;

        // Object 1: Catalog
        objects.push([
            `${objNum} 0 obj`,
            '<<',
            '/Type /Catalog',
            '/Pages 2 0 R',
            '>>',
            'endobj'
        ].join('\n'));
        objNum++;

        // Object 2: Pages
        const pageRefs = this.pages.map((_, i) => `${i + 3} 0 R`).join(' ');
        objects.push([
            `${objNum} 0 obj`,
            '<<',
            '/Type /Pages',
            `/Count ${this.pages.length}`,
            `/Kids [${pageRefs}]`,
            '>>',
            'endobj'
        ].join('\n'));
        objNum++;

        // Create page objects and content streams
        for (const page of this.pages) {
            if (!page) { continue; }
            const contentObjNum = objNum + this.pages.length;
            const size = page.getSize();

            // Build font resources from font registry
            const fontResources = this.fontRegistry.getFontResources();
            const fontResourceEntries = Object.entries(fontResources).map(
                ([name, definition]) => `/${name} ${definition}`
            );

            // Ensure we have at least the basic fonts for compatibility
            if (fontResourceEntries.length === 0) {
                fontResourceEntries.push(
                    '/Helvetica << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
                    '/Times-Roman << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
                    '/Courier << /Type /Font /Subtype /Type1 /BaseFont /Courier >>'
                );
            }

            // Page object
            objects.push([
                `${objNum} 0 obj`,
                '<<',
                '/Type /Page',
                '/Parent 2 0 R',
                `/MediaBox [0 0 ${size.width} ${size.height}]`,
                `/Contents ${contentObjNum} 0 R`,
                '/Resources <<',
                '/Font <<',
                ...fontResourceEntries,
                '>>',
                '>>',
                '>>',
                'endobj'
            ].join('\n'));
            objNum++;
        }

        // Content stream objects
        for (const page of this.pages) {
            if (!page) { continue; }
            const content = page.getGraphics().getContent();

            objects.push([
                `${objNum} 0 obj`,
                '<<',
                `/Length ${content.length}`,
                '>>',
                'stream',
                content,
                'endstream',
                'endobj'
            ].join('\n'));
            objNum++;
        }

        // Calculate positions for xref table
        const header = '%PDF-1.4\n';
        let position = header.length;
        const positions: number[] = [0]; // Object 0 is always at position 0

        for (const obj of objects) {
            positions.push(position);
            position += obj.length + 1; // +1 for newline
        }

        // Build xref table
        const xrefStart = position;
        const xref = [
            'xref',
            `0 ${objNum}`,
            '0000000000 65535 f '
        ];

        for (let i = 1; i < objNum; i++) {
            const pos = positions[i];
            if (pos !== undefined) {
                xref.push(`${pos.toString().padStart(10, '0')} 00000 n `);
            }
        }

        // Build trailer
        const trailer = [
            'trailer',
            '<<',
            `/Size ${objNum}`,
            '/Root 1 0 R',
            '>>',
            'startxref',
            xrefStart.toString(),
            '%%EOF'
        ];

        // Combine all parts
        const pdfContent = [
            header.slice(0, -1), // Remove trailing newline
            ...objects,
            ...xref,
            ...trailer
        ].join('\n');

        return new TextEncoder().encode(pdfContent);
    }

    /**
     * Get document options
     */
    getOptions(): PdfDocumentOptions {
        return { ...this.options };
    }
}