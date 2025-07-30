/**
 * Custom Font Integration API
 * 
 * High-level API for working with fonts in typescript-pdf.
 * Integrates TTF parsing, loading, caching, layout, and subsetting.
 * 
 * @packageDocumentation
 */

import { FontLoader, FontRegistry, type FontSource, type FontLoadOptions } from './pdf/font-loader.js';
import { TtfFont, TtfFontRegistry } from './pdf/ttf-font.js';
import { TtfParser } from './pdf/ttf-parser.js';
import { TtfSubsetter, createFontSubset, createFontSubsetFromText } from './pdf/ttf-subsetter.js';
import { TextLayoutEngine, type TextLayoutOptions, type TextLayoutResult, createFontAdapter } from './text-layout.js';
import { PdfStandardFont } from './pdf/font.js';
import type { PdfDocument } from './pdf/document.js';

/**
 * Font weight enumeration
 */
export enum FontWeight {
    Thin = 100,
    ExtraLight = 200,
    Light = 300,
    Normal = 400,
    Medium = 500,
    SemiBold = 600,
    Bold = 700,
    ExtraBold = 800,
    Black = 900,
}

/**
 * Font style enumeration
 */
export enum FontStyle {
    Normal = 'normal',
    Italic = 'italic',
    Oblique = 'oblique',
}

/**
 * Font stretch enumeration
 */
export enum FontStretch {
    UltraCondensed = 'ultra-condensed',
    ExtraCondensed = 'extra-condensed',
    Condensed = 'condensed',
    SemiCondensed = 'semi-condensed',
    Normal = 'normal',
    SemiExpanded = 'semi-expanded',
    Expanded = 'expanded',
    ExtraExpanded = 'extra-expanded',
    UltraExpanded = 'ultra-expanded',
}

/**
 * Font descriptor for registration
 */
export interface FontDescriptor {
    /** Font family name */
    family: string;
    /** Font weight */
    weight?: FontWeight;
    /** Font style */
    style?: FontStyle;
    /** Font stretch */
    stretch?: FontStretch;
    /** Font source (file path, URL, or ArrayBuffer) */
    source: FontSource;
    /** Display name for the font */
    displayName?: string;
    /** Font loading options */
    options?: FontLoadOptions;
}

/**
 * Font fallback configuration
 */
export interface FontFallback {
    /** Primary font families to try */
    families: string[];
    /** Generic fallback (serif, sans-serif, monospace) */
    generic?: 'serif' | 'sans-serif' | 'monospace';
    /** Character set specific fallbacks */
    characterSets?: {
        /** Unicode range start */
        start: number;
        /** Unicode range end */
        end: number;
        /** Font families for this range */
        families: string[];
    }[];
}

/**
 * Text style configuration
 */
export interface TextStyleConfig {
    /** Font family or families */
    fontFamily?: string | string[];
    /** Font size in points */
    fontSize?: number;
    /** Font weight */
    fontWeight?: FontWeight;
    /** Font style */
    fontStyle?: FontStyle;
    /** Line height multiplier */
    lineHeight?: number;
    /** Letter spacing in points */
    letterSpacing?: number;
    /** Word spacing in points */
    wordSpacing?: number;
    /** Text color */
    color?: string;
    /** Text decoration */
    textDecoration?: {
        underline?: boolean;
        strikethrough?: boolean;
        overline?: boolean;
    };
}

/**
 * Font metrics information
 */
export interface FontMetrics {
    /** Font family name */
    family: string;
    /** Units per em */
    unitsPerEm: number;
    /** Ascender height */
    ascender: number;
    /** Descender depth */
    descender: number;
    /** Line gap */
    lineGap: number;
    /** Font bounding box */
    boundingBox: {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    };
    /** Number of glyphs */
    glyphCount: number;
    /** Supported character ranges */
    characterRanges: Array<{
        start: number;
        end: number;
        description: string;
    }>;
}

/**
 * Custom Font Manager
 * 
 * High-level font management system that integrates all font functionality
 */
export class FontManager {
    private readonly document: PdfDocument;
    private readonly fontRegistry: FontRegistry;
    private readonly ttfRegistry: TtfFontRegistry;
    private readonly registeredFonts = new Map<string, FontDescriptor>();
    private readonly fontFallbacks = new Map<string, FontFallback>();
    private readonly parsedFonts = new Map<string, TtfParser>();
    private readonly layoutEngines = new Map<string, TextLayoutEngine>();
    private defaultFallback: FontFallback;

