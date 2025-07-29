/**
 * PDF Primitive Data Types
 * 
 * Core PDF data types based on PDF specification and dart-pdf implementation
 * These are the fundamental building blocks for PDF objects
 * 
 * @packageDocumentation
 */

import type { PdfStream } from './stream.js';

/**
 * Base interface for all PDF data types
 */
export interface PdfDataType {
    /**
     * Output this data type to a PDF stream
     */
    output(context: PdfOutputContext, stream: PdfStream, indent?: number): void;
}

/**
 * Context for PDF output operations
 */
export interface PdfOutputContext {
    /** Whether to enable verbose output with comments */
    verbose?: boolean;
}

/**
 * PDF Number primitive
 */
export class PdfNum implements PdfDataType {
    constructor(public readonly value: number) { }

    output(context: PdfOutputContext, stream: PdfStream): void {
        // Format number appropriately (remove unnecessary decimal places)
        const formatted = this.value % 1 === 0
            ? this.value.toString()
            : this.value.toFixed(6).replace(/\.?0+$/, '');
        stream.putString(formatted);
    }

    toString(): string {
        return this.value.toString();
    }
}

/**
 * PDF String primitive  
 */
export class PdfString implements PdfDataType {
    constructor(public readonly value: string) { }

    output(context: PdfOutputContext, stream: PdfStream): void {
        // Escape special characters in PDF string
        const escaped = this.value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');

        stream.putString(`(${escaped})`);
    }

    toString(): string {
        return `(${this.value})`;
    }
}

/**
 * PDF Name primitive (starts with /)
 */
export class PdfName implements PdfDataType {
    public readonly name: string;

    constructor(name: string) {
        // Ensure name starts with /
        this.name = name.startsWith('/') ? name : `/${name}`;
    }

    output(context: PdfOutputContext, stream: PdfStream): void {
        stream.putString(this.name);
    }

    toString(): string {
        return this.name;
    }

    equals(other: PdfName): boolean {
        return this.name === other.name;
    }
}

/**
 * PDF Array primitive
 */
export class PdfArray implements PdfDataType {
    public readonly values: PdfDataType[] = [];

    constructor(values?: PdfDataType[]) {
        if (values) {
            this.values.push(...values);
        }
    }

    /**
     * Create array from numbers
     */
    static fromNum(numbers: number[]): PdfArray {
        return new PdfArray(numbers.map(n => new PdfNum(n)));
    }

    /**
     * Create array from objects (will be converted to indirect references)
     */
    static fromObjects(objects: PdfObject[]): PdfArray {
        return new PdfArray(objects.map(obj => new PdfIndirect(obj.objser, obj.objgen)));
    }

    /**
     * Add value to array
     */
    add(value: PdfDataType): void {
        this.values.push(value);
    }

    /**
     * Remove duplicate values
     */
    uniq(): void {
        const seen = new Set<string>();
        for (let i = this.values.length - 1; i >= 0; i--) {
            const str = this.values[i]!.toString();
            if (seen.has(str)) {
                this.values.splice(i, 1);
            } else {
                seen.add(str);
            }
        }
    }

    get length(): number {
        return this.values.length;
    }

    get isEmpty(): boolean {
        return this.values.length === 0;
    }

    get isNotEmpty(): boolean {
        return this.values.length > 0;
    }

    output(context: PdfOutputContext, stream: PdfStream, indent?: number): void {
        stream.putString('[');

        for (let i = 0; i < this.values.length; i++) {
            if (i > 0) {
                stream.putString(' ');
            }
            this.values[i]!.output(context, stream, indent);
        }

        stream.putString(']');
    }

    toString(): string {
        return `[${this.values.map(v => v.toString()).join(' ')}]`;
    }
}

/**
 * PDF Dictionary primitive
 */
export class PdfDict implements PdfDataType {
    private readonly entries = new Map<string, PdfDataType>();

    constructor(values?: Record<string, PdfDataType>) {
        if (values) {
            for (const [key, value] of Object.entries(values)) {
                this.entries.set(key, value);
            }
        }
    }

    /**
     * Create dictionary with initial values
     */
    static values(values: Record<string, PdfDataType>): PdfDict {
        return new PdfDict(values);
    }

