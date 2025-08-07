/**
 * PDF Color System - Advanced Color Management with Alpha Support
 *
 * Provides comprehensive color functionality for the consolidated
 * typescript-pdf system with full RGBA support, multiple input formats,
 * and robust error handling.
 *
 * @packageDocumentation
 */

/**
 * Error thrown when invalid color values or formats are provided
 */
export class PdfColorError extends Error {
    constructor(
        message: string,
        public readonly value?: unknown
    ) {
        super(message);
        this.name = 'PdfColorError';
    }
}

/**
 * Advanced PDF Color class with RGBA support and comprehensive format handling
 */
export class PdfColor {
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;
    public readonly alpha: number;

    /**
     * Create a new PDF color with RGBA values
     * @param red - Red component (0-1)
     * @param green - Green component (0-1)
     * @param blue - Blue component (0-1)
     * @param alpha - Alpha component (0-1), defaults to 1 (fully opaque)
     */
    constructor(red: number, green: number, blue: number, alpha: number = 1) {
        // Validate numeric inputs
        this.validateColorComponent('red', red);
        this.validateColorComponent('green', green);
        this.validateColorComponent('blue', blue);
        this.validateColorComponent('alpha', alpha);

        // Clamp values to valid range
        this.red = Math.max(0, Math.min(1, red));
        this.green = Math.max(0, Math.min(1, green));
        this.blue = Math.max(0, Math.min(1, blue));
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    /**
     * Validate a color component value
     */
    private validateColorComponent(
        name: string,
        value: unknown
    ): asserts value is number {
        if (!Number.isFinite(value)) {
            throw new PdfColorError(
                `${name} component must be a finite number, got ${value}`,
                value
            );
        }
    }

    /**
     * Create color from hex string
     * Supports both 3-digit (#fff) and 6-digit (#ffffff) formats
     * Optionally supports 4-digit (#ffff) and 8-digit (#ffffffff) formats with alpha
     *
     * @param hex - Hex color string (with or without #)
     * @param alpha - Optional alpha override (0-1)
     */
    static fromHex(hex: string, alpha?: number): PdfColor {
        const cleanHex = hex.replace('#', '').toLowerCase();

        // Validate hex characters
        if (!/^[0-9a-f]+$/.test(cleanHex)) {
            throw new PdfColorError(
                `Invalid hex color format: contains non-hex characters`,
                hex
            );
        }

        let r: number,
            g: number,
            b: number,
            a: number = 1;

        if (cleanHex.length === 3) {
            // 3-digit hex: #fff -> #ffffff
            r =
                parseInt(
                    cleanHex.substring(0, 1) + cleanHex.substring(0, 1),
                    16
                ) / 255;
            g =
                parseInt(
                    cleanHex.substring(1, 2) + cleanHex.substring(1, 2),
                    16
                ) / 255;
            b =
                parseInt(
                    cleanHex.substring(2, 3) + cleanHex.substring(2, 3),
                    16
                ) / 255;
        } else if (cleanHex.length === 4) {
            // 4-digit hex with alpha: #ffff -> #ffffffff
            r =
                parseInt(
                    cleanHex.substring(0, 1) + cleanHex.substring(0, 1),
                    16
                ) / 255;
            g =
                parseInt(
                    cleanHex.substring(1, 2) + cleanHex.substring(1, 2),
                    16
                ) / 255;
            b =
                parseInt(
                    cleanHex.substring(2, 3) + cleanHex.substring(2, 3),
                    16
                ) / 255;
            a =
                parseInt(
                    cleanHex.substring(3, 4) + cleanHex.substring(3, 4),
                    16
                ) / 255;
        } else if (cleanHex.length === 6) {
            // 6-digit hex: #ffffff
            r = parseInt(cleanHex.substring(0, 2), 16) / 255;
            g = parseInt(cleanHex.substring(2, 4), 16) / 255;
            b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        } else if (cleanHex.length === 8) {
            // 8-digit hex with alpha: #ffffffff
            r = parseInt(cleanHex.substring(0, 2), 16) / 255;
            g = parseInt(cleanHex.substring(2, 4), 16) / 255;
            b = parseInt(cleanHex.substring(4, 6), 16) / 255;
            a = parseInt(cleanHex.substring(6, 8), 16) / 255;
        } else {
            throw new PdfColorError(
                `Invalid hex color length: expected 3, 4, 6, or 8 characters, got ${cleanHex.length}`,
                hex
            );
        }

        // Check for parsing errors
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
            throw new PdfColorError(
                `Failed to parse hex color components`,
                hex
            );
        }

        // Override alpha if explicitly provided
        if (alpha) {
            a = alpha;
        }

        return new PdfColor(r, g, b, a);
    }

