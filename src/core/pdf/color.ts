/**
 * PDF Color System - Basic Color Management
 * 
 * Provides essential color functionality for the consolidated
 * typescript-pdf system.
 * 
 * @packageDocumentation
 */

/**
 * PDF Color class for RGB color management
 */
export class PdfColor {
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;

    constructor(red: number, green: number, blue: number) {
        this.red = Math.max(0, Math.min(1, red));
        this.green = Math.max(0, Math.min(1, green));
        this.blue = Math.max(0, Math.min(1, blue));
    }

    /**
     * Create color from hex string
     */
    static fromHex(hex: string): PdfColor {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return new PdfColor(r, g, b);
    }

    /**
     * Create color from RGB values (0-255)
     */
    static fromRgb(red: number, green: number, blue: number): PdfColor {
        return new PdfColor(red / 255, green / 255, blue / 255);
    }

    /**
     * Predefined colors
     */
    static readonly black = new PdfColor(0, 0, 0);
    static readonly white = new PdfColor(1, 1, 1);
    static readonly red = new PdfColor(1, 0, 0);
    static readonly green = new PdfColor(0, 1, 0);
    static readonly blue = new PdfColor(0, 0, 1);
    static readonly yellow = new PdfColor(1, 1, 0);
    static readonly magenta = new PdfColor(1, 0, 1);
    static readonly cyan = new PdfColor(0, 1, 1);
    static readonly gray = new PdfColor(0.5, 0.5, 0.5);

    /**
     * Convert to hex string
     */
    toHex(): string {
        const r = Math.round(this.red * 255).toString(16).padStart(2, '0');
        const g = Math.round(this.green * 255).toString(16).padStart(2, '0');
        const b = Math.round(this.blue * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    /**
     * Convert to RGB array (0-255)
     */
    toRgb(): [number, number, number] {
        return [
            Math.round(this.red * 255),
            Math.round(this.green * 255),
            Math.round(this.blue * 255)
        ];
    }

    /**
     * Convert to PDF color values (0-1)
     */
    toPdfValues(): [number, number, number] {
        return [this.red, this.green, this.blue];
    }

    /**
     * Check if colors are equal
     */
    equals(other: PdfColor): boolean {
        return this.red === other.red &&
            this.green === other.green &&
            this.blue === other.blue;
    }

    /**
     * Create a lighter version of the color
     */
    lighten(amount: number = 0.1): PdfColor {
        return new PdfColor(
            Math.min(1, this.red + amount),
            Math.min(1, this.green + amount),
            Math.min(1, this.blue + amount)
        );
    }

    /**
     * Create a darker version of the color
     */
    darken(amount: number = 0.1): PdfColor {
        return new PdfColor(
            Math.max(0, this.red - amount),
            Math.max(0, this.green - amount),
            Math.max(0, this.blue - amount)
        );
    }

    /**
     * String representation
     */
    toString(): string {
        return `PdfColor(${this.red}, ${this.green}, ${this.blue})`;
    }
}