    constructor(document: PdfDocument) {
        this.document = document;
        this.fontRegistry = new FontRegistry(document);
        this.ttfRegistry = new TtfFontRegistry(document);

        // Set up default fallbacks
        this.defaultFallback = {
            families: ['Arial', 'Helvetica', 'sans-serif'],
            generic: 'sans-serif',
            characterSets: [
                {
                    start: 0x0000,
                    end: 0x007F,
                    families: ['Arial', 'Helvetica'],
                },
                {
                    start: 0x4E00,
                    end: 0x9FFF,
                    families: ['NotoSansCJK', 'SimSun'],
                },
            ],
        };
    }

    /**
     * Register a font with the manager
     */
    async registerFont(descriptor: FontDescriptor): Promise<void> {
        const key = this.getFontKey(descriptor.family, descriptor.weight, descriptor.style);

        // Load the font
        const parser = await FontLoader.loadFont(descriptor.source, descriptor.options);

        // Store parsed font
        this.parsedFonts.set(key, parser);

        // Register with registries
        await this.fontRegistry.registerFont(key, descriptor.source, descriptor.options);

        // Create TTF font object for PDF embedding
        if (descriptor.source instanceof ArrayBuffer) {
            this.ttfRegistry.registerTtfFont(descriptor.source, key);
        } else if (typeof descriptor.source === 'string') {
            // Load from file/URL and create TTF font
            const fontData = await this.loadFontData(descriptor.source);
            this.ttfRegistry.registerTtfFont(fontData, key);
        }

        // Store descriptor
        this.registeredFonts.set(key, descriptor);

        // Create layout engine
        const layoutEngine = new TextLayoutEngine(createFontAdapter(parser));
        this.layoutEngines.set(key, layoutEngine);
    }

    /**
     * Register multiple fonts from a font family
     */
    async registerFontFamily(
        family: string,
        fonts: Array<{
            weight?: FontWeight;
            style?: FontStyle;
            source: FontSource;
            options?: FontLoadOptions;
        }>
    ): Promise<void> {
        const promises = fonts.map(font =>
            this.registerFont({
                family,
                weight: font.weight ?? FontWeight.Normal,
                style: font.style ?? FontStyle.Normal,
                source: font.source,
                ...(font.options && { options: font.options }),
            })
        );

        await Promise.all(promises);
    }

    /**
     * Set font fallback configuration
     */
    setFontFallback(family: string, fallback: FontFallback): void {
        this.fontFallbacks.set(family, fallback);
    }

    /**
     * Get font parser by family and style
     */
    getFont(
        family: string,
        weight = FontWeight.Normal,
        style = FontStyle.Normal
    ): TtfParser | null {
        const key = this.getFontKey(family, weight, style);
        return this.parsedFonts.get(key) || null;
    }

    /**
     * Get font with fallback resolution
     */
    getFontWithFallback(
        family: string | string[],
        weight = FontWeight.Normal,
        style = FontStyle.Normal,
        charCode?: number
    ): TtfParser | null {
        const families = Array.isArray(family) ? family : [family];

        // Try each specified family
        for (const fam of families) {
            const font = this.getFont(fam, weight, style);
            if (font && (!charCode || font.isCharSupported(charCode))) {
                return font;
            }
        }

        // Try fallbacks
        for (const fam of families) {
            const fallback = this.fontFallbacks.get(fam) || this.defaultFallback;

            // Try character set specific fallbacks
            if (charCode && fallback.characterSets) {
                for (const charSet of fallback.characterSets) {
                    if (charCode >= charSet.start && charCode <= charSet.end) {
                        for (const fallbackFamily of charSet.families) {
                            const font = this.getFont(fallbackFamily, weight, style);
                            if (font && font.isCharSupported(charCode)) {
                                return font;
                            }
                        }
                    }
                }
            }

            // Try general fallbacks
            for (const fallbackFamily of fallback.families) {
                const font = this.getFont(fallbackFamily, weight, style);
                if (font && (!charCode || font.isCharSupported(charCode))) {
                    return font;
                }
            }
        }

        return null;
    }

    /**
     * Layout text with advanced typography
     */
    layoutText(
        text: string,
        style: TextStyleConfig,
        maxWidth: number,
        maxHeight?: number,
        layoutOptions?: TextLayoutOptions
    ): TextLayoutResult | null {
        const font = this.getFontWithFallback(
            style.fontFamily || 'sans-serif',
            style.fontWeight || FontWeight.Normal,
            style.fontStyle || FontStyle.Normal
        );

        if (!font) {
            return null;
        }

        const engine = new TextLayoutEngine(createFontAdapter(font), {
            fontSize: style.fontSize || 12,
            lineHeight: style.lineHeight || 1.2,
            letterSpacing: style.letterSpacing || 0,
            wordSpacing: style.wordSpacing || 0,
            ...layoutOptions,
        });

        return engine.layoutText(text, maxWidth, maxHeight);
    }

