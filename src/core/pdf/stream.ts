/**
 * PDF Stream Buffer - Core PDF output stream
 * 
 * Based on dart-pdf PdfStream implementation
 * Handles binary output for PDF generation
 * 
 * @packageDocumentation
 */

/**
 * PDF output stream for writing binary data
 */
export class PdfStream {
    private buffer: Uint8Array;
    private position: number = 0;
    private capacity: number;

    constructor(initialCapacity: number = 1024) {
        this.capacity = initialCapacity;
        this.buffer = new Uint8Array(this.capacity);
    }

    /**
     * Current offset in the stream
     */
    get offset(): number {
        return this.position;
    }

    /**
     * Ensure the buffer has enough capacity
     */
    private ensureCapacity(additionalBytes: number): void {
        if (this.position + additionalBytes > this.capacity) {
            const newCapacity = Math.max(this.capacity * 2, this.position + additionalBytes);
            const newBuffer = new Uint8Array(newCapacity);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
            this.capacity = newCapacity;
        }
    }

    /**
     * Put a single byte into the stream
     */
    putByte(byte: number): void {
        this.ensureCapacity(1);
        this.buffer[this.position++] = byte;
    }

    /**
     * Put a string into the stream as UTF-8 bytes
     */
    putString(str: string): void {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        this.ensureCapacity(bytes.length);
        this.buffer.set(bytes, this.position);
        this.position += bytes.length;
    }

    /**
     * Put raw bytes into the stream
     */
    putBytes(bytes: Uint8Array): void {
        this.ensureCapacity(bytes.length);
        this.buffer.set(bytes, this.position);
        this.position += bytes.length;
    }

    /**
     * Put a comment into the stream (for debugging)
     */
    putComment(comment: string): void {
        this.putString(`% ${comment}\n`);
    }

    /**
     * Get the current buffer contents
     */
    getBytes(): Uint8Array {
        return this.buffer.slice(0, this.position);
    }

    /**
     * Clear the stream
     */
    clear(): void {
        this.position = 0;
    }

    /**
     * Get the current size of the stream
     */
    get length(): number {
        return this.position;
    }
}