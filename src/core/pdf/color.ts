/**
 * PDF Color System
 * 
 * Comprehensive color representation and manipulation system based on dart-pdf.
 * Supports RGB, CMYK, HSV, HSL color spaces with alpha channel and conversion utilities.
 * 
 * @packageDocumentation
 */

/**
 * Base class representing a color in RGB space with alpha channel
 */
export class PdfColor {
    /** Red component (0-1) */
    public readonly red: number;
    /** Green component (0-1) */
    public readonly green: number;
    /** Blue component (0-1) */
    public readonly blue: number;
    /** Alpha/opacity component (0-1) */
    public readonly alpha: number;

    /**
     * Create a color with red, green, blue and alpha components
     * Values should be between 0 and 1
     */
    constructor(red: number, green: number, blue: number, alpha: number = 1.0) {
        // Validate ranges (following dart-pdf assertions)
        if (!Number.isFinite(red) || red < 0 || red > 1) throw new Error(`Red component must be between 0 and 1, got ${red}`);
        if (!Number.isFinite(green) || green < 0 || green > 1) throw new Error(`Green component must be between 0 and 1, got ${green}`);
        if (!Number.isFinite(blue) || blue < 0 || blue > 1) throw new Error(`Blue component must be between 0 and 1, got ${blue}`);
        if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error(`Alpha component must be between 0 and 1, got ${alpha}`);

        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    /**
     * Create a color from a 32-bit integer: 0xAARRGGBB
     */
    static fromInt(color: number): PdfColor {
        const red = ((color >> 16) & 0xff) / 255.0;
        const green = ((color >> 8) & 0xff) / 255.0;
        const blue = (color & 0xff) / 255.0;
        const alpha = ((color >> 24) & 0xff) / 255.0;
        return new PdfColor(red, green, blue, alpha);
    }

    /**
     * Create a color from a hex string
     * Can parse colors in the form:
     * - #RRGGBBAA
     * - #RRGGBB
     * - #RGB
     * - RRGGBBAA
     * - RRGGBB
     * - RGB
     */
    static fromHex(color: string): PdfColor {
        let hex = color.startsWith('#') ? color.substring(1) : color;

        let red: number;
        let green: number;
        let blue: number;
        let alpha = 1.0;

        if (hex.length === 3) {
            // RGB shorthand
            red = parseInt(hex.substring(0, 1).repeat(2), 16) / 255;
            green = parseInt(hex.substring(1, 2).repeat(2), 16) / 255;
            blue = parseInt(hex.substring(2, 3).repeat(2), 16) / 255;
            return new PdfColor(red, green, blue, alpha);
        }

        if (hex.length !== 6 && hex.length !== 8) {
            throw new Error(`Invalid hex color format: ${color}. Expected 3, 6, or 8 characters.`);
        }

        red = parseInt(hex.substring(0, 2), 16) / 255;
        green = parseInt(hex.substring(2, 4), 16) / 255;
        blue = parseInt(hex.substring(4, 6), 16) / 255;

        if (hex.length === 8) {
            alpha = parseInt(hex.substring(6, 8), 16) / 255;
        }

        return new PdfColor(red, green, blue, alpha);
    }

    /**
     * Create RGB color from RYB (Red, Yellow, Blue) color space
     * This is an artistic color space that's more intuitive for color mixing
     */
    static fromRYB(red: number, yellow: number, blue: number, alpha: number = 1.0): PdfColor {
        // Validate input ranges
        if (red < 0 || red > 1) throw new Error(`Red component must be between 0 and 1, got ${red}`);
        if (yellow < 0 || yellow > 1) throw new Error(`Yellow component must be between 0 and 1, got ${yellow}`);
        if (blue < 0 || blue > 1) throw new Error(`Blue component must be between 0 and 1, got ${blue}`);
        if (alpha < 0 || alpha > 1) throw new Error(`Alpha component must be between 0 and 1, got ${alpha}`);

        // Magic conversion matrix from dart-pdf
        const magic: number[][] = [
            [1, 1, 1],
            [1, 1, 0],
            [1, 0, 0],
            [1, 0.5, 0],
            [0.163, 0.373, 0.6],
            [0.0, 0.66, 0.2],
            [0.5, 0.0, 0.5],
            [0.2, 0.094, 0.0]
        ];

        function cubicInt(t: number, A: number, B: number): number {
            const weight = t * t * (3 - 2 * t);
            return A + weight * (B - A);
        }

        function getRed(iR: number, iY: number, iB: number): number {
            const x0 = cubicInt(iB, magic[0]![0]!, magic[4]![0]!);
            const x1 = cubicInt(iB, magic[1]![0]!, magic[5]![0]!);
            const x2 = cubicInt(iB, magic[2]![0]!, magic[6]![0]!);
            const x3 = cubicInt(iB, magic[3]![0]!, magic[7]![0]!);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        }

        function getGreen(iR: number, iY: number, iB: number): number {
            const x0 = cubicInt(iB, magic[0]![1]!, magic[4]![1]!);
            const x1 = cubicInt(iB, magic[1]![1]!, magic[5]![1]!);
            const x2 = cubicInt(iB, magic[2]![1]!, magic[6]![1]!);
            const x3 = cubicInt(iB, magic[3]![1]!, magic[7]![1]!);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        }

        function getBlue(iR: number, iY: number, iB: number): number {
            const x0 = cubicInt(iB, magic[0]![2]!, magic[4]![2]!);
            const x1 = cubicInt(iB, magic[1]![2]!, magic[5]![2]!);
            const x2 = cubicInt(iB, magic[2]![2]!, magic[6]![2]!);
            const x3 = cubicInt(iB, magic[3]![2]!, magic[7]![2]!);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        }

        const redValue = getRed(red, yellow, blue);
        const greenValue = getGreen(red, yellow, blue);
        const blueValue = getBlue(red, yellow, blue);

        return new PdfColor(redValue, greenValue, blueValue, alpha);
    }

    /**
     * Get the 32-bit integer representation of this color (0xAARRGGBB)
     */
    toInt(): number {
        const a = Math.round(this.alpha * 255) & 0xff;
        const r = Math.round(this.red * 255) & 0xff;
        const g = Math.round(this.green * 255) & 0xff;
        const b = Math.round(this.blue * 255) & 0xff;
        return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0; // Unsigned 32-bit
    }

    /**
     * Get hexadecimal representation of this color
     */
    toHex(): string {
        const r = Math.round(this.red * 255).toString(16).padStart(2, '0');
        const g = Math.round(this.green * 255).toString(16).padStart(2, '0');
        const b = Math.round(this.blue * 255).toString(16).padStart(2, '0');

        // Return 6-digit hex by default (without alpha) for compatibility
        if (this.alpha === 1.0) {
            return `#${r}${g}${b}`;
        } else {
            // Include alpha only when needed
            const a = Math.round(this.alpha * 255).toString(16).padStart(2, '0');
            return `#${r}${g}${b}${a}`;
        }
    }

    /**
     * Convert this color to CMYK color space
     */
    toCmyk(): PdfColorCmyk {
        return PdfColorCmyk.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Convert this color to HSV color space
     */
    toHsv(): PdfColorHsv {
        return PdfColorHsv.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Convert this color to HSL color space
     */
    toHsl(): PdfColorHsl {
        return PdfColorHsl.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Linearize a color component for luminance calculation
     */
    private static linearizeColorComponent(component: number): number {
        if (component <= 0.03928) {
            return component / 12.92;
        }
        return Math.pow((component + 0.055) / 1.055, 2.4);
    }

    /**
     * Calculate the relative luminance of this color
     */
    get luminance(): number {
        const R = PdfColor.linearizeColorComponent(this.red);
        const G = PdfColor.linearizeColorComponent(this.green);
        const B = PdfColor.linearizeColorComponent(this.blue);
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Determine if this color is light
     */
    get isLight(): boolean {
        return !this.isDark;
    }

    /**
     * Determine if this color is dark
     */
    get isDark(): boolean {
        const relativeLuminance = this.luminance;
        const kThreshold = 0.15;
        return (relativeLuminance + 0.05) * (relativeLuminance + 0.05) > kThreshold;
    }

    /**
     * Create a shade of this color
     * @param strength Shading strength (< 0.5 lightens, > 0.5 darkens)
     */
    shade(strength: number): PdfColor {
        const ds = 1.5 - strength;
        const hsl = this.toHsl();
        return PdfColorHsl.create(
            hsl.hue,
            hsl.saturation,
            Math.max(0, Math.min(1, hsl.lightness * ds)),
            this.alpha
        );
    }

    /**
     * Get a complementary color (hue shifted by 180°)
     */
    get complementary(): PdfColor {
        return this.toHsv().complementary;
    }

    /**
     * Get monochromatic color variations
     */
    get monochromatic(): PdfColor[] {
        return this.toHsv().monochromatic;
    }

    /**
     * Get split-complementary colors
     */
    get splitcomplementary(): PdfColor[] {
        return this.toHsv().splitcomplementary;
    }

    /**
     * Get tetradic colors (rectangular color scheme)
     */
    get tetradic(): PdfColor[] {
        return this.toHsv().tetradic;
    }

    /**
     * Get triadic colors
     */
    get triadic(): PdfColor[] {
        return this.toHsv().triadic;
    }

    /**
     * Get analogous colors
     */
    get analagous(): PdfColor[] {
        return this.toHsv().analagous;
    }

    /**
     * Apply transparency by flattening against a background color
     */
    flatten(background: PdfColor = new PdfColor(1, 1, 1)): PdfColor {
        return new PdfColor(
            this.alpha * this.red + (1 - this.alpha) * background.red,
            this.alpha * this.green + (1 - this.alpha) * background.green,
            this.alpha * this.blue + (1 - this.alpha) * background.blue,
            background.alpha
        );
    }

    /**
     * String representation
     */
    toString(): string {
        return `PdfColor(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }

    /**
     * Equality comparison
     */
    equals(other: PdfColor): boolean {
        return this.red === other.red &&
            this.green === other.green &&
            this.blue === other.blue &&
            this.alpha === other.alpha;
    }

    /**
     * Hash code for use in maps/sets
     */
    get hashCode(): number {
        return this.toInt();
    }

    // Static color constants
    static readonly black = new PdfColor(0, 0, 0);
    static readonly white = new PdfColor(1, 1, 1);
    static readonly red = new PdfColor(1, 0, 0);
    static readonly green = new PdfColor(0, 1, 0);
    static readonly blue = new PdfColor(0, 0, 1);
    static readonly yellow = new PdfColor(1, 1, 0);
    static readonly cyan = new PdfColor(0, 1, 1);
    static readonly magenta = new PdfColor(1, 0, 1);
    static readonly transparent = new PdfColor(0, 0, 0, 0);
}

/**
 * Grey color class - a specialized RGB color with equal R, G, B values
 */
export class PdfColorGrey extends PdfColor {
    /**
     * Create a grey color
     */
    constructor(color: number, alpha: number = 1.0) {
        super(color, color, color, alpha);
    }
}

/**
 * CMYK color space representation
 */
export class PdfColorCmyk extends PdfColor {
    /** Cyan component (0-1) */
    public readonly cyan: number;
    /** Magenta component (0-1) */
    public readonly magenta: number;
    /** Yellow component (0-1) */
    public readonly yellow: number;
    /** Black (Key) component (0-1) */
    public readonly black: number;

    /**
     * Create a CMYK color
     */
    constructor(cyan: number, magenta: number, yellow: number, black: number, alpha: number = 1.0) {
        // Convert CMYK to RGB for base class
        const r = (1.0 - cyan) * (1.0 - black);
        const g = (1.0 - magenta) * (1.0 - black);
        const b = (1.0 - yellow) * (1.0 - black);

        super(r, g, b, alpha);

        this.cyan = cyan;
        this.magenta = magenta;
        this.yellow = yellow;
        this.black = black;
    }

    /**
     * Create CMYK color from RGB values
     */
    static fromRgb(r: number, g: number, b: number, a: number = 1.0): PdfColorCmyk {
        const black = 1.0 - Math.max(r, Math.max(g, b));
        const cyan = black === 1.0 ? 0 : (1.0 - r - black) / (1.0 - black);
        const magenta = black === 1.0 ? 0 : (1.0 - g - black) / (1.0 - black);
        const yellow = black === 1.0 ? 0 : (1.0 - b - black) / (1.0 - black);

        return new PdfColorCmyk(cyan, magenta, yellow, black, a);
    }

    /**
     * Convert to CMYK (returns self)
     */
    override toCmyk(): PdfColorCmyk {
        return this;
    }

    /**
     * String representation
     */
    override toString(): string {
        return `PdfColorCmyk(${this.cyan}, ${this.magenta}, ${this.yellow}, ${this.black}, ${this.alpha})`;
    }
}

/**
 * Helper function to get hue from RGB values
 */
function getHue(red: number, green: number, blue: number, max: number, delta: number): number {
    let hue: number;

    if (max === 0.0) {
        hue = 0.0;
    } else if (max === red) {
        hue = 60.0 * (((green - blue) / delta) % 6);
    } else if (max === green) {
        hue = 60.0 * (((blue - red) / delta) + 2);
    } else if (max === blue) {
        hue = 60.0 * (((red - green) / delta) + 4);
    } else {
        hue = 0.0;
    }

    // Set hue to 0.0 when red == green == blue
    return isNaN(hue) ? 0.0 : hue;
}

/**
 * HSV (Hue, Saturation, Value) color space representation
 * Same as HSB - cylindrical geometry with hue as angular dimension
 */
export class PdfColorHsv extends PdfColor {
    /** Hue in degrees (0-360) */
    public readonly hue: number;
    /** Saturation (0-1) */
    public readonly saturation: number;
    /** Value/Brightness (0-1) */
    public readonly value: number;

    /**
     * Create HSV color from hue, saturation, value
     */
    static create(hue: number, saturation: number, value: number, alpha: number = 1.0): PdfColorHsv {
        const chroma = saturation * value;
        const secondary = chroma * (1.0 - Math.abs(((hue / 60.0) % 2.0) - 1.0));
        const match = value - chroma;

        let red: number, green: number, blue: number;

        if (hue < 60.0) {
            red = chroma;
            green = secondary;
            blue = 0.0;
        } else if (hue < 120.0) {
            red = secondary;
            green = chroma;
            blue = 0.0;
        } else if (hue < 180.0) {
            red = 0.0;
            green = chroma;
            blue = secondary;
        } else if (hue < 240.0) {
            red = 0.0;
            green = secondary;
            blue = chroma;
        } else if (hue < 300.0) {
            red = secondary;
            green = 0.0;
            blue = chroma;
        } else {
            red = chroma;
            green = 0.0;
            blue = secondary;
        }

        return new PdfColorHsv(
            hue,
            saturation,
            value,
            Math.max(0, Math.min(1, red + match)),
            Math.max(0, Math.min(1, green + match)),
            Math.max(0, Math.min(1, blue + match)),
            alpha
        );
    }

    private constructor(
        hue: number,
        saturation: number,
        value: number,
        red: number,
        green: number,
        blue: number,
        alpha: number
    ) {
        // Validate ranges
        if (hue < 0 || hue >= 360) throw new Error(`Hue must be between 0 and 360, got ${hue}`);
        if (saturation < 0 || saturation > 1) throw new Error(`Saturation must be between 0 and 1, got ${saturation}`);
        if (value < 0 || value > 1) throw new Error(`Value must be between 0 and 1, got ${value}`);

        super(red, green, blue, alpha);

        this.hue = hue;
        this.saturation = saturation;
        this.value = value;
    }

    /**
     * Create HSV color from RGB values
     */
    static fromRgb(red: number, green: number, blue: number, alpha: number = 1.0): PdfColorHsv {
        const max = Math.max(red, Math.max(green, blue));
        const min = Math.min(red, Math.min(green, blue));
        const delta = max - min;

        const hue = getHue(red, green, blue, max, delta);
        const saturation = max === 0.0 ? 0.0 : delta / max;

        return new PdfColorHsv(hue, saturation, max, red, green, blue, alpha);
    }

    /**
     * Convert to HSV (returns self)
     */
    override toHsv(): PdfColorHsv {
        return this;
    }

    /**
     * Get complementary color (hue shifted by 180°)
     */
    override get complementary(): PdfColorHsv {
        return PdfColorHsv.create((this.hue + 180) % 360, this.saturation, this.value, this.alpha);
    }

    /**
     * Get monochromatic variations
     */
    override get monochromatic(): PdfColorHsv[] {
        return [
            PdfColorHsv.create(
                this.hue,
                Math.max(0, Math.min(1, this.saturation > 0.5 ? this.saturation - 0.2 : this.saturation + 0.2)),
                Math.max(0, Math.min(1, this.value > 0.5 ? this.value - 0.1 : this.value + 0.1)),
                this.alpha
            ),
            PdfColorHsv.create(
                this.hue,
                Math.max(0, Math.min(1, this.saturation > 0.5 ? this.saturation - 0.4 : this.saturation + 0.4)),
                Math.max(0, Math.min(1, this.value > 0.5 ? this.value - 0.2 : this.value + 0.2)),
                this.alpha
            ),
            PdfColorHsv.create(
                this.hue,
                Math.max(0, Math.min(1, this.saturation > 0.5 ? this.saturation - 0.15 : this.saturation + 0.15)),
                Math.max(0, Math.min(1, this.value > 0.5 ? this.value - 0.05 : this.value + 0.05)),
                this.alpha
            )
        ];
    }

    /**
     * Get split-complementary colors
     */
    override get splitcomplementary(): PdfColorHsv[] {
        return [
            PdfColorHsv.create((this.hue + 150) % 360, this.saturation, this.value, this.alpha),
            PdfColorHsv.create((this.hue + 210) % 360, this.saturation, this.value, this.alpha),
        ];
    }

    /**
     * Get triadic colors
     */
    override get triadic(): PdfColorHsv[] {
        return [
            PdfColorHsv.create((this.hue + 120) % 360, this.saturation, this.value, this.alpha),
            PdfColorHsv.create((this.hue + 240) % 360, this.saturation, this.value, this.alpha),
        ];
    }

    /**
     * Get tetradic colors
     */
    override get tetradic(): PdfColorHsv[] {
        return [
            PdfColorHsv.create((this.hue + 90) % 360, this.saturation, this.value, this.alpha),
            PdfColorHsv.create((this.hue + 180) % 360, this.saturation, this.value, this.alpha),
            PdfColorHsv.create((this.hue + 270) % 360, this.saturation, this.value, this.alpha),
        ];
    }

    /**
     * Get analogous colors
     */
    override get analagous(): PdfColorHsv[] {
        return [
            PdfColorHsv.create((this.hue + 30) % 360, this.saturation, this.value, this.alpha),
            PdfColorHsv.create((this.hue + 330) % 360, this.saturation, this.value, this.alpha),
        ];
    }

    /**
     * String representation
     */
    override toString(): string {
        return `PdfColorHsv(${this.hue}, ${this.saturation}, ${this.value}, ${this.alpha})`;
    }
}

/**
 * HSL (Hue, Saturation, Lightness) color space representation
 */
export class PdfColorHsl extends PdfColor {
    /** Hue in degrees (0-360) */
    public readonly hue: number;
    /** Saturation (0-1) */
    public readonly saturation: number;
    /** Lightness (0-1) */
    public readonly lightness: number;

    /**
     * Create HSL color from hue, saturation, lightness
     */
    static create(hue: number, saturation: number, lightness: number, alpha: number = 1.0): PdfColorHsl {
        const chroma = (1.0 - Math.abs(2.0 * lightness - 1.0)) * saturation;
        const secondary = chroma * (1.0 - Math.abs(((hue / 60.0) % 2.0) - 1.0));
        const match = lightness - chroma / 2.0;

        let red: number, green: number, blue: number;

        if (hue < 60.0) {
            red = chroma;
            green = secondary;
            blue = 0.0;
        } else if (hue < 120.0) {
            red = secondary;
            green = chroma;
            blue = 0.0;
        } else if (hue < 180.0) {
            red = 0.0;
            green = chroma;
            blue = secondary;
        } else if (hue < 240.0) {
            red = 0.0;
            green = secondary;
            blue = chroma;
        } else if (hue < 300.0) {
            red = secondary;
            green = 0.0;
            blue = chroma;
        } else {
            red = chroma;
            green = 0.0;
            blue = secondary;
        }

        return new PdfColorHsl(
            hue,
            saturation,
            lightness,
            alpha,
            Math.max(0, Math.min(1, red + match)),
            Math.max(0, Math.min(1, green + match)),
            Math.max(0, Math.min(1, blue + match))
        );
    }

    private constructor(
        hue: number,
        saturation: number,
        lightness: number,
        alpha: number,
        red: number,
        green: number,
        blue: number
    ) {
        // Validate ranges
        if (hue < 0 || hue >= 360) throw new Error(`Hue must be between 0 and 360, got ${hue}`);
        if (saturation < 0 || saturation > 1) throw new Error(`Saturation must be between 0 and 1, got ${saturation}`);
        if (lightness < 0 || lightness > 1) throw new Error(`Lightness must be between 0 and 1, got ${lightness}`);

        super(red, green, blue, alpha);

        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
    }

    /**
     * Create HSL color from RGB values
     */
    static fromRgb(red: number, green: number, blue: number, alpha: number = 1.0): PdfColorHsl {
        const max = Math.max(red, Math.max(green, blue));
        const min = Math.min(red, Math.min(green, blue));
        const delta = max - min;

        const hue = getHue(red, green, blue, max, delta);
        const lightness = (max + min) / 2.0;

        // Saturation can exceed 1.0 with rounding errors, so clamp it
        const saturation = lightness === 1.0
            ? 0.0
            : Math.max(0.0, Math.min(1.0, delta / (1.0 - Math.abs(2.0 * lightness - 1.0))));

        return new PdfColorHsl(hue, saturation, lightness, alpha, red, green, blue);
    }

    /**
     * Convert to HSL (returns self)
     */
    override toHsl(): PdfColorHsl {
        return this;
    }

    /**
     * String representation
     */
    override toString(): string {
        return `PdfColorHsl(${this.hue}, ${this.saturation}, ${this.lightness}, ${this.alpha})`;
    }
}