    /**
     * Measure text dimensions
     */
    measureText(text: string, style: TextStyleConfig): { width: number; height: number } {
        const font = this.getFontWithFallback(
            style.fontFamily || 'sans-serif',
            style.fontWeight || FontWeight.Normal,
            style.fontStyle || FontStyle.Normal
        );

        if (!font) {
            return { width: 0, height: 0 };
        }

        const fontSize = style.fontSize || 12;
        const width = font.measureText(text) * fontSize;
        const height = ((font.ascent - font.descent) / font.unitsPerEm) * fontSize;

        return { width, height };
    }

    /**
     * Get font metrics
     */
    getFontMetrics(
        family: string,
        weight = FontWeight.Normal,
        style = FontStyle.Normal
    ): FontMetrics | null {
        const font = this.getFont(family, weight, style);
        if (!font) return null;

        return {
            family,
            unitsPerEm: font.unitsPerEm,
            ascender: font.ascent,
            descender: font.descent,
            lineGap: font.lineGap,
            boundingBox: font.boundingBox,
            glyphCount: font.numGlyphs,
            characterRanges: this.getCharacterRanges(font),
        };
    }

    /**
     * Create font subset for used characters
     */
    createFontSubset(
        family: string,
        usedTexts: string[],
        weight = FontWeight.Normal,
        style = FontStyle.Normal
    ): ArrayBuffer | null {
        const descriptor = this.registeredFonts.get(this.getFontKey(family, weight, style));
        if (!descriptor || !(descriptor.source instanceof ArrayBuffer)) {
            return null;
        }

        return createFontSubsetFromText(descriptor.source, usedTexts);
    }

    /**
     * Get all registered font families
     */
    getRegisteredFamilies(): string[] {
        const families = new Set<string>();
        for (const descriptor of this.registeredFonts.values()) {
            families.add(descriptor.family);
        }
        return Array.from(families).sort();
    }

    /**
     * Get available weights for a font family
     */
    getAvailableWeights(family: string): FontWeight[] {
        const weights = new Set<FontWeight>();
        for (const [key, descriptor] of this.registeredFonts.entries()) {
            if (descriptor.family === family) {
                weights.add(descriptor.weight || FontWeight.Normal);
            }
        }
        return Array.from(weights).sort();
    }

    /**
     * Get available styles for a font family
     */
    getAvailableStyles(family: string): FontStyle[] {
        const styles = new Set<FontStyle>();
        for (const [key, descriptor] of this.registeredFonts.entries()) {
            if (descriptor.family === family) {
                styles.add(descriptor.style || FontStyle.Normal);
            }
        }
        return Array.from(styles);
    }

    /**
     * Clear all registered fonts
     */
    clear(): void {
        this.registeredFonts.clear();
        this.parsedFonts.clear();
        this.layoutEngines.clear();
        this.fontRegistry.clear();
        this.ttfRegistry.clear();
        FontLoader.clearCache();
    }

    /**
     * Get font loading statistics
     */
    getStats() {
        return {
            registeredFonts: this.registeredFonts.size,
            loadedParsers: this.parsedFonts.size,
            layoutEngines: this.layoutEngines.size,
            fontLoader: FontLoader.getStats(),
        };
    }

    /**
     * Generate font key
     */
    private getFontKey(
        family: string,
        weight = FontWeight.Normal,
        style = FontStyle.Normal
    ): string {
        return `${family}-${weight}-${style}`;
    }