    /**
     * Create color from RGB values (0-255)
     * @param red - Red component (0-255)
     * @param green - Green component (0-255)
     * @param blue - Blue component (0-255)
     * @param alpha - Alpha component (0-1), defaults to 1 (fully opaque)
     */
    static fromRgba(
        red: number,
        green: number,
        blue: number,
        alpha?: number
    ): PdfColor {
        if (
            !Number.isInteger(red) ||
            !Number.isInteger(green) ||
            !Number.isInteger(blue)
        ) {
            throw new PdfColorError(
                `RGB values must be integers between 0-255`
            );
        }

        if (
            red < 0 ||
            red > 255 ||
            green < 0 ||
            green > 255 ||
            blue < 0 ||
            blue > 255
        ) {
            throw new PdfColorError(
                `RGB values must be between 0-255, got (${red}, ${green}, ${blue})`
            );
        }

        return new PdfColor(red / 255, green / 255, blue / 255, alpha ?? 1);
    }

    /**
     * Create color from HSL values
     * @param hue - Hue (0-360)
     * @param saturation - Saturation (0-100)
     * @param lightness - Lightness (0-100)
     * @param alpha - Alpha component (0-1), defaults to 1
     */
    static fromHsl(
        hue: number,
        saturation: number,
        lightness: number,
        alpha: number = 1
    ): PdfColor {
        if (
            !Number.isFinite(hue) ||
            !Number.isFinite(saturation) ||
            !Number.isFinite(lightness) ||
            !Number.isFinite(alpha)
        ) {
            throw new PdfColorError(`HSL values must be finite numbers`);
        }

        if (hue < 0 || hue > 360) {
            throw new PdfColorError(`Hue must be between 0-360, got ${hue}`);
        }

        if (saturation < 0 || saturation > 100) {
            throw new PdfColorError(
                `Saturation must be between 0-100, got ${saturation}`
            );
        }

        if (lightness < 0 || lightness > 100) {
            throw new PdfColorError(
                `Lightness must be between 0-100, got ${lightness}`
            );
        }

        if (alpha < 0 || alpha > 1) {
            throw new PdfColorError(`Alpha must be between 0-1, got ${alpha}`);
        }

        // Convert HSL to RGB
        const h = hue / 360;
        const s = saturation / 100;
        const l = lightness / 100;

        let r: number, g: number, b: number;

        if (s === 0) {
            r = g = b = l; // Achromatic
        } else {
            const hue2rgb = (p: number, q: number, t: number): number => {
                if (t < 0) {
                    t += 1;
                }
                if (t > 1) {
                    t -= 1;
                }
                if (t < 1 / 6) {
                    return p + (q - p) * 6 * t;
                }
                if (t < 1 / 2) {
                    return q;
                }
                if (t < 2 / 3) {
                    return p + (q - p) * (2 / 3 - t) * 6;
                }
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return new PdfColor(r, g, b, alpha);
    }

    /**
     * Predefined colors with full alpha support
     */
    static readonly black = new PdfColor(0, 0, 0, 1);
    static readonly white = new PdfColor(1, 1, 1, 1);
    static readonly red = new PdfColor(1, 0, 0, 1);
    static readonly green = new PdfColor(0, 1, 0, 1);
    static readonly blue = new PdfColor(0, 0, 1, 1);
    static readonly yellow = new PdfColor(1, 1, 0, 1);
    static readonly magenta = new PdfColor(1, 0, 1, 1);
    static readonly cyan = new PdfColor(0, 1, 1, 1);
    static readonly gray = new PdfColor(0.5, 0.5, 0.5, 1);
    static readonly transparent = new PdfColor(0, 0, 0, 0);

    /**
     * Additional predefined colors
     */
    static readonly orange = new PdfColor(1, 0.647, 0, 1);
    static readonly purple = new PdfColor(0.5, 0, 0.5, 1);
    static readonly brown = new PdfColor(0.647, 0.165, 0.165, 1);
    static readonly pink = new PdfColor(1, 0.753, 0.796, 1);
    static readonly lightGray = new PdfColor(0.827, 0.827, 0.827, 1);
    static readonly darkGray = new PdfColor(0.169, 0.169, 0.169, 1);

    /**
     * Convert to hex string (without alpha)
     * @param includeAlpha - Whether to include alpha in output (8-digit hex)
     */
    toHex(includeAlpha: boolean = false): string {
        const r = Math.round(this.red * 255)
            .toString(16)
            .padStart(2, '0');
        const g = Math.round(this.green * 255)
            .toString(16)
            .padStart(2, '0');
        const b = Math.round(this.blue * 255)
            .toString(16)
            .padStart(2, '0');

        if (includeAlpha) {
            const a = Math.round(this.alpha * 255)
                .toString(16)
                .padStart(2, '0');
            return `#${r}${g}${b}${a}`;
        }

        return `#${r}${g}${b}`;
    }

    /**
     * Convert to RGB array (0-255)
     */
    toRgb(): [number, number, number] {
        return [
            Math.round(this.red * 255),
            Math.round(this.green * 255),
            Math.round(this.blue * 255),
        ];
    }

    /**
     * Convert to RGBA array (0-255 for RGB, 0-1 for alpha)
     */
    toRgba(): [number, number, number, number] {
        return [
            Math.round(this.red * 255),
            Math.round(this.green * 255),
            Math.round(this.blue * 255),
            this.alpha,
        ];
    }

    /**
     * Convert to HSL array
     */
    toHsl(): [number, number, number] {
        const r = this.red;
        const g = this.green;
        const b = this.blue;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h: number, s: number;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // Achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
                default:
                    h = 0;
                    break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    /**
     * Convert to HSLA array
     */
    toHsla(): [number, number, number, number] {
        const [h, s, l] = this.toHsl();
        return [h, s, l, this.alpha];
    }

    /**
     * Convert to PDF color values (0-1)
     */
    toPdfValues(): [number, number, number] {
        return [this.red, this.green, this.blue];
    }

    /**
     * Convert to PDF color values with alpha (0-1)
     */
    toPdfValuesWithAlpha(): [number, number, number, number] {
        return [this.red, this.green, this.blue, this.alpha];
    }

    /**
     * Check if colors are equal (including alpha)
     */
    equals(other: PdfColor): boolean {
        return (
            this.red === other.red &&
            this.green === other.green &&
            this.blue === other.blue &&
            this.alpha === other.alpha
        );
    }

    /**
     * Check if colors are equal ignoring alpha
     */
    equalsIgnoreAlpha(other: PdfColor): boolean {
        return (
            this.red === other.red &&
            this.green === other.green &&
            this.blue === other.blue
        );
    }

    /**
     * Create a copy with modified alpha
     */
    withAlpha(alpha: number): PdfColor {
        if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
            throw new PdfColorError(
                `Alpha must be a number between 0-1, got ${alpha}`
            );
        }
        return new PdfColor(this.red, this.green, this.blue, alpha);
    }

    /**
     * Create a copy with modified opacity (alias for withAlpha)
     */
    withOpacity(opacity: number): PdfColor {
        return this.withAlpha(opacity);
    }

    /**
     * Create a lighter version of the color
     */
    lighten(amount: number = 0.1): PdfColor {
        if (!Number.isFinite(amount)) {
            throw new PdfColorError(
                `Lighten amount must be a finite number, got ${amount}`
            );
        }

        return new PdfColor(
            Math.min(1, this.red + amount),
            Math.min(1, this.green + amount),
            Math.min(1, this.blue + amount),
            this.alpha
        );
    }

    /**
     * Create a darker version of the color
     */
    darken(amount: number = 0.1): PdfColor {
        if (!Number.isFinite(amount)) {
            throw new PdfColorError(
                `Darken amount must be a finite number, got ${amount}`
            );
        }

        return new PdfColor(
            Math.max(0, this.red - amount),
            Math.max(0, this.green - amount),
            Math.max(0, this.blue - amount),
            this.alpha
        );
    }

    /**
     * Create a more saturated version of the color
     */
    saturate(amount: number = 0.1): PdfColor {
        if (!Number.isFinite(amount)) {
            throw new PdfColorError(
                `Saturate amount must be a finite number, got ${amount}`
            );
        }

        const [h, s, l] = this.toHsl();
        return PdfColor.fromHsl(
            h,
            Math.min(100, s + amount * 100),
            l,
            this.alpha
        );
    }

    /**
     * Create a less saturated version of the color
     */
    desaturate(amount: number = 0.1): PdfColor {
        if (!Number.isFinite(amount)) {
            throw new PdfColorError(
                `Desaturate amount must be a finite number, got ${amount}`
            );
        }

        const [h, s, l] = this.toHsl();
        return PdfColor.fromHsl(
            h,
            Math.max(0, s - amount * 100),
            l,
            this.alpha
        );
    }

    /**
     * Mix this color with another color
     */
    mix(other: PdfColor, amount: number = 0.5): PdfColor {
        if (!Number.isFinite(amount) || amount < 0 || amount > 1) {
            throw new PdfColorError(
                `Mix amount must be a number between 0-1, got ${amount}`
            );
        }

        const inv = 1 - amount;
        return new PdfColor(
            this.red * inv + other.red * amount,
            this.green * inv + other.green * amount,
            this.blue * inv + other.blue * amount,
            this.alpha * inv + other.alpha * amount
        );
    }

    /**
     * Get the perceived brightness of the color (0-1)
     * Uses the relative luminance formula
     */
    getBrightness(): number {
        return 0.299 * this.red + 0.587 * this.green + 0.114 * this.blue;
    }

    /**
     * Check if the color is considered dark
     */
    isDark(threshold: number = 0.5): boolean {
        return this.getBrightness() < threshold;
    }

    /**
     * Check if the color is considered light
     */
    isLight(threshold: number = 0.5): boolean {
        return this.getBrightness() >= threshold;
    }

    /**
     * String representation
     */
    toString(): string {
        if (this.alpha < 1) {
            return `PdfColor(${this.red.toFixed(3)}, ${this.green.toFixed(3)}, ${this.blue.toFixed(3)}, ${this.alpha.toFixed(3)})`;
        }
        return `PdfColor(${this.red.toFixed(3)}, ${this.green.toFixed(3)}, ${this.blue.toFixed(3)})`;
    }
}