    /**
     * Set a value in the dictionary
     */
    set(key: string, value: PdfDataType): void {
        this.entries.set(key, value);
    }

    /**
     * Get a value from the dictionary
     */
    get(key: string): PdfDataType | undefined {
        return this.entries.get(key);
    }

    /**
     * Check if dictionary contains key
     */
    containsKey(key: string): boolean {
        return this.entries.has(key);
    }

    /**
     * Remove a key from the dictionary
     */
    remove(key: string): boolean {
        return this.entries.delete(key);
    }

    get isEmpty(): boolean {
        return this.entries.size === 0;
    }

    get isNotEmpty(): boolean {
        return this.entries.size > 0;
    }

    /**
     * Dictionary access using bracket notation
     */
    [key: string]: any;

    output(context: PdfOutputContext, stream: PdfStream, indent?: number): void {
        stream.putString('<<');

        if (context.verbose && indent) {
            stream.putString('\n');
        }

        for (const [key, value] of this.entries) {
            if (context.verbose && indent) {
                stream.putString(' '.repeat(indent + 2));
            } else {
                stream.putString(' ');
            }

            // Ensure key starts with /
            const pdfKey = key.startsWith('/') ? key : `/${key}`;
            stream.putString(pdfKey);
            stream.putString(' ');

            value.output(context, stream, indent ? indent + 2 : undefined);

            if (context.verbose && indent) {
                stream.putString('\n');
            }
        }

        if (context.verbose && indent) {
            stream.putString(' '.repeat(indent));
        }
        stream.putString('>>');
    }

    toString(): string {
        const entries = Array.from(this.entries.entries())
            .map(([key, value]) => `${key} ${value.toString()}`)
            .join(' ');
        return `<<${entries}>>`;
    }
}

/**
 * PDF Indirect Object Reference
 */
export class PdfIndirect implements PdfDataType {
    constructor(
        public readonly serial: number,
        public readonly generation: number = 0
    ) { }

    output(context: PdfOutputContext, stream: PdfStream): void {
        stream.putString(`${this.serial} ${this.generation} R`);
    }

    toString(): string {
        return `${this.serial} ${this.generation} R`;
    }

    equals(other: PdfIndirect): boolean {
        return this.serial === other.serial && this.generation === other.generation;
    }
}

/**
 * PDF Number List - helper for outputting number arrays
 */
export class PdfNumList implements PdfDataType {
    constructor(public readonly values: number[]) { }

    output(context: PdfOutputContext, stream: PdfStream): void {
        for (let i = 0; i < this.values.length; i++) {
            if (i > 0) {
                stream.putString(' ');
            }
            new PdfNum(this.values[i]!).output(context, stream);
        }
    }

    toString(): string {
        return this.values.join(' ');
    }
}

/**
 * Base PDF Object class
 */
export abstract class PdfObject<T extends PdfDataType = PdfDataType> {
    /** Object serial number */
    public readonly objser: number;

    /** Object generation number */
    public readonly objgen: number;

    /** Object parameters/content */
    public readonly params: T;

    /** Whether object is in use */
    public inUse: boolean = true;

    constructor(objser: number, objgen: number, params: T) {
        this.objser = objser;
        this.objgen = objgen;
        this.params = params;
    }

    /**
     * Get indirect reference to this object
     */
    ref(): PdfIndirect {
        return new PdfIndirect(this.objser, this.objgen);
    }

    /**
     * Prepare object for output (override in subclasses)
     */
    prepare(): void {
        // Default implementation does nothing
    }

    /**
     * Write object content to stream (override in subclasses)
     */
    abstract writeContent(stream: PdfStream, context: PdfOutputContext): void;

    /**
     * Write full object to stream
     */
    writeObject(stream: PdfStream, context: PdfOutputContext): void {
        // Object header
        stream.putString(`${this.objser} ${this.objgen} obj\n`);

        // Object content
        this.writeContent(stream, context);

        // Object footer
        stream.putString('\nendobj\n');
    }

    toString(): string {
        return `${this.constructor.name} ${this.objser} ${this.objgen}`;
    }
}