    /**
     * Load font data from source
     */
    private async loadFontData(source: string): Promise<ArrayBuffer> {
        if (typeof window !== 'undefined') {
            // Browser environment
            const response = await fetch(source);
            return response.arrayBuffer();
        } else {
            // Node.js environment
            const fs = await import('fs');
            const data = await fs.promises.readFile(source);
            return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
    }

    /**
     * Get character ranges supported by font
     */
    private getCharacterRanges(font: TtfParser): Array<{ start: number; end: number; description: string }> {
        const supportedChars = font.getSupportedChars();
        if (supportedChars.length === 0) return [];

        supportedChars.sort((a, b) => a - b);

        const ranges: Array<{ start: number; end: number; description: string }> = [];
        let currentStart = supportedChars[0]!;
        let currentEnd = supportedChars[0]!;

        for (let i = 1; i < supportedChars.length; i++) {
            const char = supportedChars[i]!;
            if (char === currentEnd + 1) {
                currentEnd = char;
            } else {
                ranges.push({
                    start: currentStart,
                    end: currentEnd,
                    description: this.getUnicodeBlockName(currentStart),
                });
                currentStart = char;
                currentEnd = char;
            }
        }

        // Add final range
        ranges.push({
            start: currentStart,
            end: currentEnd,
            description: this.getUnicodeBlockName(currentStart),
        });

        return ranges;
    }

    /**
     * Get Unicode block name for character
     */
    private getUnicodeBlockName(charCode: number): string {
        if (charCode >= 0x0000 && charCode <= 0x007F) return 'Basic Latin';
        if (charCode >= 0x0080 && charCode <= 0x00FF) return 'Latin-1 Supplement';
        if (charCode >= 0x0100 && charCode <= 0x017F) return 'Latin Extended-A';
        if (charCode >= 0x0180 && charCode <= 0x024F) return 'Latin Extended-B';
        if (charCode >= 0x4E00 && charCode <= 0x9FFF) return 'CJK Unified Ideographs';
        if (charCode >= 0x3040 && charCode <= 0x309F) return 'Hiragana';
        if (charCode >= 0x30A0 && charCode <= 0x30FF) return 'Katakana';
        return 'Unknown';
    }
}

/**
 * Font style utilities
 */
export class FontStyleUtils {
    /**
     * Parse CSS font-weight to FontWeight enum
     */
    static parseFontWeight(weight: string | number): FontWeight {
        if (typeof weight === 'number') {
            return Math.round(weight / 100) * 100 as FontWeight;
        }

        switch (weight.toLowerCase()) {
            case 'thin': return FontWeight.Thin;
            case 'extra-light': case 'ultralight': return FontWeight.ExtraLight;
            case 'light': return FontWeight.Light;
            case 'normal': case 'regular': return FontWeight.Normal;
            case 'medium': return FontWeight.Medium;
            case 'semi-bold': case 'semibold': return FontWeight.SemiBold;
            case 'bold': return FontWeight.Bold;
            case 'extra-bold': case 'ultrabold': return FontWeight.ExtraBold;
            case 'black': case 'heavy': return FontWeight.Black;
            default: return FontWeight.Normal;
        }
    }

    /**
     * Parse CSS font-style to FontStyle enum
     */
    static parseFontStyle(style: string): FontStyle {
        switch (style.toLowerCase()) {
            case 'italic': return FontStyle.Italic;
            case 'oblique': return FontStyle.Oblique;
            case 'normal': default: return FontStyle.Normal;
        }
    }

    /**
     * Create text style from CSS-like properties
     */
    static createTextStyle(css: {
        fontFamily?: string;
        fontSize?: string | number;
        fontWeight?: string | number;
        fontStyle?: string;
        lineHeight?: string | number;
        letterSpacing?: string | number;
        color?: string;
    }): TextStyleConfig {
        const result: TextStyleConfig = {};

        if (css.fontFamily) {
            result.fontFamily = css.fontFamily;
        }

        if (css.fontSize !== undefined) {
            result.fontSize = typeof css.fontSize === 'string'
                ? parseFloat(css.fontSize)
                : css.fontSize;
        }

        if (css.fontWeight !== undefined) {
            result.fontWeight = FontStyleUtils.parseFontWeight(css.fontWeight);
        }

        if (css.fontStyle !== undefined) {
            result.fontStyle = FontStyleUtils.parseFontStyle(css.fontStyle);
        }

        if (css.lineHeight !== undefined) {
            result.lineHeight = typeof css.lineHeight === 'string'
                ? parseFloat(css.lineHeight)
                : css.lineHeight;
        }

        if (css.letterSpacing !== undefined) {
            result.letterSpacing = typeof css.letterSpacing === 'string'
                ? parseFloat(css.letterSpacing)
                : css.letterSpacing;
        }

        if (css.color !== undefined) {
            result.color = css.color;
        }

        return result;
    }
}

/**
 * Predefined font collections
 */
export class FontCollections {
    /**
     * Web safe font stack
     */
    static readonly WEB_SAFE = {
        serif: ['Times', 'Times New Roman', 'serif'],
        sansSerif: ['Arial', 'Helvetica', 'sans-serif'],
        monospace: ['Courier', 'Courier New', 'monospace'],
    };

    /**
     * System font stacks
     */
    static readonly SYSTEM = {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    };

    /**
     * Google Fonts popular stacks
     */
    static readonly GOOGLE = {
        openSans: ['Open Sans', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        sourceSerif: ['Source Serif Pro', 'serif'],
    };
}