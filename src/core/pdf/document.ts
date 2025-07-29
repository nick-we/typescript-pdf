/**
 * PDF Document Structure
 * 
 * Core PDF document implementation based on dart-pdf patterns
 * Handles PDF file structure, object management, and serialization
 * 
 * @packageDocumentation
 */

import { PdfStream } from './stream.js';
import { PdfObject, PdfDict, PdfName, PdfArray, PdfNum, PdfIndirect, type PdfOutputContext } from './types.js';
import { PdfGraphics } from './graphics.js';
import { FontRegistry, PdfFont } from './font.js';

/**
 * PDF Document settings
 */
export interface PdfDocumentSettings {
    /** Enable verbose output with comments */
    verbose?: boolean;
    /** PDF version */
    version?: string;
    /** Compression level (0-9) */
    compress?: number;
}

/**
 * Cross-reference table entry
 */
interface XRefEntry {
    /** Object serial number */
    serial: number;
    /** Object generation number */
    generation: number;
    /** Byte offset in file */
    offset: number;
    /** Whether object is in use */
    inUse: boolean;
}

/**
 * PDF Document Info object
 */
export class PdfInfo extends PdfObject<PdfDict> {
    constructor(document: PdfDocument, info: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
    } = {}) {
        const dict = new PdfDict();

        if (info.title) dict.set('/Title', new PdfName(info.title));
        if (info.author) dict.set('/Author', new PdfName(info.author));
        if (info.subject) dict.set('/Subject', new PdfName(info.subject));
        if (info.keywords) dict.set('/Keywords', new PdfName(info.keywords.join(' ')));
        if (info.creator) dict.set('/Creator', new PdfName(info.creator));
        if (info.producer) dict.set('/Producer', new PdfName(info.producer));

        // Add creation date
        const now = new Date();
        const dateStr = `D:${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        dict.set('/CreationDate', new PdfName(dateStr));
        dict.set('/ModDate', new PdfName(dateStr));

        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * PDF Catalog (root) object
 */
export class PdfCatalog extends PdfObject<PdfDict> {
    constructor(document: PdfDocument) {
        const dict = PdfDict.values({
            '/Type': new PdfName('/Catalog'),
            '/Version': new PdfName(`/${document.settings.version || '1.4'}`),
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    /**
     * Set the pages object reference
     */
    setPages(pages: PdfIndirect): void {
        this.params.set('/Pages', pages);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * PDF Pages object (page tree root)
 */
export class PdfPageList extends PdfObject<PdfDict> {
    public readonly pages: PdfPage[] = [];

    constructor(document: PdfDocument) {
        const dict = PdfDict.values({
            '/Type': new PdfName('/Pages'),
            '/Count': new PdfNum(0),
            '/Kids': new PdfArray(),
        });

        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    /**
     * Add a page to the page list
     */
    addPage(page: PdfPage): void {
        this.pages.push(page);
    }

    override prepare(): void {
        super.prepare();

        // Update count and kids array
        this.params.set('/Count', new PdfNum(this.pages.length));
        const kids = PdfArray.fromObjects(this.pages.filter(p => p.inUse));
        this.params.set('/Kids', kids);
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * PDF Page object
 */
export class PdfPage extends PdfObject<PdfDict> {
    public readonly contents: PdfContentStream[] = [];
    private readonly document: PdfDocument;
    private readonly fontRegistry: FontRegistry;
    private readonly usedFonts = new Set<PdfFont>();

    constructor(
        document: PdfDocument,
        options: {
            width?: number;
            height?: number;
            mediaBox?: [number, number, number, number];
        } = {}
    ) {
        const dict = PdfDict.values({
            '/Type': new PdfName('/Page'),
        });

        // Set media box (page size)
        const mediaBox = options.mediaBox || [0, 0, options.width || 612, options.height || 792]; // Default to US Letter
        dict.set('/MediaBox', PdfArray.fromNum(mediaBox));

        super(document.genSerial(), 0, dict);
        document.objects.add(this);

        this.document = document;
        this.fontRegistry = document.fontRegistry;
    }

    /**
     * Set the parent pages object
     */
    setParent(parent: PdfIndirect): void {
        this.params.set('/Parent', parent);
    }

    /**
     * Add content stream to page
     */
    addContent(content: PdfContentStream): void {
        this.contents.push(content);
    }

    /**
     * Add a font to be used on this page
     */
    addFont(font: PdfFont): void {
        this.usedFonts.add(font);
    }

    /**
     * Get a graphics context for drawing on this page
     */
    getGraphics(): PdfGraphics {
        const contentStream = new PdfContentStream(this.document);
        const graphics = new PdfGraphics(contentStream, {
            verbose: this.document.settings.verbose ?? false,
        });
        this.addContent(contentStream);
        return graphics;
    }

    override prepare(): void {
        super.prepare();

        // Set up contents array
        const activeContents = this.contents.filter(c => c.inUse);
        if (activeContents.length === 1) {
            this.params.set('/Contents', activeContents[0]!.ref());
        } else if (activeContents.length > 1) {
            this.params.set('/Contents', PdfArray.fromObjects(activeContents));
        }

        // Set up font resources
        if (this.usedFonts.size > 0) {
            const resources = this.params.get('/Resources') as PdfDict || new PdfDict();
            const fontDict = new PdfDict();

            for (const font of this.usedFonts) {
                fontDict.set(font.name, font.ref());
            }

            resources.set('/Font', fontDict);
            this.params.set('/Resources', resources);
        }
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        this.params.output(context, stream, context.verbose ? 0 : undefined);
    }
}

/**
 * PDF Content Stream object
 */
export class PdfContentStream extends PdfObject<PdfDict> {
    private readonly stream = new PdfStream();

    constructor(document: PdfDocument) {
        const dict = new PdfDict();
        super(document.genSerial(), 0, dict);
        document.objects.add(this);
    }

    /**
     * Get the content stream buffer
     */
    getContentStream(): PdfStream {
        return this.stream;
    }

    override prepare(): void {
        super.prepare();

        // Set length of stream
        this.params.set('/Length', new PdfNum(this.stream.length));
    }

    writeContent(stream: PdfStream, context: PdfOutputContext): void {
        // Write dictionary
        this.params.output(context, stream, context.verbose ? 0 : undefined);

        // Write stream content
        stream.putString('\nstream\n');
        stream.putBytes(this.stream.getBytes());
        stream.putString('\nendstream');
    }
}

/**
 * Main PDF Document class
 */
export class PdfDocument {
    /** Document settings */
    public readonly settings: PdfDocumentSettings;

    /** All PDF objects in document */
    public readonly objects = new Set<PdfObject>();

    /** Object serial number counter */
    private serialCounter = 1;

    /** Document info object */
    public readonly info: PdfInfo;

    /** Document catalog (root) */
    public readonly catalog: PdfCatalog;

    /** Page list object */
    public readonly pageList: PdfPageList;

    /** Font registry */
    public readonly fontRegistry: FontRegistry;

    constructor(settings: PdfDocumentSettings = {}) {
        this.settings = {
            verbose: false,
            version: '1.4',
            compress: 0,
            ...settings,
        };

        // Create font registry
        this.fontRegistry = new FontRegistry(this);

        // Create core document objects
        this.info = new PdfInfo(this);
        this.catalog = new PdfCatalog(this);
        this.pageList = new PdfPageList(this);

        // Link catalog to pages
        this.catalog.setPages(this.pageList.ref());
    }

    /**
     * Generate next serial number for objects
     */
    genSerial(): number {
        return this.serialCounter++;
    }

    /**
     * Add a page to the document
     */
    addPage(options?: {
        width?: number;
        height?: number;
        mediaBox?: [number, number, number, number];
    }): PdfPage {
        const page = new PdfPage(this, options);
        page.setParent(this.pageList.ref());
        this.pageList.addPage(page);
        return page;
    }

    /**
     * Generate PDF output
     */
    async save(): Promise<Uint8Array> {
        const output = new PdfStream();
        const context: PdfOutputContext = {
            verbose: this.settings.verbose ?? false,
        };

        // Prepare all objects
        for (const obj of this.objects) {
            obj.prepare();
        }

        // PDF Header
        output.putString(`%PDF-${this.settings.version || '1.4'}\n`);
        output.putString('%\u00e2\u00e3\u00cf\u00d3\n'); // Binary comment as per PDF spec

        // Track object positions for xref table
        const xrefEntries: XRefEntry[] = [];

        // Write objects
        for (const obj of this.objects) {
            if (!obj.inUse) continue;

            const startPos = output.offset;
            xrefEntries.push({
                serial: obj.objser,
                generation: obj.objgen,
                offset: startPos,
                inUse: true,
            });

            obj.writeObject(output, context);
        }

        // Cross-reference table
        const xrefPos = output.offset;
        output.putString('xref\n');
        output.putString(`0 ${xrefEntries.length + 1}\n`);

        // Entry 0 (free list head)
        output.putString('0000000000 65535 f \n');

        // Object entries (sorted by serial number)
        xrefEntries.sort((a, b) => a.serial - b.serial);
        for (const entry of xrefEntries) {
            const offsetStr = entry.offset.toString().padStart(10, '0');
            const genStr = entry.generation.toString().padStart(5, '0');
            output.putString(`${offsetStr} ${genStr} n \n`);
        }

        // Trailer
        output.putString('trailer\n');
        const trailer = new PdfDict({
            '/Size': new PdfNum(xrefEntries.length + 1),
            '/Root': this.catalog.ref(),
            '/Info': this.info.ref(),
        });
        trailer.output(context, output);
        output.putString('\n');

        // Final xref position and EOF
        output.putString(`startxref\n${xrefPos}\n%%EOF\n`);

        return output.getBytes();
    }
}